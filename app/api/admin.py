"""
Admin API endpoints.

Provides administrative functionality for Site Admins and Global Admins:
- User management (create, suspend, reactivate)
- Event status management (revoke approvals)
- Camp-event association management (revoke associations)
- Admin statistics dashboard
"""

from flask import request
from app.api import api_bp
from app import db
from app.models import User, Event, CampMember, CampEventAssociation, UserRole, EventStatus, AssociationStatus
from app.api.decorators import jwt_required_role
from app.api.errors import success_response, error_response
from sqlalchemy import func, or_
from datetime import datetime


def serialize_user_admin(user):
    """
    Serialize user with extended admin details.

    Args:
        user: User model instance

    Returns:
        dict: User data with admin-specific fields
    """
    return {
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'preferred_name': user.preferred_name,
        'show_full_name': user.show_full_name,
        'pronouns': user.pronouns,
        'show_pronouns': user.show_pronouns,
        'role': user.role,
        'is_active': user.is_active,
        'email_verified': user.email_verified,
        'created_at': user.created_at.isoformat() if user.created_at else None,
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'has_password_auth': user.has_password_auth,
        'has_oauth_auth': user.has_oauth_auth
    }


def serialize_association_admin(association):
    """
    Serialize camp-event association with admin details.

    Args:
        association: CampEventAssociation model instance

    Returns:
        dict: Association data with camp and event details
    """
    return {
        'id': association.id,
        'camp': {
            'id': association.camp.id,
            'name': association.camp.name
        },
        'event': {
            'id': association.event.id,
            'title': association.event.title,
            'location': association.event.location
        },
        'status': association.status,
        'requested_at': association.requested_at.isoformat() if association.requested_at else None,
        'approved_at': association.approved_at.isoformat() if association.approved_at else None
    }


@api_bp.route('/admin/stats', methods=['GET'])
@jwt_required_role(UserRole.SITE_ADMIN)
def get_admin_stats(current_user):
    """
    Get admin dashboard statistics.

    Returns statistics about users, events, and associations.
    Requires: Site Admin or Global Admin role
    """
    # Count users by status
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    suspended_users = User.query.filter_by(is_active=False).count()

    # Count pending events
    pending_events = Event.query.filter_by(status=EventStatus.PENDING.value).count()

    # Count pending camp-event associations
    pending_associations = CampEventAssociation.query.filter_by(status=AssociationStatus.PENDING.value).count()

    stats = {
        'total_users': total_users,
        'active_users': active_users,
        'suspended_users': suspended_users,
        'pending_events': pending_events,
        'pending_associations': pending_associations
    }

    return success_response(data=stats)


@api_bp.route('/admin/users', methods=['GET'])
@jwt_required_role(UserRole.SITE_ADMIN)
def get_all_users(current_user):
    """
    Get all users with optional filtering.

    Query parameters:
    - status: Filter by active/suspended/all (default: all)
    - role: Filter by specific role
    - search: Search by email or name

    Requires: Site Admin or Global Admin role
    """
    query = User.query

    # Filter by status
    status = request.args.get('status', 'all')
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'suspended':
        query = query.filter_by(is_active=False)

    # Filter by role
    role = request.args.get('role')
    if role:
        query = query.filter_by(role=role)

    # Search by email or name
    search = request.args.get('search')
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            or_(
                User.email.ilike(search_pattern),
                User.name.ilike(search_pattern)
            )
        )

    users = query.order_by(User.created_at.desc()).all()

    return success_response(data={
        'users': [serialize_user_admin(user) for user in users]
    })


