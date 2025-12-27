"""
Application factory module.

This module implements the Flask application factory pattern.
It initializes and configures all Flask extensions (SQLAlchemy, Flask-Login,
Flask-Migrate, Authlib OAuth) and registers application blueprints.
"""

from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from config import config

# Initialize Flask extensions
# These are initialized here but configured in create_app()
db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()
mail = Mail()
jwt = JWTManager()
cors = CORS()
oauth = OAuth()


def create_app(config_name='development'):
    """
    Application factory function.

    Creates and configures a Flask application instance based on the
    specified configuration name (development, production, or testing).

    Args:
        config_name (str): Configuration environment name. Defaults to 'development'.

    Returns:
        Flask: Configured Flask application instance.
    """

    # Create Flask application instance
    app = Flask(__name__)

    # Load configuration from config.py based on environment
    app.config.from_object(config[config_name])

    # Initialize Flask extensions with the app
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    jwt.init_app(app)

    # Initialize CORS with configuration
    cors.init_app(
        app,
        origins=app.config['CORS_ORIGINS'],
        supports_credentials=app.config['CORS_SUPPORTS_CREDENTIALS']
    )

    oauth.init_app(app)

    # Configure Flask-Login
    login_manager.login_view = 'auth.login'  # Redirect to login page if not authenticated
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'

    # User loader callback for Flask-Login
    # This tells Flask-Login how to load a user from the session
    @login_manager.user_loader
    def load_user(user_id):
        """
        Load user by ID from database.

        Flask-Login calls this function to reload the user object from
        the user ID stored in the session.

        Args:
            user_id (str): The user ID stored in the session.

        Returns:
            User: User object or None if not found.
        """
        from app.models import User
        return User.query.get(int(user_id))

    # Configure OAuth providers using Authlib
    configure_oauth(app)

    # Register blueprints
    register_blueprints(app)

    # Register error handlers
    register_error_handlers(app)

    # Register context processors
    register_context_processors(app)

    return app


def configure_oauth(app):
    """
    Configure OAuth 2.0 providers (Google and Microsoft).

    Registers OAuth clients with Authlib using configuration values
    from the Flask app config.

    Args:
        app (Flask): Flask application instance.
    """

    # Register Google OAuth 2.0 client
    oauth.register(
        name='google',
        client_id=app.config['GOOGLE_CLIENT_ID'],
        client_secret=app.config['GOOGLE_CLIENT_SECRET'],
        server_metadata_url=app.config['GOOGLE_DISCOVERY_URL'],
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

    # Register Microsoft OAuth 2.0 client
    # Using OpenID Connect discovery URL for automatic configuration
    # Note: Using /common endpoint to support both personal and organizational accounts
    oauth.register(
        name='microsoft',
        client_id=app.config['MICROSOFT_CLIENT_ID'],
        client_secret=app.config['MICROSOFT_CLIENT_SECRET'],
        server_metadata_url='https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
        client_kwargs={
            # Include User.Read scope for Microsoft Graph API access
            'scope': 'openid email profile User.Read',
            # Skip issuer validation since /common endpoint has variable issuer
            'token_endpoint_auth_method': 'client_secret_post'
        },
        # Disable strict issuer validation for /common endpoint
        authorize_params={
            'response_type': 'code'
        }
    )


def register_error_handlers(app):
    """
    Register error handlers for common HTTP errors.

    Provides custom error pages for 403 Forbidden and 404 Not Found errors.

    Args:
        app (Flask): Flask application instance.
    """

    @app.errorhandler(403)
    def forbidden(e):
        """Handle 403 Forbidden errors."""
        return render_template('errors/403.html'), 403

    @app.errorhandler(404)
    def not_found(e):
        """Handle 404 Not Found errors."""
        return render_template('errors/404.html'), 404


def register_blueprints(app):
    """
    Register application blueprints.

    Blueprints organize the application into modular components.
    This function imports and registers all application blueprints.

    Args:
        app (Flask): Flask application instance.
    """

    # Import blueprints
    from app.auth import auth_bp
    from app.main import main_bp
    from app.admin import admin_bp
    from app.events import events_bp
    from app.camps import camps_bp
    from app.api import api_bp

    # Register API blueprint (REST API for React frontend)
    # All API routes will be prefixed with /api/v1
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # Register authentication blueprint
    # All auth routes will be prefixed with /auth
    app.register_blueprint(auth_bp, url_prefix='/auth')

    # Register main blueprint
    # Main routes have no prefix (e.g., /, /dashboard)
    app.register_blueprint(main_bp)

    # Register admin blueprint
    # All admin routes will be prefixed with /admin
    app.register_blueprint(admin_bp, url_prefix='/admin')

    # Register events blueprint
    # All events routes will be prefixed with /events
    app.register_blueprint(events_bp, url_prefix='/events')

    # Register camps blueprint
    # All camps routes will be prefixed with /camps
    app.register_blueprint(camps_bp, url_prefix='/camps')


def register_context_processors(app):
    """
    Register template context processors.

    Context processors inject variables into all templates automatically.
    This adds pending approval counts for the current user.

    Args:
        app (Flask): Flask application instance.
    """
    from flask_login import current_user
    from app.models import CampMember, CampEventAssociation, AssociationStatus, Camp, Event

    @app.context_processor
    def inject_approval_counts():
        """Inject pending approval counts into all templates."""
        if not current_user.is_authenticated:
            return {}

        # Count pending camp member requests (where user is camp manager)
        managed_camp_ids = [m.camp_id for m in CampMember.query.filter_by(
            user_id=current_user.id,
            status=AssociationStatus.APPROVED.value,
            role='manager'
        ).all()]

        pending_camp_members = CampMember.query.filter(
            CampMember.camp_id.in_(managed_camp_ids),
            CampMember.status == AssociationStatus.PENDING.value
        ).count() if managed_camp_ids else 0

        # Count pending camp-event association requests (where user is event creator)
        created_event_ids = [e.id for e in Event.query.filter_by(
            creator_id=current_user.id
        ).all()]

        pending_camp_events = CampEventAssociation.query.filter(
            CampEventAssociation.event_id.in_(created_event_ids),
            CampEventAssociation.status == AssociationStatus.PENDING.value
        ).count() if created_event_ids else 0

        total_pending = pending_camp_members + pending_camp_events

        return {
            'pending_camp_members': pending_camp_members,
            'pending_camp_events': pending_camp_events,
            'total_pending_approvals': total_pending
        }
