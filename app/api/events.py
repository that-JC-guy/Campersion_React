"""
Event API endpoints.

This module provides RESTful API endpoints for event management,
approval workflows, and camp-event associations.
"""

from flask import request
from sqlalchemy import or_
from app.api import api_bp
from app.api.errors import success_response, error_response
from app.api.decorators import jwt_required_with_user, jwt_required_role
from app.models import (
    Event, EventStatus, UserRole, CampEventAssociation,
    AssociationStatus, Camp, User
)
from app import db
from datetime import datetime


def serialize_event(event, include_camps=False):
    """Serialize event to dictionary."""
    data = {
        'id': event.id,
        'title': event.title,
        'description': event.description,
        'location': event.location,
        'start_date': event.start_date.isoformat() if event.start_date else None,
        'end_date': event.end_date.isoformat() if event.end_date else None,
        'status': event.status,
        'event_manager_email': event.event_manager_email,
        'event_manager_phone': event.event_manager_phone,
        'safety_manager_email': event.safety_manager_email,
        'safety_manager_phone': event.safety_manager_phone,
        'business_manager_email': event.business_manager_email,
        'business_manager_phone': event.business_manager_phone,
        'board_email': event.board_email,
        'creator_id': event.creator_id,
        'creator_name': event.creator.name if event.creator else None,
        'created_at': event.created_at.isoformat() if event.created_at else None
    }

    if include_camps:
        data['camps'] = {
            'pending': [serialize_camp_association(assoc) for assoc in
                       event.camp_associations.filter_by(status=AssociationStatus.PENDING.value).all()],
            'approved': [serialize_camp_association(assoc) for assoc in
                        event.camp_associations.filter_by(status=AssociationStatus.APPROVED.value).all()],
            'rejected': [serialize_camp_association(assoc) for assoc in
                        event.camp_associations.filter_by(status=AssociationStatus.REJECTED.value).all()]
        }

    return data


def serialize_camp_association(association):
    """Serialize camp-event association to dictionary."""
    return {
        'id': association.id,
        'camp': {
            'id': association.camp.id,
            'name': association.camp.name,
            'description': association.camp.description,
            'max_sites': association.camp.max_sites,
            'max_people': association.camp.max_people
        },
        'event': {
            'id': association.event.id,
            'title': association.event.title,
            'start_date': association.event.start_date.isoformat() if association.event.start_date else None,
            'end_date': association.event.end_date.isoformat() if association.event.end_date else None
        },
        'status': association.status,
        'location': association.location,
        'requested_at': association.requested_at.isoformat() if association.requested_at else None,
        'approved_at': association.approved_at.isoformat() if association.approved_at else None
    }


@api_bp.route('/events', methods=['GET'])
def list_events():
    """
    List events based on user role.

    - Site admins and global admins see all events
    - Event managers see all approved events + their own events (any status)
    - All other users (including unauthenticated) see only approved events

    Returns:
        200: List of events filtered by permissions
    """
    # Get current user if authenticated
    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id) if current_user_id else None
    except:
        current_user = None

    if current_user and current_user.is_site_admin_or_higher:
        # Site admins see all events
        events = Event.query.order_by(Event.created_at.desc()).all()
    elif current_user and current_user.has_role_or_higher(UserRole.EVENT_MANAGER):
        # Event managers see their own events (any status) OR all approved events
        events = Event.query.filter(
            or_(
                Event.creator_id == current_user.id,
                Event.status == EventStatus.APPROVED.value
            )
        ).order_by(Event.created_at.desc()).all()
    else:
        # All other users (including unauthenticated) see only approved events
        events = Event.query.filter_by(status=EventStatus.APPROVED.value)\
                           .order_by(Event.start_date.asc()).all()

    return success_response(data={
        'events': [serialize_event(event) for event in events]
    })


