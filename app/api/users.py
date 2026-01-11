"""
User/Profile API endpoints.

This module provides RESTful API endpoints for user profile management,
OAuth provider linking, and admin user management.
"""

from flask import request
from app.api import api_bp
from app.api.errors import success_response, error_response
from app.api.decorators import jwt_required_with_user, jwt_required_role
from app.models import User, UserRole, CampMember, AssociationStatus, EventRegistration
from app import db
from app.auth.email import send_email_change_verification


def serialize_user_profile(user):
    """Serialize user profile to dictionary."""
    return {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'preferred_name': user.preferred_name,
        'show_full_name': user.show_full_name,
        'pronouns': user.pronouns,
        'show_pronouns': user.show_pronouns,
        'picture': user.picture,
        'role': user.role,
        'email_verified': user.email_verified,
        'is_active': user.is_active,
        'theme_preference': user.theme_preference,
        'home_phone': user.home_phone,
        'mobile_phone': user.mobile_phone,
        'work_phone': user.work_phone,
        'address_line1': user.address_line1,
        'address_line2': user.address_line2,
        'city': user.city,
        'state': user.state,
        'zip_code': user.zip_code,
        'country': user.country,
        'has_password_auth': user.has_password_auth,
        'has_oauth_auth': user.has_oauth_auth,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login': user.last_login.isoformat() if user.last_login else None
    }


def serialize_oauth_provider(provider):
    """Serialize OAuth provider to dictionary."""
    return {
        'id': provider.id,
        'provider_name': provider.provider_name,
        'created_at': provider.created_at.isoformat() if provider.created_at else None
    }


def serialize_camp_membership(membership):
    """Serialize camp membership to dictionary."""
    return {
        'id': membership.id,
        'camp': {
            'id': membership.camp.id,
            'name': membership.camp.name,
            'description': membership.camp.description
        },
        'status': membership.status,
        'role': membership.role,
        'requested_at': membership.requested_at.isoformat() if membership.requested_at else None,
        'approved_at': membership.approved_at.isoformat() if membership.approved_at else None
    }


def serialize_event_registration(registration):
    """Serialize event registration to dictionary."""
    return {
        'id': registration.id,
        'event': {
            'id': registration.event.id,
            'title': registration.event.title,
            'description': registration.event.description,
            'location': registration.event.location,
            'start_date': registration.event.start_date.isoformat() if registration.event.start_date else None,
            'end_date': registration.event.end_date.isoformat() if registration.event.end_date else None,
            'status': registration.event.status,
            'has_early_arrival': registration.event.has_early_arrival,
            'early_arrival_days': registration.event.early_arrival_days,
            'has_late_departure': registration.event.has_late_departure,
            'late_departure_days': registration.event.late_departure_days,
            'has_vehicle_access': registration.event.has_vehicle_access
        },
        'has_ticket': registration.has_ticket,
        'opted_early_arrival': registration.opted_early_arrival,
        'opted_late_departure': registration.opted_late_departure,
        'opted_vehicle_access': registration.opted_vehicle_access,
        'created_at': registration.created_at.isoformat() if registration.created_at else None,
        'updated_at': registration.updated_at.isoformat() if registration.updated_at else None
    }


@api_bp.route('/users/me/profile', methods=['GET'])
@jwt_required_with_user
def get_my_profile(current_user):
    """
    Get current user's profile.

    Returns:
        200: User profile data
    """
    # Get linked OAuth providers
    oauth_providers = current_user.oauth_providers.all()

    # Get camp memberships
    approved_camps = CampMember.query.filter_by(
        user_id=current_user.id,
        status=AssociationStatus.APPROVED.value
    ).all()

    pending_camps = CampMember.query.filter_by(
        user_id=current_user.id,
        status=AssociationStatus.PENDING.value
    ).all()

    # Get event registrations
    event_registrations = EventRegistration.query.filter_by(
        user_id=current_user.id
    ).all()

    return success_response(data={
        'profile': serialize_user_profile(current_user),
        'oauth_providers': [serialize_oauth_provider(p) for p in oauth_providers],
        'camp_memberships': {
            'approved': [serialize_camp_membership(m) for m in approved_camps],
            'pending': [serialize_camp_membership(m) for m in pending_camps]
        },
        'event_registrations': [serialize_event_registration(r) for r in event_registrations]
    })


