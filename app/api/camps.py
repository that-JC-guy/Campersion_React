"""
Camps API endpoints.

This module provides RESTful API endpoints for camp management including
CRUD operations, membership workflows, and event associations.
"""

from flask import request
from app.api import api_bp
from app.api.errors import success_response, error_response
from app.api.decorators import jwt_required_with_user
from app.models import (
    Camp, CampMember, CampMemberRole, AssociationStatus,
    Event, EventStatus, CampEventAssociation, User, InventoryItem,
    MemberApprovalMode
)
from app import db
from datetime import datetime
from collections import defaultdict


def serialize_camp(camp, include_members=False, include_inventory=False):
    """Serialize camp to dictionary."""
    data = {
        'id': camp.id,
        'name': camp.name,
        'description': camp.description,
        'max_sites': camp.max_sites,
        'max_people': camp.max_people,
        'has_communal_kitchen': camp.has_communal_kitchen,
        'has_communal_space': camp.has_communal_space,
        'has_art_exhibits': camp.has_art_exhibits,
        'has_member_activities': camp.has_member_activities,
        'has_non_member_activities': camp.has_non_member_activities,
        'custom_amenities': camp.custom_amenities,
        'member_approval_mode': camp.member_approval_mode,
        'creator_id': camp.creator_id,
        'created_at': camp.created_at.isoformat() if camp.created_at else None
    }

    if include_members:
        managers = camp.camp_members.filter_by(
            status=AssociationStatus.APPROVED.value,
            role=CampMemberRole.MANAGER.value
        ).all()

        regular_members = camp.camp_members.filter_by(
            status=AssociationStatus.APPROVED.value,
            role=CampMemberRole.MEMBER.value
        ).all()

        pending = camp.camp_members.filter_by(
            status=AssociationStatus.PENDING.value
        ).all()

        data['members'] = {
            'managers': [serialize_camp_member(m) for m in managers],
            'regular_members': [serialize_camp_member(m) for m in regular_members],
            'pending': [serialize_camp_member(m) for m in pending]
        }

    if include_inventory:
        # Get shared inventory from approved camp members
        approved_member_ids = [m.user_id for m in camp.camp_members.filter_by(
            status=AssociationStatus.APPROVED.value
        ).all()]

        shared_items = InventoryItem.query.filter(
            InventoryItem.user_id.in_(approved_member_ids),
            InventoryItem.is_shared_gear == True
        ).order_by(InventoryItem.name.asc()).all() if approved_member_ids else []

        # Group shared inventory by item name
        grouped_inventory = defaultdict(lambda: {'total_quantity': 0, 'owners': [], 'descriptions': []})

        for item in shared_items:
            grouped_inventory[item.name]['total_quantity'] += item.quantity
            owner_name = item.owner.preferred_name or item.owner.first_name or item.owner.name
            grouped_inventory[item.name]['owners'].append(owner_name)
            if item.description and item.description not in grouped_inventory[item.name]['descriptions']:
                grouped_inventory[item.name]['descriptions'].append(item.description)

        # Convert to list of dicts
        data['shared_inventory'] = [
            {
                'name': name,
                'total_quantity': info['total_quantity'],
                'owners': ', '.join(info['owners']),
                'description': '; '.join(info['descriptions']) if info['descriptions'] else None
            }
            for name, info in sorted(grouped_inventory.items())
        ]

    return data


def serialize_camp_member(member):
    """Serialize camp member to dictionary."""
    return {
        'id': member.id,
        'user': {
            'id': member.user.id,
            'name': member.user.name,
            'email': member.user.email
        },
        'status': member.status,
        'role': member.role,
        'requested_at': member.requested_at.isoformat() if member.requested_at else None,
        'approved_at': member.approved_at.isoformat() if member.approved_at else None
    }


def serialize_event_association(association):
    """Serialize camp-event association to dictionary."""
    return {
        'id': association.id,
        'event': {
            'id': association.event.id,
            'title': association.event.title,
            'start_date': association.event.start_date.isoformat() if association.event.start_date else None,
            'end_date': association.event.end_date.isoformat() if association.event.end_date else None,
            'status': association.event.status
        },
        'status': association.status,
        'location': association.location,
        'requested_at': association.requested_at.isoformat() if association.requested_at else None,
        'approved_at': association.approved_at.isoformat() if association.approved_at else None
    }


