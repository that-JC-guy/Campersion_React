"""
Clusters API endpoints.

This module provides RESTful API endpoints for cluster management within camps,
including CRUD operations and cluster lead assignments.
"""

from flask import request
from app.api import api_bp
from app.api.errors import success_response, error_response
from app.api.decorators import jwt_required_with_user
from app.models import (
    Cluster, Camp, CampMember, AssociationStatus, db
)
from datetime import datetime


def serialize_cluster(cluster, include_teams=False):
    """Serialize cluster to dictionary."""
    from app.models import Team  # Import here to avoid circular dependency

    # Handle team_count - could be a query or a list
    if hasattr(cluster, 'teams'):
        team_count = len(cluster.teams) if isinstance(cluster.teams, list) else cluster.teams.count()
    else:
        team_count = 0

    data = {
        'id': cluster.id,
        'camp_id': cluster.camp_id,
        'name': cluster.name,
        'description': cluster.description,
        'enable_cluster_lead': cluster.enable_cluster_lead,
        'enable_backup_cluster_lead': cluster.enable_backup_cluster_lead,
        'cluster_lead': {
            'id': cluster.cluster_lead.id,
            'name': cluster.cluster_lead.name,
            'email': cluster.cluster_lead.email,
            'preferred_name': cluster.cluster_lead.preferred_name
        } if cluster.cluster_lead and cluster.enable_cluster_lead else None,
        'backup_cluster_lead': {
            'id': cluster.backup_cluster_lead.id,
            'name': cluster.backup_cluster_lead.name,
            'email': cluster.backup_cluster_lead.email,
            'preferred_name': cluster.backup_cluster_lead.preferred_name
        } if cluster.backup_cluster_lead and cluster.enable_backup_cluster_lead else None,
        'team_count': team_count,
        'created_at': cluster.created_at.isoformat(),
        'updated_at': cluster.updated_at.isoformat()
    }

    if include_teams:
        # Import Team model's serialization
        from app.api.teams import serialize_team
        data['teams'] = [serialize_team(team, include_members=True) for team in cluster.teams]

    return data


def can_user_manage_camp(user, camp_id):
    """Check if user can manage a specific camp (is camp manager)."""
    # Site admins can manage any camp
    if user.is_site_admin_or_higher:
        return True

    # Check if user is a camp manager
    membership = CampMember.query.filter_by(
        user_id=user.id,
        camp_id=camp_id,
        status=AssociationStatus.APPROVED.value,
        role='manager'
    ).first()

    return membership is not None


def is_user_camp_member(user, camp_id):
    """Check if user is an approved member of the camp."""
    membership = CampMember.query.filter_by(
        user_id=user.id,
        camp_id=camp_id,
        status=AssociationStatus.APPROVED.value
    ).first()

    return membership is not None


@api_bp.route('/camps/<int:camp_id>/clusters', methods=['GET'])
@jwt_required_with_user
def list_clusters(current_user, camp_id):
    """
    List all clusters for a camp.

    Any camp member can view clusters.

    Query params:
        include_teams (bool): Include teams in response

    Returns:
        200: List of clusters
        403: User not a camp member
        404: Camp not found
    """
    camp = Camp.query.get_or_404(camp_id)

    # Check if user is a camp member
    if not current_user.is_site_admin_or_higher and not is_user_camp_member(current_user, camp_id):
        return error_response('You must be a camp member to view clusters'), 403

    include_teams = request.args.get('include_teams', 'false').lower() == 'true'

    clusters = Cluster.query.filter_by(camp_id=camp_id).order_by(Cluster.created_at.asc()).all()

    return success_response(data={
        'clusters': [serialize_cluster(c, include_teams=include_teams) for c in clusters]
    })