@api_bp.route('/admin/users', methods=['POST'])
@jwt_required_role(UserRole.GLOBAL_ADMIN)
def create_user(current_user):
    """
    Manually create a new user account.

    Request body:
    - email: User's email address (required)
    - name: User's full name (required)
    - password: User's password (required, min 8 chars)
    - role: User's role (optional, defaults to 'member')

    Created users have email_verified=True and can log in immediately.
    Requires: Global Admin role
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided', 400)

    # Validate required fields
    email = data.get('email', '').strip()
    name = data.get('name', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'member')

    if not email:
        return error_response('Email is required', 400)
    if not name:
        return error_response('Name is required', 400)
    if not password:
        return error_response('Password is required', 400)
    if len(password) < 8:
        return error_response('Password must be at least 8 characters', 400)

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return error_response('A user with this email already exists', 400)

    # Validate role
    valid_roles = [r.value for r in UserRole]
    if role not in valid_roles:
        return error_response(f'Invalid role. Must be one of: {", ".join(valid_roles)}', 400)

    # Create user
    user = User(
        email=email,
        name=name,
        role=role,
        email_verified=True,  # Admin-created users are pre-verified
        is_active=True
    )
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()

        return success_response(
            data={'user': serialize_user_admin(user)},
            message=f'User {email} created successfully',
            status_code=201
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to create user: {str(e)}', 500)


@api_bp.route('/admin/users/<int:user_id>/suspend', methods=['PUT'])
@jwt_required_role(UserRole.SITE_ADMIN)
def suspend_user(current_user, user_id):
    """
    Suspend a user account (soft delete).

    Sets is_active=False, preventing login while preserving data.
    Cannot suspend self or users with equal/higher privilege.

    Requires: Site Admin or Global Admin role
    """
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', 404)

    # Prevent self-suspension
    if user.id == current_user.id:
        return error_response('You cannot suspend your own account', 403)

    # Prevent suspending equal or higher privilege users
    if user.has_role_or_higher(UserRole[current_user.role.upper().replace(' ', '_')]):
        return error_response('You cannot suspend a user with equal or higher privileges', 403)

    # Check if already suspended
    if not user.is_active:
        return error_response('User is already suspended', 400)

    user.is_active = False

    try:
        db.session.commit()
        return success_response(
            data={'user': serialize_user_admin(user)},
            message=f'User {user.email} has been suspended'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to suspend user: {str(e)}', 500)


@api_bp.route('/admin/users/<int:user_id>/reactivate', methods=['PUT'])
@jwt_required_role(UserRole.SITE_ADMIN)
def reactivate_user(current_user, user_id):
    """
    Reactivate a suspended user account.

    Sets is_active=True, allowing the user to log in again.

    Requires: Site Admin or Global Admin role
    """
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', 404)

    # Check if already active
    if user.is_active:
        return error_response('User is already active', 400)

    user.is_active = True

    try:
        db.session.commit()
        return success_response(
            data={'user': serialize_user_admin(user)},
            message=f'User {user.email} has been reactivated'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to reactivate user: {str(e)}', 500)


@api_bp.route('/admin/events/<int:event_id>/status', methods=['PUT'])
@jwt_required_role(UserRole.SITE_ADMIN)
def change_event_status(current_user, event_id):
    """
    Change event status (admin override).

    Request body:
    - status: New status (pending/approved/rejected/cancelled) (required)
    - reason: Reason for status change (optional)

    Allows admins to revoke event approvals by changing to any status.

    Requires: Site Admin or Global Admin role
    """
    event = Event.query.get(event_id)
    if not event:
        return error_response('Event not found', 404)

    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    new_status = data.get('status', '').strip()
    reason = data.get('reason', '').strip()

    if not new_status:
        return error_response('Status is required', 400)

    # Validate status
    valid_statuses = [s.value for s in EventStatus]
    if new_status not in valid_statuses:
        return error_response(f'Invalid status. Must be one of: {", ".join(valid_statuses)}', 400)

    old_status = event.status
    event.status = new_status

    try:
        db.session.commit()

        message = f'Event status changed from {old_status} to {new_status}'
        if reason:
            message += f'. Reason: {reason}'

        return success_response(
            data={
                'event': {
                    'id': event.id,
                    'title': event.title,
                    'old_status': old_status,
                    'new_status': new_status
                }
            },
            message=message
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to change event status: {str(e)}', 500)


@api_bp.route('/admin/associations', methods=['GET'])
@jwt_required_role(UserRole.SITE_ADMIN)
def get_all_associations(current_user):
    """
    Get all camp-event associations with optional filtering.

    Query parameters:
    - status: Filter by pending/approved/rejected (optional)
    - event_id: Filter by specific event (optional)
    - camp_id: Filter by specific camp (optional)

    Requires: Site Admin or Global Admin role
    """
    query = CampEventAssociation.query

    # Filter by status
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    # Filter by event
    event_id = request.args.get('event_id')
    if event_id:
        query = query.filter_by(event_id=event_id)

    # Filter by camp
    camp_id = request.args.get('camp_id')
    if camp_id:
        query = query.filter_by(camp_id=camp_id)

    associations = query.order_by(CampEventAssociation.requested_at.desc()).all()

    return success_response(data={
        'associations': [serialize_association_admin(assoc) for assoc in associations]
    })


@api_bp.route('/admin/associations/<int:association_id>/revoke', methods=['PUT'])
@jwt_required_role(UserRole.SITE_ADMIN)
def revoke_association(current_user, association_id):
    """
    Revoke an approved camp-event association.

    Request body:
    - reason: Reason for revocation (optional)

    Changes status from APPROVED to REJECTED and clears approved_at timestamp.
    Preserves audit trail by keeping requested_at.

    Requires: Site Admin or Global Admin role
    """
    association = CampEventAssociation.query.get(association_id)
    if not association:
        return error_response('Association not found', 404)

    # Check if association is approved
    if association.status != AssociationStatus.APPROVED.value:
        return error_response('Only approved associations can be revoked', 400)

    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    # Revoke association
    association.status = AssociationStatus.REJECTED.value
    association.approved_at = None

    try:
        db.session.commit()

        message = 'Association revoked successfully'
        if reason:
            message += f'. Reason: {reason}'

        return success_response(
            data={'association': serialize_association_admin(association)},
            message=message
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to revoke association: {str(e)}', 500)


@api_bp.route('/admin/associations/<int:association_id>/cancel-rejection', methods=['PUT'])
@jwt_required_role(UserRole.EVENT_MANAGER)
def cancel_association_rejection(current_user, association_id):
    """
    Cancel rejection of a camp-event association and revert to pending.

    Changes status from REJECTED to PENDING so the event creator can re-review.

    Requires: Event Manager or higher role
    """
    association = CampEventAssociation.query.get(association_id)
    if not association:
        return error_response('Association not found', 404)

    # Check if association is rejected
    if association.status != AssociationStatus.REJECTED.value:
        return error_response('Only rejected associations can have rejection cancelled', 400)

    # Revert to pending status
    association.status = AssociationStatus.PENDING.value

    try:
        db.session.commit()

        return success_response(
            data={'association': serialize_association_admin(association)},
            message='Association rejection cancelled successfully. Status reverted to pending.'
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f'Failed to cancel rejection: {str(e)}', 500)