@api_bp.route('/camps', methods=['GET'])
def list_camps():
    """
    List all camps.

    All users (including unauthenticated) can view the camp list.

    Returns:
        200: List of all camps
    """
    camps = Camp.query.order_by(Camp.created_at.desc()).all()

    return success_response(data={
        'camps': [serialize_camp(camp) for camp in camps]
    })


@api_bp.route('/camps', methods=['POST'])
@jwt_required_with_user
def create_camp(current_user):
    """
    Create a new camp.

    Any authenticated user can create a camp. Creator is automatically
    added as an approved camp manager.

    Request body:
        {
            "name": "Camp Name",
            "description": "Camp description",
            "max_sites": 10,
            "max_people": 50,
            "has_communal_kitchen": true,
            "has_communal_space": true,
            "has_art_exhibits": false,
            "has_member_activities": true,
            "has_non_member_activities": false,
            "custom_amenities": "Fire pit, WiFi",
            "member_approval_mode": "manager_only"
        }

    Returns:
        201: Camp created successfully
        400: Validation error
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Validate required fields
    if not data.get('name'):
        return error_response('Camp name is required'), 400

    # Create camp
    camp = Camp(
        name=data['name'].strip(),
        description=data.get('description', '').strip() or None,
        max_sites=data.get('max_sites', 0),
        max_people=data.get('max_people', 0),
        has_communal_kitchen=data.get('has_communal_kitchen', False),
        has_communal_space=data.get('has_communal_space', False),
        has_art_exhibits=data.get('has_art_exhibits', False),
        has_member_activities=data.get('has_member_activities', False),
        has_non_member_activities=data.get('has_non_member_activities', False),
        custom_amenities=data.get('custom_amenities', '').strip() or None,
        member_approval_mode=data.get('member_approval_mode', MemberApprovalMode.MANAGER_ONLY.value),
        creator_id=current_user.id
    )

    db.session.add(camp)
    db.session.flush()  # Get camp.id before commit

    # Auto-add creator as approved camp manager
    creator_membership = CampMember(
        camp_id=camp.id,
        user_id=current_user.id,
        status=AssociationStatus.APPROVED.value,
        role=CampMemberRole.MANAGER.value,
        requested_at=datetime.utcnow(),
        approved_at=datetime.utcnow()
    )
    db.session.add(creator_membership)
    db.session.commit()

    return success_response(
        data={'camp': serialize_camp(camp)},
        message=f"Created camp '{camp.name}' successfully! You are now a camp manager."
    ), 201


@api_bp.route('/camps/<int:camp_id>', methods=['GET'])
def get_camp(camp_id):
    """
    Get camp details.

    All users (including unauthenticated) can view camp details.
    Includes shared inventory from approved members.

    Args:
        camp_id: ID of the camp

    Returns:
        200: Camp data with shared inventory
        404: Camp not found
    """
    camp = Camp.query.get_or_404(camp_id)

    # Get current user if authenticated
    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id) if current_user_id else None
    except:
        current_user = None

    # Get user's membership status if authenticated
    user_membership = None
    if current_user:
        user_membership = camp.get_user_membership(current_user.id)

    # Get approved events for this camp
    approved_events = []
    if current_user and current_user.is_camp_manager(camp_id):
        # Get approved events that this camp hasn't requested yet
        existing_associations = camp.event_associations.with_entities(
            CampEventAssociation.event_id
        ).all()
        existing_event_ids = [assoc.event_id for assoc in existing_associations]

        approved_events = Event.query.filter(
            Event.status == EventStatus.APPROVED.value,
            Event.id.notin_(existing_event_ids) if existing_event_ids else True
        ).order_by(Event.start_date.asc()).all()

    # Get event associations
    event_associations = {
        'pending': [serialize_event_association(assoc) for assoc in
                   camp.event_associations.filter_by(status=AssociationStatus.PENDING.value).all()],
        'approved': [serialize_event_association(assoc) for assoc in
                    camp.event_associations.filter_by(status=AssociationStatus.APPROVED.value).all()],
        'rejected': [serialize_event_association(assoc) for assoc in
                    camp.event_associations.filter_by(status=AssociationStatus.REJECTED.value).all()]
    }

    # Get pending member count for managers
    pending_count = camp.camp_members.filter_by(status=AssociationStatus.PENDING.value).count()

    camp_data = serialize_camp(camp, include_members=True, include_inventory=True)
    camp_data['user_membership'] = {
        'status': user_membership.status if user_membership else None,
        'role': user_membership.role if user_membership else None
    } if user_membership else None
    camp_data['event_associations'] = event_associations
    camp_data['available_events'] = [{'id': e.id, 'title': e.title, 'start_date': e.start_date.isoformat()}
                                      for e in approved_events]
    camp_data['pending_member_count'] = pending_count

    return success_response(data={'camp': camp_data})


@api_bp.route('/camps/<int:camp_id>', methods=['PUT'])
@jwt_required_with_user
def update_camp(current_user, camp_id):
    """
    Update a camp.

    Camp creators can edit their own camps. Site admins can edit any camp.

    Args:
        camp_id: ID of the camp to update

    Returns:
        200: Camp updated successfully
        400: Validation error
        403: Permission denied
        404: Camp not found
    """
    camp = Camp.query.get_or_404(camp_id)

    # Check permissions: must be creator or site admin
    if camp.creator_id != current_user.id and not current_user.is_site_admin_or_higher:
        return error_response('You can only edit your own camps'), 403

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Update fields
    if 'name' in data:
        camp.name = data['name'].strip()

    if 'description' in data:
        camp.description = data['description'].strip() if data['description'] else None

    if 'max_sites' in data:
        camp.max_sites = data['max_sites']

    if 'max_people' in data:
        camp.max_people = data['max_people']

    if 'has_communal_kitchen' in data:
        camp.has_communal_kitchen = bool(data['has_communal_kitchen'])

    if 'has_communal_space' in data:
        camp.has_communal_space = bool(data['has_communal_space'])

    if 'has_art_exhibits' in data:
        camp.has_art_exhibits = bool(data['has_art_exhibits'])

    if 'has_member_activities' in data:
        camp.has_member_activities = bool(data['has_member_activities'])

    if 'has_non_member_activities' in data:
        camp.has_non_member_activities = bool(data['has_non_member_activities'])

    if 'custom_amenities' in data:
        camp.custom_amenities = data['custom_amenities'].strip() if data['custom_amenities'] else None

    if 'member_approval_mode' in data:
        camp.member_approval_mode = data['member_approval_mode']

    db.session.commit()

    return success_response(
        data={'camp': serialize_camp(camp)},
        message=f"Updated camp '{camp.name}'"
    )


@api_bp.route('/camps/<int:camp_id>/request-membership', methods=['POST'])
@jwt_required_with_user
def request_membership(current_user, camp_id):
    """
    Request to join a camp as a member.

    Any authenticated user can request to join a camp.

    Args:
        camp_id: ID of the camp to join

    Returns:
        200: Request submitted successfully
        400: Already a member or pending request exists
        404: Camp not found
    """
    camp = Camp.query.get_or_404(camp_id)

    # Check for existing membership/request
    existing = CampMember.query.filter_by(
        camp_id=camp_id,
        user_id=current_user.id
    ).first()

    if existing:
        if existing.is_approved:
            return error_response(f"You are already a member of '{camp.name}'"), 400
        elif existing.is_pending:
            return error_response(f"You have already requested to join '{camp.name}'. Awaiting approval."), 400
        else:  # rejected
            return error_response(f"Your previous request to join '{camp.name}' was rejected"), 400

    # Create pending membership request
    membership = CampMember(
        camp_id=camp_id,
        user_id=current_user.id,
        status=AssociationStatus.PENDING.value,
        role=CampMemberRole.MEMBER.value
    )

    db.session.add(membership)
    db.session.commit()

    return success_response(
        message=f"Requested to join camp '{camp.name}'. Awaiting approval."
    )


@api_bp.route('/camps/<int:camp_id>/members/<int:user_id>/approve', methods=['POST'])
@jwt_required_with_user
def approve_member(current_user, camp_id, user_id):
    """
    Approve a pending member request.

    Users with approval permissions can approve pending member requests.

    Args:
        camp_id: ID of the camp
        user_id: ID of the user to approve

    Returns:
        200: Member approved successfully
        400: Request is not pending
        403: Permission denied
        404: Camp, user, or membership not found
    """
    camp = Camp.query.get_or_404(camp_id)
    user = User.query.get_or_404(user_id)

    # Check permissions
    if not current_user.is_site_admin_or_higher:
        if not current_user.can_approve_camp_members(camp_id):
            return error_response('You do not have permission to approve members for this camp'), 403

    # Get the membership
    membership = CampMember.query.filter_by(
        camp_id=camp_id,
        user_id=user_id
    ).first_or_404()

    # Validate status is pending
    if not membership.is_pending:
        return error_response('Can only approve pending requests'), 400

    # Approve the membership
    membership.status = AssociationStatus.APPROVED.value
    membership.approved_at = datetime.utcnow()
    db.session.commit()

    return success_response(
        data={'membership': serialize_camp_member(membership)},
        message=f"Approved {user.name}'s membership in '{camp.name}'"
    )


@api_bp.route('/camps/<int:camp_id>/members/<int:user_id>/reject', methods=['POST'])
@jwt_required_with_user
def reject_member(current_user, camp_id, user_id):
    """
    Reject a pending member request.

    Users with approval permissions can reject pending member requests.

    Args:
        camp_id: ID of the camp
        user_id: ID of the user to reject

    Returns:
        200: Member rejected successfully
        400: Request is not pending
        403: Permission denied
        404: Camp, user, or membership not found
    """
    camp = Camp.query.get_or_404(camp_id)
    user = User.query.get_or_404(user_id)

    # Check permissions
    if not current_user.is_site_admin_or_higher:
        if not current_user.can_approve_camp_members(camp_id):
            return error_response('You do not have permission to reject members for this camp'), 403

    # Get the membership
    membership = CampMember.query.filter_by(
        camp_id=camp_id,
        user_id=user_id
    ).first_or_404()

    # Validate status is pending
    if not membership.is_pending:
        return error_response('Can only reject pending requests'), 400

    # Reject the membership
    membership.status = AssociationStatus.REJECTED.value
    db.session.commit()

    return success_response(
        message=f"Rejected {user.name}'s membership request for '{camp.name}'"
    )


@api_bp.route('/camps/<int:camp_id>/members/<int:user_id>/promote', methods=['POST'])
@jwt_required_with_user
def promote_member(current_user, camp_id, user_id):
    """
    Promote a regular member to camp manager.

    Camp managers and site admins can promote approved members to manager role.

    Args:
        camp_id: ID of the camp
        user_id: ID of the user to promote

    Returns:
        200: Member promoted successfully
        400: Member is not approved or already a manager
        403: Permission denied
        404: Camp, user, or membership not found
    """
    camp = Camp.query.get_or_404(camp_id)
    user = User.query.get_or_404(user_id)

    # Check permissions: must be camp manager or site admin
    if not current_user.is_site_admin_or_higher:
        if not current_user.is_camp_manager(camp_id):
            return error_response('Only camp managers can promote members'), 403

    # Get the membership
    membership = CampMember.query.filter_by(
        camp_id=camp_id,
        user_id=user_id
    ).first_or_404()

    # Validate member is approved
    if not membership.is_approved:
        return error_response('Can only promote approved members'), 400

    # Check if already manager
    if membership.is_manager:
        return error_response(f"{user.name} is already a camp manager"), 400

    # Promote to manager
    membership.role = CampMemberRole.MANAGER.value
    db.session.commit()

    return success_response(
        data={'membership': serialize_camp_member(membership)},
        message=f"Promoted {user.name} to camp manager"
    )


@api_bp.route('/camps/<int:camp_id>/members/<int:user_id>/demote', methods=['POST'])
@jwt_required_with_user
def demote_manager(current_user, camp_id, user_id):
    """
    Demote a camp manager to regular member.

    Camp managers and site admins can demote managers to member role.
    Cannot demote if only one manager remains.

    Args:
        camp_id: ID of the camp
        user_id: ID of the user to demote

    Returns:
        200: Manager demoted successfully
        400: User is not a manager or is the last manager
        403: Permission denied
        404: Camp, user, or membership not found
    """
    camp = Camp.query.get_or_404(camp_id)
    user = User.query.get_or_404(user_id)

    # Check permissions: must be camp manager or site admin
    if not current_user.is_site_admin_or_higher:
        if not current_user.is_camp_manager(camp_id):
            return error_response('Only camp managers can demote other managers'), 403

    # Get the membership
    membership = CampMember.query.filter_by(
        camp_id=camp_id,
        user_id=user_id
    ).first_or_404()

    # Validate member is approved manager
    if not membership.is_manager:
        return error_response(f"{user.name} is not a camp manager"), 400

    # Check if this is the last manager
    manager_count = camp.camp_members.filter_by(
        status=AssociationStatus.APPROVED.value,
        role=CampMemberRole.MANAGER.value
    ).count()

    if manager_count <= 1:
        return error_response('Cannot demote the last camp manager. Promote another member first'), 400

    # Demote to member
    membership.role = CampMemberRole.MEMBER.value
    db.session.commit()

    return success_response(
        data={'membership': serialize_camp_member(membership)},
        message=f"Demoted {user.name} to regular member"
    )


@api_bp.route('/camps/<int:camp_id>/request-event/<int:event_id>', methods=['POST'])
@jwt_required_with_user
def request_event(current_user, camp_id, event_id):
    """
    Request to join an event.

    Camp managers can request their camp to join an approved event.

    Args:
        camp_id: ID of the camp
        event_id: ID of the event to join

    Returns:
        200: Request submitted successfully
        400: Event is not approved or request already exists
        403: Permission denied
        404: Camp or event not found
    """
    camp = Camp.query.get_or_404(camp_id)
    event = Event.query.get_or_404(event_id)

    # Check permission: must be camp manager or site admin
    if not current_user.is_site_admin_or_higher and not current_user.is_camp_manager(camp_id):
        return error_response('Only camp managers can request event associations'), 403

    # Validate event is approved
    if event.status != EventStatus.APPROVED.value:
        return error_response('Can only request to join approved events'), 400

    # Check for existing association
    existing = CampEventAssociation.query.filter_by(
        camp_id=camp_id,
        event_id=event_id
    ).first()

    if existing:
        return error_response(f"Camp '{camp.name}' has already requested to join '{event.title}'"), 400

    # Create pending association
    association = CampEventAssociation(
        camp_id=camp_id,
        event_id=event_id,
        status=AssociationStatus.PENDING.value
    )

    db.session.add(association)
    db.session.commit()

    return success_response(
        data={'association': serialize_event_association(association)},
        message=f"Requested to join event '{event.title}'. Awaiting event creator approval."
    )


@api_bp.route('/camps/associations/<int:association_id>/location', methods=['PUT'])
@jwt_required_with_user
def update_camp_location(current_user, association_id):
    """
    Update camp location for a specific event association.

    Camp managers can set/edit the camp's physical location for each event.

    Args:
        association_id: ID of the CampEventAssociation

    Request body:
        {
            "location": "Section B, Sites 12-15"
        }

    Returns:
        200: Location updated successfully
        403: Permission denied
        404: Association not found
    """
    association = CampEventAssociation.query.get_or_404(association_id)
    camp = association.camp

    # Check permission: must be camp manager or site admin
    if not current_user.is_site_admin_or_higher:
        if not current_user.is_camp_manager(camp.id):
            return error_response('Only camp managers can edit camp location'), 403

    data = request.get_json()
    if not data:
        return error_response('No data provided'), 400

    location = data.get('location', '').strip()
    association.location = location or None
    db.session.commit()

    return success_response(
        data={'association': serialize_event_association(association)},
        message=f'Camp location updated for {association.event.title}'
    )


@api_bp.route('/camps/pending-members', methods=['GET'])
@jwt_required_with_user
def get_pending_members(current_user):
    """
    Get all pending member requests for camps where user is a manager.

    Shows a consolidated list of all pending membership requests across all
    camps where the current user is a manager.

    Returns:
        200: List of pending member requests
    """
    # Get all camps where user is a manager
    managed_camp_ids = [m.camp_id for m in CampMember.query.filter_by(
        user_id=current_user.id,
        status=AssociationStatus.APPROVED.value,
        role=CampMemberRole.MANAGER.value
    ).all()]

    if not managed_camp_ids:
        return success_response(data={'pending_requests': []})

    # Get all pending member requests for those camps
    pending_requests = CampMember.query.filter(
        CampMember.camp_id.in_(managed_camp_ids),
        CampMember.status == AssociationStatus.PENDING.value
    ).order_by(CampMember.requested_at.desc()).all()

    # Serialize with camp info
    requests_data = []
    for req in pending_requests:
        req_data = serialize_camp_member(req)
        req_data['camp'] = {
            'id': req.camp.id,
            'name': req.camp.name
        }
        requests_data.append(req_data)

    return success_response(data={
        'pending_requests': requests_data
    })