@api_bp.route('/clusters/<int:cluster_id>', methods=['GET'])
@jwt_required_with_user
def get_cluster(current_user, cluster_id):
    """
    Get a single cluster with teams.

    Any camp member can view cluster details.

    Returns:
        200: Cluster details with teams
        403: User not a camp member
        404: Cluster not found
    """
    cluster = Cluster.query.get_or_404(cluster_id)

    # Check if user is a camp member
    if not current_user.is_site_admin_or_higher and not is_user_camp_member(current_user, cluster.camp_id):
        return error_response('You must be a camp member to view this cluster'), 403

    return success_response(data={
        'cluster': serialize_cluster(cluster, include_teams=True)
    })


@api_bp.route('/camps/<int:camp_id>/clusters', methods=['POST'])
@jwt_required_with_user
def create_cluster(current_user, camp_id):
    """
    Create a new cluster in a camp.

    Only camp managers can create clusters.

    Request body:
        {
            "name": "Cluster Name",
            "description": "Cluster description",
            "cluster_lead_id": 123  // Optional, must be camp member
        }

    Returns:
        201: Cluster created successfully
        400: Validation error
        403: User not a camp manager
        404: Camp not found
    """
    camp = Camp.query.get_or_404(camp_id)

    # Check if user can manage this camp
    if not can_user_manage_camp(current_user, camp_id):
        return error_response('Only camp managers can create clusters'), 403

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Validate required fields
    if not data.get('name'):
        return error_response('Cluster name is required'), 400

    # Validate cluster lead if provided
    cluster_lead_id = data.get('cluster_lead_id')
    if cluster_lead_id:
        # Verify cluster lead is a camp member
        member = CampMember.query.filter_by(
            camp_id=camp_id,
            user_id=cluster_lead_id,
            status=AssociationStatus.APPROVED.value
        ).first()

        if not member:
            return error_response('Cluster lead must be an approved camp member'), 400

    # Check for duplicate cluster name in this camp
    existing = Cluster.query.filter_by(
        camp_id=camp_id,
        name=data['name'].strip()
    ).first()

    if existing:
        return error_response('A cluster with this name already exists in this camp'), 400

    # Create cluster
    description = data.get('description')
    cluster = Cluster(
        camp_id=camp_id,
        name=data['name'].strip(),
        description=description.strip() if description else None,
        cluster_lead_id=cluster_lead_id
    )

    db.session.add(cluster)
    db.session.commit()

    return success_response(
        data={'cluster': serialize_cluster(cluster)},
        message='Cluster created successfully'
    ), 201