@api_bp.route('/events', methods=['POST'])
@jwt_required_role(UserRole.EVENT_MANAGER)
def create_event(current_user):
    """
    Create a new event (EVENT_MANAGER or higher).

    Events are created with 'pending' status and require site admin approval.

    Request body:
        {
            "title": "Event Title",
            "description": "Event description",
            "location": "Event location",
            "start_date": "2024-01-01",
            "end_date": "2024-01-05",
            "event_manager_email": "email@example.com",
            "event_manager_phone": "555-1234",
            "safety_manager_email": "safety@example.com",
            "safety_manager_phone": "555-5678",
            "business_manager_email": "business@example.com",
            "business_manager_phone": "555-9012",
            "board_email": "board@example.com"
        }

    Returns:
        201: Event created successfully
        400: Validation error
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Validate required fields
    required_fields = ['title', 'start_date', 'end_date']
    for field in required_fields:
        if not data.get(field):
            return error_response(f'{field} is required'), 400

    # Parse dates
    try:
        start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return error_response('Invalid date format'), 400

    # Validate end date is after start date
    if end_date < start_date:
        return error_response('End date must be after start date'), 400

    # Create event
    event = Event(
        title=data['title'].strip(),
        description=data.get('description', '').strip() or None,
        location=data.get('location', '').strip() or None,
        start_date=start_date,
        end_date=end_date,
        event_manager_email=data.get('event_manager_email', '').strip() or None,
        event_manager_phone=data.get('event_manager_phone', '').strip() or None,
        safety_manager_email=data.get('safety_manager_email', '').strip() or None,
        safety_manager_phone=data.get('safety_manager_phone', '').strip() or None,
        business_manager_email=data.get('business_manager_email', '').strip() or None,
        business_manager_phone=data.get('business_manager_phone', '').strip() or None,
        board_email=data.get('board_email', '').strip() or None,
        status=EventStatus.PENDING.value,
        creator_id=current_user.id
    )

    db.session.add(event)
    db.session.commit()

    return success_response(
        data={'event': serialize_event(event)},
        message=f"Created event '{event.title}'. Awaiting site admin approval."
    ), 201


@api_bp.route('/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """
    Get event details.

    - Event creators can view their own events regardless of status
    - Site admins can view all events
    - All other users (including unauthenticated) can only view approved events

    Args:
        event_id: ID of the event

    Returns:
        200: Event data
        403: Permission denied
        404: Event not found
    """
    event = Event.query.get_or_404(event_id)

    # Get current user if authenticated
    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id) if current_user_id else None
    except:
        current_user = None

    # Check permissions
    if current_user and current_user.is_site_admin_or_higher:
        # Site admins can view all events
        pass
    elif current_user and event.creator_id == current_user.id:
        # Creators can view their own events
        pass
    else:
        # All other users (including unauthenticated) can only view approved events
        if event.status != EventStatus.APPROVED.value:
            return error_response('Permission denied'), 403

    return success_response(data={
        'event': serialize_event(event, include_camps=True)
    })


@api_bp.route('/events/<int:event_id>', methods=['PUT'])
@jwt_required_role(UserRole.EVENT_MANAGER)
def update_event(current_user, event_id):
    """
    Update an event.

    Event creators can edit their own events. Site admins can edit any event.

    Args:
        event_id: ID of the event to update

    Returns:
        200: Event updated successfully
        400: Validation error
        403: Permission denied
        404: Event not found
    """
    event = Event.query.get_or_404(event_id)

    # Check permissions: must be creator or site admin
    if event.creator_id != current_user.id and not current_user.is_site_admin_or_higher:
        return error_response('You can only edit your own events'), 403

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Update fields
    if 'title' in data:
        event.title = data['title'].strip()

    if 'description' in data:
        event.description = data['description'].strip() if data['description'] else None

    if 'location' in data:
        event.location = data['location'].strip() if data['location'] else None

    if 'start_date' in data:
        try:
            event.start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return error_response('Invalid start_date format'), 400

    if 'end_date' in data:
        try:
            event.end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return error_response('Invalid end_date format'), 400

    # Validate end date is after start date
    if event.end_date < event.start_date:
        return error_response('End date must be after start date'), 400

    if 'event_manager_email' in data:
        event.event_manager_email = data['event_manager_email'].strip() if data['event_manager_email'] else None

    if 'event_manager_phone' in data:
        event.event_manager_phone = data['event_manager_phone'].strip() if data['event_manager_phone'] else None

    if 'safety_manager_email' in data:
        event.safety_manager_email = data['safety_manager_email'].strip() if data['safety_manager_email'] else None

    if 'safety_manager_phone' in data:
        event.safety_manager_phone = data['safety_manager_phone'].strip() if data['safety_manager_phone'] else None

    if 'business_manager_email' in data:
        event.business_manager_email = data['business_manager_email'].strip() if data['business_manager_email'] else None

    if 'business_manager_phone' in data:
        event.business_manager_phone = data['business_manager_phone'].strip() if data['business_manager_phone'] else None

    if 'board_email' in data:
        event.board_email = data['board_email'].strip() if data['board_email'] else None

    db.session.commit()

    return success_response(
        data={'event': serialize_event(event)},
        message=f"Updated event '{event.title}'"
    )


@api_bp.route('/events/<int:event_id>/approve', methods=['POST'])
@jwt_required_role(UserRole.SITE_ADMIN)
def approve_event(current_user, event_id):
    """
    Approve a pending event (SITE_ADMIN or higher).

    Args:
        event_id: ID of the event to approve

    Returns:
        200: Event approved successfully
        400: Event is not pending
        404: Event not found
    """
    event = Event.query.get_or_404(event_id)

    if event.status != EventStatus.PENDING.value:
        return error_response('Can only approve pending events'), 400

    event.status = EventStatus.APPROVED.value
    db.session.commit()

    return success_response(
        data={'event': serialize_event(event)},
        message=f"Approved event '{event.title}'"
    )


@api_bp.route('/events/<int:event_id>/reject', methods=['POST'])
@jwt_required_role(UserRole.SITE_ADMIN)
def reject_event(current_user, event_id):
    """
    Reject a pending event (SITE_ADMIN or higher).

    Args:
        event_id: ID of the event to reject

    Returns:
        200: Event rejected successfully
        400: Event is not pending
        404: Event not found
    """
    event = Event.query.get_or_404(event_id)

    if event.status != EventStatus.PENDING.value:
        return error_response('Can only reject pending events'), 400

    event.status = EventStatus.REJECTED.value
    db.session.commit()

    return success_response(
        data={'event': serialize_event(event)},
        message=f"Rejected event '{event.title}'"
    )


@api_bp.route('/events/<int:event_id>/cancel', methods=['POST'])
@jwt_required_with_user
def cancel_event(current_user, event_id):
    """
    Cancel an approved event.

    Event creators can cancel their own events. Site admins can cancel any event.
    Only approved events can be cancelled.

    Args:
        event_id: ID of the event to cancel

    Returns:
        200: Event cancelled successfully
        400: Event is not approved
        403: Permission denied
        404: Event not found
    """
    event = Event.query.get_or_404(event_id)

    # Check permissions: must be creator or site admin
    if event.creator_id != current_user.id and not current_user.is_site_admin_or_higher:
        return error_response('You can only cancel your own events'), 403

    if event.status != EventStatus.APPROVED.value:
        return error_response('Can only cancel approved events'), 400

    event.status = EventStatus.CANCELLED.value
    db.session.commit()

    return success_response(
        data={'event': serialize_event(event)},
        message=f"Cancelled event '{event.title}'"
    )


@api_bp.route('/events/<int:event_id>/camps/<int:camp_id>/approve', methods=['POST'])
@jwt_required_with_user
def approve_camp(current_user, event_id, camp_id):
    """
    Approve a camp request for an event.

    Event creators and site admins can approve pending camp requests.

    Args:
        event_id: ID of the event
        camp_id: ID of the camp to approve

    Returns:
        200: Camp approved successfully
        400: Association is not pending
        403: Permission denied
        404: Event, camp, or association not found
    """
    event = Event.query.get_or_404(event_id)
    camp = Camp.query.get_or_404(camp_id)

    # Check permission: must be event creator, event manager, or site admin
    if event.creator_id != current_user.id and not current_user.is_event_manager_or_higher:
        return error_response('You can only manage camp requests for your own events'), 403

    # Get the association
    association = CampEventAssociation.query.filter_by(
        camp_id=camp_id,
        event_id=event_id
    ).first_or_404()

    # Validate status is pending
    if association.status != AssociationStatus.PENDING.value:
        return error_response('Can only approve pending requests'), 400

    # Approve the association
    association.status = AssociationStatus.APPROVED.value
    association.approved_at = datetime.utcnow()
    db.session.commit()

    return success_response(
        data={'association': serialize_camp_association(association)},
        message=f"Approved camp '{camp.name}' for event '{event.title}'"
    )


@api_bp.route('/events/<int:event_id>/camps/<int:camp_id>/reject', methods=['POST'])
@jwt_required_with_user
def reject_camp(current_user, event_id, camp_id):
    """
    Reject a camp request for an event.

    Event creators and site admins can reject pending camp requests.

    Args:
        event_id: ID of the event
        camp_id: ID of the camp to reject

    Returns:
        200: Camp rejected successfully
        400: Association is not pending
        403: Permission denied
        404: Event, camp, or association not found
    """
    event = Event.query.get_or_404(event_id)
    camp = Camp.query.get_or_404(camp_id)

    # Check permission: must be event creator, event manager, or site admin
    if event.creator_id != current_user.id and not current_user.is_event_manager_or_higher:
        return error_response('You can only manage camp requests for your own events'), 403

    # Get the association
    association = CampEventAssociation.query.filter_by(
        camp_id=camp_id,
        event_id=event_id
    ).first_or_404()

    # Validate status is pending
    if association.status != AssociationStatus.PENDING.value:
        return error_response('Can only reject pending requests'), 400

    # Reject the association
    association.status = AssociationStatus.REJECTED.value
    db.session.commit()

    return success_response(
        data={'association': serialize_camp_association(association)},
        message=f"Rejected camp '{camp.name}' for event '{event.title}'"
    )


@api_bp.route('/events/pending-camps', methods=['GET'])
@jwt_required_with_user
def get_pending_camps(current_user):
    """
    Get all pending camp join requests for events created by the user.

    Shows a consolidated list of all pending camp-event association requests
    across all events where the current user is the creator.

    Returns:
        200: List of pending camp requests
    """
    # Get all events created by current user
    created_event_ids = [e.id for e in Event.query.filter_by(
        creator_id=current_user.id
    ).all()]

    if not created_event_ids:
        return success_response(data={'pending_requests': []})

    # Get all pending camp-event association requests for those events
    pending_requests = CampEventAssociation.query.filter(
        CampEventAssociation.event_id.in_(created_event_ids),
        CampEventAssociation.status == AssociationStatus.PENDING.value
    ).order_by(CampEventAssociation.requested_at.desc()).all()

    return success_response(data={
        'pending_requests': [serialize_camp_association(req) for req in pending_requests]
    })
