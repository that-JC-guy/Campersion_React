"""
Authentication API endpoints.

This module provides RESTful API endpoints for authentication including
email/password login, registration, OAuth, and JWT token management.
"""

from flask import request, jsonify, redirect, current_app, make_response
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, set_access_cookies, set_refresh_cookies,
    unset_jwt_cookies
)
from app.api import api_bp
from app.api.errors import success_response, error_response, ValidationError, AuthenticationError
from app.api.decorators import jwt_required_with_user
from app.models import User
from app import db, oauth
from app.auth.utils import link_or_create_user, parse_google_userinfo, parse_microsoft_userinfo
from app.auth.email import send_verification_email, send_password_reset_email


# Helper function to serialize user data
def serialize_user(user):
    """Serialize user object to dictionary for JSON response."""
    return {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'preferred_name': user.preferred_name,
        'role': user.role,
        'is_active': user.is_active,
        'theme_preference': user.theme_preference,
        'email_verified': user.email_verified,
        'picture': user.picture,
        'has_password_auth': user.has_password_auth,
        'has_oauth_auth': user.has_oauth_auth,
        'last_login': user.last_login.isoformat() if user.last_login else None
    }


@api_bp.route('/auth/register', methods=['POST'])
def register():
    """
    Register new user with email and password.

    Request body:
        {
            "email": "user@example.com",
            "name": "Full Name",
            "password": "password123"
        }

    Returns:
        201: User created successfully, verification email sent
        400: Validation error or email already exists
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Validate required fields
    email = data.get('email', '').lower().strip()
    name = data.get('name', '').strip()
    password = data.get('password', '')

    if not email or not name or not password:
        return error_response('Email, name, and password are required'), 400

    # Validate password length
    if len(password) < 8:
        return error_response('Password must be at least 8 characters long'), 400

    # Check if email already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return error_response('Email already registered'), 400

    # Create new user
    user = User(
        email=email,
        name=name,
        email_verified=False,
        is_active=True  # New users are active by default
    )
    user.set_password(password)

    # Save user to database
    db.session.add(user)
    db.session.commit()

    # Send verification email
    send_verification_email(user)

    return success_response(
        data={'user': serialize_user(user)},
        message='Account created! Please check your email to verify your account.',
        status_code=201
    )


@api_bp.route('/auth/login', methods=['POST'])
def login():
    """
    Login with email and password.

    Request body:
        {
            "email": "user@example.com",
            "password": "password123",
            "remember_me": true  // optional
        }

    Returns:
        200: Login successful, JWT tokens set in cookies
        401: Invalid credentials or email not verified
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    remember_me = data.get('remember_me', False)

    if not email or not password:
        return error_response('Email and password are required'), 400

    # Find user by email
    user = User.query.filter_by(email=email).first()

    # Check if user exists and password is correct
    if not user or not user.check_password(password):
        return error_response('Invalid email or password'), 401

    # Check if email is verified
    if not user.email_verified:
        return error_response(
            'Please verify your email address before logging in. Check your inbox for the verification link.'
        ), 401

    # Update last login
    user.update_last_login()
    db.session.commit()

    # Create JWT tokens
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    # Create response
    response = make_response(success_response(
        data={'user': serialize_user(user)},
        message='Successfully logged in!'
    ))

    # Set JWT tokens in httpOnly cookies
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)

    return response


@api_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token.

    Requires valid refresh token in cookies.

    Returns:
        200: New access token set in cookies
        401: Invalid or missing refresh token
    """
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)

    response = make_response(success_response(
        message='Token refreshed successfully'
    ))

    set_access_cookies(response, access_token)
    return response


@api_bp.route('/auth/logout', methods=['POST'])
def logout():
    """
    Logout current user by clearing JWT cookies.

    Returns:
        200: Logout successful
    """
    response = make_response(success_response(
        message='Successfully logged out'
    ))

    # Clear JWT cookies
    unset_jwt_cookies(response)
    return response


@api_bp.route('/auth/me', methods=['GET'])
@jwt_required_with_user
def get_current_user(current_user):
    """
    Get current authenticated user information.

    Requires valid access token in cookies.

    Returns:
        200: User data
        401: Not authenticated
        404: User not found
    """
    return success_response(data={'user': serialize_user(current_user)})


@api_bp.route('/auth/verify-email/<token>', methods=['POST'])
def verify_email(token):
    """
    Verify email address using token from email.

    Args:
        token: Email verification token from URL

    Returns:
        200: Email verified successfully
        400: Invalid or expired token
    """
    # Find user by verification token
    user = User.query.filter_by(email_verification_token=token).first()

    if not user:
        return error_response('Invalid or expired verification link'), 400

    # Check if token is expired
    if not user.verify_token_expiry(
        user.email_verification_sent_at,
        current_app.config['EMAIL_VERIFICATION_EXPIRY_HOURS']
    ):
        return error_response(
            'Verification link has expired. Please request a new one.'
        ), 400

    # Mark email as verified
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_sent_at = None
    db.session.commit()

    return success_response(
        message='Email verified successfully! You can now log in.'
    )


@api_bp.route('/auth/resend-verification', methods=['POST'])
def resend_verification():
    """
    Resend email verification link.

    Request body:
        {
            "email": "user@example.com"
        }

    Returns:
        200: Verification email sent (if email exists and not verified)
        400: No email provided
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    email = data.get('email', '').lower().strip()

    if not email:
        return error_response('Email is required'), 400

    user = User.query.filter_by(email=email).first()

    # Always show same message to prevent email enumeration
    message = 'If that email is registered and not yet verified, we\'ve sent a new verification link.'

    if user and not user.email_verified:
        send_verification_email(user)

    return success_response(message=message)