@api_bp.route('/clusters/<int:cluster_id>', methods=['PUT'])
@jwt_required_with_user
def update_cluster(current_user, cluster_id):
    """
    Update a cluster.

    Only camp managers can update clusters.

    Request body:
        {
            "name": "Updated Name",
            "description": "Updated description",
            "enable_cluster_lead": true,
            "enable_backup_cluster_lead": true,
            "cluster_lead_id": 123,  // null to remove cluster lead
            "backup_cluster_lead_id": 456  // null to remove backup cluster lead
        }

    Returns:
        200: Cluster updated successfully
        400: Validation error
        403: User not a camp manager
        404: Cluster not found
    """
    cluster = Cluster.query.get_or_404(cluster_id)

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Determine if this is a self-assignment operation (only changing lead fields for current user)
    is_manager = can_user_manage_camp(current_user, cluster.camp_id)
    is_self_lead_update = (
        set(data.keys()).issubset({'cluster_lead_id', 'backup_cluster_lead_id'}) and
        (data.get('cluster_lead_id') == current_user.id or data.get('cluster_lead_id') is None) and
        (data.get('backup_cluster_lead_id') == current_user.id or data.get('backup_cluster_lead_id') is None or 'backup_cluster_lead_id' not in data) and
        ('cluster_lead_id' not in data or data.get('cluster_lead_id') is None or cluster.cluster_lead_id is None or cluster.cluster_lead_id == current_user.id) and
        ('backup_cluster_lead_id' not in data or data.get('backup_cluster_lead_id') is None or cluster.backup_cluster_lead_id is None or cluster.backup_cluster_lead_id == current_user.id)
    )

    # Check if user is an approved camp member
    is_camp_member = is_user_camp_member(current_user, cluster.camp_id) if not is_manager else True

    # Only managers can update non-lead fields
    if not is_manager and not is_self_lead_update:
        return error_response('Only camp managers can update cluster details'), 403

    # Members can only do self-assignment if they're approved camp members
    if not is_manager and not is_camp_member:
        return error_response('You must be an approved camp member'), 403

    # Update name if provided
    if 'name' in data:
        if not data['name']:
            return error_response('Cluster name cannot be empty'), 400

        # Check for duplicate name (excluding current cluster)
        existing = Cluster.query.filter(
            Cluster.camp_id == cluster.camp_id,
            Cluster.name == data['name'].strip(),
            Cluster.id != cluster_id
        ).first()

        if existing:
            return error_response('A cluster with this name already exists in this camp'), 400

        cluster.name = data['name'].strip()

    # Update description if provided
    if 'description' in data:
        description = data['description']
        cluster.description = description.strip() if description else None

    # Update enable flags if provided
    if 'enable_cluster_lead' in data:
        cluster.enable_cluster_lead = bool(data['enable_cluster_lead'])
        # Clear lead if disabled
        if not cluster.enable_cluster_lead:
            cluster.cluster_lead_id = None

    if 'enable_backup_cluster_lead' in data:
        cluster.enable_backup_cluster_lead = bool(data['enable_backup_cluster_lead'])
        # Clear backup lead if disabled
        if not cluster.enable_backup_cluster_lead:
            cluster.backup_cluster_lead_id = None

    # Update cluster lead if provided
    if 'cluster_lead_id' in data and cluster.enable_cluster_lead:
        cluster_lead_id = data['cluster_lead_id']

        if cluster_lead_id:
            # Verify cluster lead is a camp member
            member = CampMember.query.filter_by(
                camp_id=cluster.camp_id,
                user_id=cluster_lead_id,
                status=AssociationStatus.APPROVED.value
            ).first()

            if not member:
                return error_response('Cluster lead must be an approved camp member'), 400

        cluster.cluster_lead_id = cluster_lead_id

    # Update backup cluster lead if provided
    if 'backup_cluster_lead_id' in data and cluster.enable_backup_cluster_lead:
        backup_cluster_lead_id = data['backup_cluster_lead_id']

        if backup_cluster_lead_id:
            # Verify backup cluster lead is a camp member
            member = CampMember.query.filter_by(
                camp_id=cluster.camp_id,
                user_id=backup_cluster_lead_id,
                status=AssociationStatus.APPROVED.value
            ).first()

            if not member:
                return error_response('Backup cluster lead must be an approved camp member'), 400

        cluster.backup_cluster_lead_id = backup_cluster_lead_id

    cluster.updated_at = datetime.utcnow()
    db.session.commit()

    return success_response(
        data={'cluster': serialize_cluster(cluster)},
        message='Cluster updated successfully'
    )


@api_bp.route('/clusters/<int:cluster_id>', methods=['DELETE'])
@jwt_required_with_user
def delete_cluster(current_user, cluster_id):
    """
    Delete a cluster.

    Only camp managers can delete clusters.
    Deleting a cluster cascades to delete all teams and team members.

    Returns:
        200: Cluster deleted successfully
        403: User not a camp manager
        404: Cluster not found
    """
    cluster = Cluster.query.get_or_404(cluster_id)

    # Check if user can manage this camp
    if not can_user_manage_camp(current_user, cluster.camp_id):
        return error_response('Only camp managers can delete clusters'), 403

    cluster_name = cluster.name
    db.session.delete(cluster)
    db.session.commit()

    return success_response(message=f'Cluster "{cluster_name}" deleted successfully')