@api_bp.route('/users/me/profile', methods=['PUT'])
@jwt_required_with_user
def update_my_profile(current_user):
    """
    Update current user's profile.

    Request body:
        {
            "first_name": "John",
            "last_name": "Doe",
            "preferred_name": "JD",
            "show_full_name": true,
            "pronouns": "he/him",
            "show_pronouns": true,
            "home_phone": "555-1234",
            "mobile_phone": "555-5678",
            "work_phone": "555-9012",
            "address_line1": "123 Main St",
            "address_line2": "Apt 4",
            "city": "Portland",
            "state": "OR",
            "zip_code": "97201",
            "country": "US"
        }

    Returns:
        200: Profile updated successfully
        400: Validation error
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Update basic profile fields
    if 'first_name' in data:
        current_user.first_name = data['first_name'].strip() if data['first_name'] else None

    if 'last_name' in data:
        current_user.last_name = data['last_name'].strip() if data['last_name'] else None

    if 'preferred_name' in data:
        current_user.preferred_name = data['preferred_name'].strip() if data['preferred_name'] else None

    if 'show_full_name' in data:
        current_user.show_full_name = bool(data['show_full_name'])

    if 'pronouns' in data:
        current_user.pronouns = data['pronouns'].strip() if data['pronouns'] else None

    if 'show_pronouns' in data:
        current_user.show_pronouns = bool(data['show_pronouns'])

    # Update contact information
    if 'home_phone' in data:
        current_user.home_phone = data['home_phone'].strip() if data['home_phone'] else None

    if 'mobile_phone' in data:
        current_user.mobile_phone = data['mobile_phone'].strip() if data['mobile_phone'] else None

    if 'work_phone' in data:
        current_user.work_phone = data['work_phone'].strip() if data['work_phone'] else None

    # Update address
    if 'address_line1' in data:
        current_user.address_line1 = data['address_line1'].strip() if data['address_line1'] else None

    if 'address_line2' in data:
        current_user.address_line2 = data['address_line2'].strip() if data['address_line2'] else None

    if 'city' in data:
        current_user.city = data['city'].strip() if data['city'] else None

    if 'state' in data:
        current_user.state = data['state'].strip() if data['state'] else None

    if 'zip_code' in data:
        current_user.zip_code = data['zip_code'].strip() if data['zip_code'] else None

    if 'country' in data:
        country = data['country'].strip()
        if country:
            current_user.country = country

    # Update theme preference
    if 'theme_preference' in data:
        theme = data['theme_preference']
        if theme not in ['light', 'dark']:
            return error_response('Theme preference must be "light" or "dark"'), 400
        current_user.theme_preference = theme

    db.session.commit()

    return success_response(
        data={'profile': serialize_user_profile(current_user)},
        message='Your profile has been updated successfully!'
    )


@api_bp.route('/users/me/change-email', methods=['POST'])
@jwt_required_with_user
def request_email_change(current_user):
    """
    Request email address change.

    Sends verification email to new address.

    Request body:
        {
            "new_email": "newemail@example.com"
        }

    Returns:
        200: Verification email sent
        400: Validation error or email already in use
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    new_email = data.get('new_email', '').lower().strip()

    if not new_email:
        return error_response('New email is required'), 400

    # Check if email is already in use
    existing_user = User.query.filter_by(email=new_email).first()
    if existing_user:
        return error_response('This email address is already in use'), 400

    # Send verification email
    send_email_change_verification(current_user, new_email)

    return success_response(
        message=f'A verification email has been sent to {new_email}. Please check your inbox to complete the email change.'
    )


@api_bp.route('/users/me/verify-email-change/<token>', methods=['POST'])
def verify_email_change(token):
    """
    Verify email change using token from email.

    Args:
        token: Email change verification token

    Returns:
        200: Email changed successfully
        400: Invalid or expired token
    """
    # Find user by email change token
    user = User.query.filter_by(email_change_token=token).first()

    if not user:
        return error_response('Invalid or expired verification link'), 400

    # Check if token is expired (24 hours)
    if not user.verify_token_expiry(user.email_change_sent_at, 24):
        return error_response('Verification link has expired. Please request a new one.'), 400

    # Complete email change
    old_email = user.email
    new_email = user.email_change_new_email

    user.email = new_email
    user.email_change_token = None
    user.email_change_new_email = None
    user.email_change_sent_at = None
    db.session.commit()

    return success_response(
        message=f'Your email has been successfully changed from {old_email} to {new_email}!'
    )


@api_bp.route('/users', methods=['GET'])
@jwt_required_role(UserRole.GLOBAL_ADMIN)
def list_users(current_user):
    """
    List all users (GLOBAL_ADMIN only).

    Returns:
        200: List of all users
    """
    users = User.query.order_by(User.created_at.desc()).all()

    return success_response(data={
        'users': [serialize_user_profile(user) for user in users]
    })