@api_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request password reset link.

    Request body:
        {
            "email": "user@example.com"
        }

    Returns:
        200: Reset email sent (if email exists)
        400: No email provided
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    email = data.get('email', '').lower().strip()

    if not email:
        return error_response('Email is required'), 400

    user = User.query.filter_by(email=email).first()

    # Always show same message to prevent email enumeration
    message = 'If that email is registered, we\'ve sent password reset instructions.'

    # Only send email if user exists and has password auth
    if user and user.has_password_auth:
        send_password_reset_email(user)

    return success_response(message=message)


@api_bp.route('/auth/reset-password/<token>', methods=['POST'])
def reset_password(token):
    """
    Reset password using token from email.

    Args:
        token: Password reset token from URL

    Request body:
        {
            "password": "newpassword123"
        }

    Returns:
        200: Password reset successfully
        400: Invalid or expired token, or validation error
    """
    # Find user by reset token
    user = User.query.filter_by(password_reset_token=token).first()

    if not user:
        return error_response('Invalid or expired reset link'), 400

    # Check if token is expired
    if not user.verify_token_expiry(
        user.password_reset_sent_at,
        current_app.config['PASSWORD_RESET_EXPIRY_HOURS']
    ):
        return error_response('Reset link has expired. Please request a new one.'), 400

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    password = data.get('password', '')

    if not password:
        return error_response('Password is required'), 400

    if len(password) < 8:
        return error_response('Password must be at least 8 characters long'), 400

    # Set new password
    user.set_password(password)

    # Clear reset token
    user.password_reset_token = None
    user.password_reset_sent_at = None

    db.session.commit()

    return success_response(
        message='Password reset successfully! You can now log in with your new password.'
    )


@api_bp.route('/auth/oauth/authorize/<provider>', methods=['GET'])
def oauth_authorize(provider):
    """
    Initiate OAuth 2.0 authorization flow for specified provider.

    Args:
        provider: OAuth provider name ('google' or 'microsoft')

    Returns:
        Redirect to OAuth provider's authorization URL
        400: Invalid provider
    """
    # Validate provider
    if provider not in ['google', 'microsoft']:
        return error_response('Invalid OAuth provider'), 400

    # Get the OAuth client for this provider
    oauth_client = oauth.create_client(provider)

    # Build the callback URL where OAuth provider will redirect after authentication
    redirect_uri = f"{current_app.config['OAUTH_REDIRECT_BASE']}/api/v1/auth/oauth/callback/{provider}"

    # Redirect to provider's authorization page
    # Authlib automatically adds state parameter for CSRF protection
    return oauth_client.authorize_redirect(redirect_uri)


@api_bp.route('/auth/oauth/callback/<provider>', methods=['GET'])
def oauth_callback(provider):
    """
    Handle OAuth 2.0 callback from provider.

    After user authenticates with the OAuth provider, they are redirected
    back to this route with an authorization code. This function:
    1. Exchanges the authorization code for an access token
    2. Fetches user profile information using the access token
    3. Links the OAuth account to existing user or creates new user
    4. Creates JWT tokens
    5. Redirects to React app with success status

    Args:
        provider: OAuth provider name ('google' or 'microsoft')

    Returns:
        Redirect to React app with JWT tokens in cookies
    """
    # Validate provider
    if provider not in ['google', 'microsoft']:
        return redirect(f"{current_app.config['FRONTEND_URL']}/login?error=invalid_provider")

    try:
        # Get the OAuth client for this provider
        oauth_client = oauth.create_client(provider)

        # Exchange authorization code for access token
        if provider == 'microsoft':
            # Microsoft /common endpoint requires special handling for issuer validation
            token = oauth_client.authorize_access_token(
                claims_options={
                    "iss": {"essential": False}
                }
            )
        else:
            token = oauth_client.authorize_access_token()

        # Fetch user profile information using the access token
        if provider == 'google':
            userinfo = oauth_client.userinfo()
            user_data = parse_google_userinfo(userinfo)

        elif provider == 'microsoft':
            userinfo = oauth_client.get('https://graph.microsoft.com/v1.0/me').json()
            current_app.logger.info(f'Microsoft userinfo response: {userinfo}')
            user_data = parse_microsoft_userinfo(userinfo)
            current_app.logger.info(f'Parsed user_data: {user_data}')

        # Validate that we received essential user information
        if not user_data.get('email') or not user_data.get('provider_user_id'):
            current_app.logger.error(
                f'Missing user data - email: {user_data.get("email")}, '
                f'provider_user_id: {user_data.get("provider_user_id")}'
            )
            return redirect(f"{current_app.config['FRONTEND_URL']}/login?error=missing_user_data")

        # Link OAuth account to user or create new user
        user = link_or_create_user(
            email=user_data['email'],
            name=user_data.get('name', 'User'),
            picture=user_data.get('picture'),
            provider=provider,
            provider_user_id=user_data['provider_user_id']
        )

        # Update last login
        user.update_last_login()
        db.session.commit()

        # Create JWT tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        # Create redirect response to React app
        response = make_response(
            redirect(f"{current_app.config['FRONTEND_URL']}/auth/callback?success=true")
        )

        # Set JWT tokens in httpOnly cookies
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)

        return response

    except Exception as e:
        # Log the error
        current_app.logger.error(f'OAuth error for {provider}: {str(e)}')

        # Redirect to React app with error
        return redirect(f"{current_app.config['FRONTEND_URL']}/login?error=oauth_failed")
