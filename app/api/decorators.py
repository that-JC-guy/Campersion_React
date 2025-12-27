"""
API decorators for authentication and authorization.

This module provides JWT-based decorators for protecting API endpoints
and enforcing role-based access control.
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from app.models import User, UserRole


def get_current_user():
    """
    Get the current authenticated user from JWT token.

    Returns:
        User: Current user object or None if not authenticated.
    """
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return User.query.get(int(user_id))
    except Exception:
        return None


def jwt_required_with_user(f):
    """
    Decorator that requires valid JWT and injects current user.

    This decorator verifies the JWT token and passes the current user
    as the first argument to the decorated function.

    Usage:
        @jwt_required_with_user
        def my_endpoint(current_user):
            return jsonify({'user': current_user.email})
    """
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        current_user = User.query.get(int(user_id))
        if not current_user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        return f(current_user, *args, **kwargs)
    return decorated_function


def jwt_required_role(required_role):
    """
    Decorator that requires specific role or higher.

    This decorator checks if the current user has the required role
    or a higher role in the hierarchy.

    Args:
        required_role (UserRole): Minimum required role

    Usage:
        @jwt_required_role(UserRole.EVENT_MANAGER)
        def create_event(current_user):
            return jsonify({'success': True})
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user_id = get_jwt_identity()
            current_user = User.query.get(int(user_id))

            if not current_user:
                return jsonify({'success': False, 'error': 'User not found'}), 404

            if not has_role_or_higher(current_user, required_role):
                return jsonify({
                    'success': False,
                    'error': 'Insufficient permissions',
                    'required_role': required_role.value
                }), 403

            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator


def has_role_or_higher(user, required_role):
    """
    Check if user has required role or higher in hierarchy.

    Args:
        user (User): User to check
        required_role (UserRole): Minimum required role

    Returns:
        bool: True if user has required role or higher
    """
    role_hierarchy = UserRole.get_role_hierarchy()

    try:
        user_role = UserRole(user.role)
        required_role_index = role_hierarchy.index(required_role)
        user_role_index = role_hierarchy.index(user_role)

        # Lower index = higher privilege
        return user_role_index <= required_role_index
    except (ValueError, AttributeError):
        return False


def is_global_admin(user):
    """
    Check if user is a global admin.

    Args:
        user (User): User to check

    Returns:
        bool: True if user is global admin
    """
    return user.role == UserRole.GLOBAL_ADMIN.value


def is_site_admin_or_higher(user):
    """
    Check if user is site admin or higher.

    Args:
        user (User): User to check

    Returns:
        bool: True if user is site admin or higher
    """
    return has_role_or_higher(user, UserRole.SITE_ADMIN)


def is_event_manager_or_higher(user):
    """
    Check if user is event manager or higher.

    Args:
        user (User): User to check

    Returns:
        bool: True if user is event manager or higher
    """
    return has_role_or_higher(user, UserRole.EVENT_MANAGER)


def is_camp_manager(user, camp):
    """
    Check if user is a manager of the given camp.

    Args:
        user (User): User to check
        camp (Camp): Camp to check membership for

    Returns:
        bool: True if user is a camp manager
    """
    from app.models import CampMember, AssociationStatus

    membership = CampMember.query.filter_by(
        user_id=user.id,
        camp_id=camp.id,
        status=AssociationStatus.APPROVED.value,
        role='manager'
    ).first()

    return membership is not None


def is_event_creator(user, event):
    """
    Check if user is the creator of the given event.

    Args:
        user (User): User to check
        event (Event): Event to check

    Returns:
        bool: True if user is the event creator
    """
    return event.creator_id == user.id