@api_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required_role(UserRole.GLOBAL_ADMIN)
def change_user_role(current_user, user_id):
    """
    Change user's role (GLOBAL_ADMIN only).

    Args:
        user_id: ID of the user to update

    Request body:
        {
            "role": "event_manager"
        }

    Returns:
        200: Role updated successfully
        400: Validation error
        403: Cannot change own role
        404: User not found
    """
    user = User.query.get_or_404(user_id)

    # Prevent changing own role
    if user.id == current_user.id:
        return error_response('You cannot change your own role'), 403

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    new_role = data.get('role')

    if not new_role:
        return error_response('Role is required'), 400

    # Validate role
    valid_roles = [role.value for role in UserRole]
    if new_role not in valid_roles:
        return error_response(f'Invalid role. Must be one of: {", ".join(valid_roles)}'), 400

    user.role = new_role
    db.session.commit()

    return success_response(
        data={'user': serialize_user_profile(user)},
        message=f'User role updated to {new_role}'
    )


@api_bp.route('/users/me/event-registrations', methods=['POST'])
@jwt_required_with_user
def register_for_event(current_user):
    """
    Register current user for an event.

    Request body:
        {
            "event_id": 1,
            "has_ticket": false,
            "opted_early_arrival": false,
            "opted_late_departure": false,
            "opted_vehicle_access": false
        }

    Returns:
        201: Event registration created
        400: Validation error or already registered
    """
    from app.models import Event

    data = request.get_json()
    event_id = data.get('event_id')

    if not event_id:
        return error_response('Event ID is required'), 400

    # Check if event exists
    event = Event.query.get(event_id)
    if not event:
        return error_response('Event not found'), 404

    # Check if already registered
    existing = EventRegistration.query.filter_by(
        user_id=current_user.id,
        event_id=event_id
    ).first()

    if existing:
        return error_response('Already registered for this event'), 400

    # Create registration
    registration = EventRegistration(
        user_id=current_user.id,
        event_id=event_id,
        has_ticket=data.get('has_ticket', False),
        opted_early_arrival=data.get('opted_early_arrival', False),
        opted_late_departure=data.get('opted_late_departure', False),
        opted_vehicle_access=data.get('opted_vehicle_access', False)
    )

    db.session.add(registration)
    db.session.commit()

    return success_response(
        data={'registration': serialize_event_registration(registration)},
        message='Successfully registered for event'
    ), 201


@api_bp.route('/users/me/event-registrations/<int:registration_id>', methods=['PUT'])
@jwt_required_with_user
def update_event_registration(current_user, registration_id):
    """
    Update an event registration.

    Request body:
        {
            "has_ticket": true,
            "opted_early_arrival": true,
            "opted_late_departure": false,
            "opted_vehicle_access": true
        }

    Returns:
        200: Event registration updated
        403: Not authorized
        404: Registration not found
    """
    registration = EventRegistration.query.get(registration_id)

    if not registration:
        return error_response('Registration not found'), 404

    if registration.user_id != current_user.id:
        return error_response('Not authorized to update this registration'), 403

    data = request.get_json()

    # Update fields
    if 'has_ticket' in data:
        registration.has_ticket = data['has_ticket']
    if 'opted_early_arrival' in data:
        registration.opted_early_arrival = data['opted_early_arrival']
    if 'opted_late_departure' in data:
        registration.opted_late_departure = data['opted_late_departure']
    if 'opted_vehicle_access' in data:
        registration.opted_vehicle_access = data['opted_vehicle_access']

    db.session.commit()

    return success_response(
        data={'registration': serialize_event_registration(registration)},
        message='Registration updated successfully'
    )


@api_bp.route('/users/me/event-registrations/<int:registration_id>', methods=['DELETE'])
@jwt_required_with_user
def delete_event_registration(current_user, registration_id):
    """
    Delete an event registration.

    Returns:
        200: Registration deleted
        403: Not authorized
        404: Registration not found
    """
    registration = EventRegistration.query.get(registration_id)

    if not registration:
        return error_response('Registration not found'), 404

    if registration.user_id != current_user.id:
        return error_response('Not authorized to delete this registration'), 403

    db.session.delete(registration)
    db.session.commit()

    return success_response(message='Registration deleted successfully')


@api_bp.route('/users/me', methods=['DELETE'])
@jwt_required_with_user
def delete_own_account(current_user):
    """
    Delete current user's own account.

    This is a self-service account deletion that permanently removes the user
    and all associated data including:
    - Camp memberships
    - Event registrations
    - Inventory items
    - OAuth provider links

    Returns:
        200: Account deleted successfully
    """
    user_email = current_user.email

    try:
        # The cascade delete on relationships will automatically remove:
        # - OAuthProvider entries
        # - CampMember entries
        # - EventRegistration entries
        # - InventoryItem entries
        db.session.delete(current_user)
        db.session.commit()

        return success_response(
            message=f'Your account ({user_email}) has been permanently deleted'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to delete account: {str(e)}', 500)
