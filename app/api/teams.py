"""
Teams API endpoints.

This module provides RESTful API endpoints for team management within clusters,
including CRUD operations, team lead assignments, and team member management.
"""

from flask import request
from app.api import api_bp
from app.api.errors import success_response, error_response
from app.api.decorators import jwt_required_with_user
from app.models import (
    Team, TeamMember, Cluster, Camp, CampMember, AssociationStatus, db
)
from datetime import datetime


def serialize_team(team, include_members=False):
    """Serialize team to dictionary."""
    # Handle member_count - could be a query or a list
    if hasattr(team, 'team_members'):
        member_count = len(team.team_members) if isinstance(team.team_members, list) else team.team_members.count()
    else:
        member_count = 0

    data = {
        'id': team.id,
        'cluster_id': team.cluster_id,
        'name': team.name,
        'description': team.description,
        'enable_team_lead': team.enable_team_lead,
        'enable_backup_team_lead': team.enable_backup_team_lead,
        'team_lead': {
            'id': team.team_lead.id,
            'name': team.team_lead.name,
            'email': team.team_lead.email,
            'preferred_name': team.team_lead.preferred_name,
            'pronouns': team.team_lead.pronouns,
            'show_pronouns': team.team_lead.show_pronouns
        } if team.team_lead and team.enable_team_lead else None,
        'backup_team_lead': {
            'id': team.backup_team_lead.id,
            'name': team.backup_team_lead.name,
            'email': team.backup_team_lead.email,
            'preferred_name': team.backup_team_lead.preferred_name,
            'pronouns': team.backup_team_lead.pronouns,
            'show_pronouns': team.backup_team_lead.show_pronouns
        } if team.backup_team_lead and team.enable_backup_team_lead else None,
        'member_count': member_count,
        'created_at': team.created_at.isoformat(),
        'updated_at': team.updated_at.isoformat()
    }

    if include_members:
        data['members'] = [serialize_team_member(tm) for tm in team.team_members]

    return data


def serialize_team_member(team_member):
    """Serialize team member to dictionary."""
    return {
        'id': team_member.id,
        'team_id': team_member.team_id,
        'user': {
            'id': team_member.user.id,
            'name': team_member.user.name,
            'email': team_member.user.email,
            'preferred_name': team_member.user.preferred_name,
            'pronouns': team_member.user.pronouns,
            'show_pronouns': team_member.user.show_pronouns
        },
        'joined_at': team_member.joined_at.isoformat()
    }


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


@api_bp.route('/clusters/<int:cluster_id>/teams', methods=['GET'])
@jwt_required_with_user
def list_teams(current_user, cluster_id):
    """
    List all teams for a cluster.

    Any camp member can view teams.

    Query params:
        include_members (bool): Include team members in response

    Returns:
        200: List of teams
        403: User not a camp member
        404: Cluster not found
    """
    cluster = Cluster.query.get_or_404(cluster_id)

    # Check if user is a camp member
    if not current_user.is_site_admin_or_higher and not is_user_camp_member(current_user, cluster.camp_id):
        return error_response('You must be a camp member to view teams'), 403

    include_members = request.args.get('include_members', 'false').lower() == 'true'

    teams = Team.query.filter_by(cluster_id=cluster_id).order_by(Team.created_at.asc()).all()

    return success_response(data={
        'teams': [serialize_team(t, include_members=include_members) for t in teams]
    })


@api_bp.route('/teams/<int:team_id>', methods=['GET'])
@jwt_required_with_user
def get_team(current_user, team_id):
    """
    Get a single team with members.

    Any camp member can view team details.

    Returns:
        200: Team details with members
        403: User not a camp member
        404: Team not found
    """
    team = Team.query.get_or_404(team_id)
    cluster = Cluster.query.get(team.cluster_id)

    # Check if user is a camp member
    if not current_user.is_site_admin_or_higher and not is_user_camp_member(current_user, cluster.camp_id):
        return error_response('You must be a camp member to view this team'), 403

    return success_response(data={
        'team': serialize_team(team, include_members=True)
    })


@api_bp.route('/clusters/<int:cluster_id>/teams', methods=['POST'])
@jwt_required_with_user
def create_team(current_user, cluster_id):
    """
    Create a new team in a cluster.

    Only camp managers can create teams.

    Request body:
        {
            "name": "Team Name",
            "description": "Team description",
            "team_lead_id": 123  // Optional, must be camp member
        }

    Returns:
        201: Team created successfully
        400: Validation error
        403: User not a camp manager
        404: Cluster not found
    """
    cluster = Cluster.query.get_or_404(cluster_id)

    # Check if user can manage this camp
    if not can_user_manage_camp(current_user, cluster.camp_id):
        return error_response('Only camp managers can create teams'), 403

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Validate required fields
    if not data.get('name'):
        return error_response('Team name is required'), 400

    # Validate team lead if provided
    team_lead_id = data.get('team_lead_id')
    if team_lead_id:
        # Verify team lead is a camp member
        member = CampMember.query.filter_by(
            camp_id=cluster.camp_id,
            user_id=team_lead_id,
            status=AssociationStatus.APPROVED.value
        ).first()

        if not member:
            return error_response('Team lead must be an approved camp member'), 400

    # Check for duplicate team name in this cluster
    existing = Team.query.filter_by(
        cluster_id=cluster_id,
        name=data['name'].strip()
    ).first()

    if existing:
        return error_response('A team with this name already exists in this cluster'), 400

    # Create team
    description = data.get('description')
    team = Team(
        cluster_id=cluster_id,
        name=data['name'].strip(),
        description=description.strip() if description else None,
        team_lead_id=team_lead_id
    )

    db.session.add(team)
    db.session.flush()  # Flush to get the team ID

    # Automatically add team lead as team member if a lead was assigned
    if team_lead_id:
        team_member = TeamMember(
            team_id=team.id,
            user_id=team_lead_id
        )
        db.session.add(team_member)

    db.session.commit()

    return success_response(
        data={'team': serialize_team(team)},
        message='Team created successfully'
    ), 201


@api_bp.route('/teams/<int:team_id>', methods=['PUT'])
@jwt_required_with_user
def update_team(current_user, team_id):
    """
    Update a team.

    Only camp managers can update teams.

    Request body:
        {
            "name": "Updated Name",
            "description": "Updated description",
            "enable_team_lead": true,
            "enable_backup_team_lead": true,
            "team_lead_id": 123,  // null to remove team lead
            "backup_team_lead_id": 456  // null to remove backup team lead
        }

    Returns:
        200: Team updated successfully
        400: Validation error
        403: User not a camp manager
        404: Team not found
    """
    team = Team.query.get_or_404(team_id)
    cluster = Cluster.query.get(team.cluster_id)

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Determine if this is a self-assignment operation (only changing lead fields for current user)
    is_manager = can_user_manage_camp(current_user, cluster.camp_id)
    is_self_lead_update = (
        set(data.keys()).issubset({'team_lead_id', 'backup_team_lead_id'}) and
        (data.get('team_lead_id') == current_user.id or data.get('team_lead_id') is None) and
        (data.get('backup_team_lead_id') == current_user.id or data.get('backup_team_lead_id') is None or 'backup_team_lead_id' not in data) and
        ('team_lead_id' not in data or data.get('team_lead_id') is None or team.team_lead_id is None or team.team_lead_id == current_user.id) and
        ('backup_team_lead_id' not in data or data.get('backup_team_lead_id') is None or team.backup_team_lead_id is None or team.backup_team_lead_id == current_user.id)
    )

    # Check if user is an approved camp member
    is_camp_member = is_user_camp_member(current_user, cluster.camp_id) if not is_manager else True

    # Only managers can update non-lead fields
    if not is_manager and not is_self_lead_update:
        return error_response('Only camp managers can update team details'), 403

    # Members can only do self-assignment if they're approved camp members
    if not is_manager and not is_camp_member:
        return error_response('You must be an approved camp member'), 403

    # Update name if provided
    if 'name' in data:
        if not data['name']:
            return error_response('Team name cannot be empty'), 400

        # Check for duplicate name (excluding current team)
        existing = Team.query.filter(
            Team.cluster_id == team.cluster_id,
            Team.name == data['name'].strip(),
            Team.id != team_id
        ).first()

        if existing:
            return error_response('A team with this name already exists in this cluster'), 400

        team.name = data['name'].strip()

    # Update description if provided
    if 'description' in data:
        description = data['description']
        team.description = description.strip() if description else None

    # Update enable flags if provided
    if 'enable_team_lead' in data:
        team.enable_team_lead = bool(data['enable_team_lead'])
        # Clear lead if disabled
        if not team.enable_team_lead:
            team.team_lead_id = None

    if 'enable_backup_team_lead' in data:
        team.enable_backup_team_lead = bool(data['enable_backup_team_lead'])
        # Clear backup lead if disabled
        if not team.enable_backup_team_lead:
            team.backup_team_lead_id = None

    # Update team lead if provided
    if 'team_lead_id' in data and team.enable_team_lead:
        team_lead_id = data['team_lead_id']

        if team_lead_id:
            # Verify team lead is a camp member
            member = CampMember.query.filter_by(
                camp_id=cluster.camp_id,
                user_id=team_lead_id,
                status=AssociationStatus.APPROVED.value
            ).first()

            if not member:
                return error_response('Team lead must be an approved camp member'), 400

            # Automatically add team lead as team member if not already
            existing_team_member = TeamMember.query.filter_by(
                team_id=team_id,
                user_id=team_lead_id
            ).first()

            if not existing_team_member:
                team_member = TeamMember(
                    team_id=team_id,
                    user_id=team_lead_id
                )
                db.session.add(team_member)

        team.team_lead_id = team_lead_id

    # Update backup team lead if provided
    if 'backup_team_lead_id' in data and team.enable_backup_team_lead:
        backup_team_lead_id = data['backup_team_lead_id']

        if backup_team_lead_id:
            # Verify backup team lead is a camp member
            member = CampMember.query.filter_by(
                camp_id=cluster.camp_id,
                user_id=backup_team_lead_id,
                status=AssociationStatus.APPROVED.value
            ).first()

            if not member:
                return error_response('Backup team lead must be an approved camp member'), 400

            # Automatically add backup lead as team member if not already
            existing_team_member = TeamMember.query.filter_by(
                team_id=team_id,
                user_id=backup_team_lead_id
            ).first()

            if not existing_team_member:
                team_member = TeamMember(
                    team_id=team_id,
                    user_id=backup_team_lead_id
                )
                db.session.add(team_member)

        team.backup_team_lead_id = backup_team_lead_id

    team.updated_at = datetime.utcnow()
    db.session.commit()

    return success_response(
        data={'team': serialize_team(team)},
        message='Team updated successfully'
    )


@api_bp.route('/teams/<int:team_id>', methods=['DELETE'])
@jwt_required_with_user
def delete_team(current_user, team_id):
    """
    Delete a team.

    Only camp managers can delete teams.
    Deleting a team cascades to delete all team members.

    Returns:
        200: Team deleted successfully
        403: User not a camp manager
        404: Team not found
    """
    team = Team.query.get_or_404(team_id)
    cluster = Cluster.query.get(team.cluster_id)

    # Check if user can manage this camp
    if not can_user_manage_camp(current_user, cluster.camp_id):
        return error_response('Only camp managers can delete teams'), 403

    team_name = team.name
    db.session.delete(team)
    db.session.commit()

    return success_response(message=f'Team "{team_name}" deleted successfully')


@api_bp.route('/teams/<int:team_id>/members', methods=['POST'])
@jwt_required_with_user
def add_team_member(current_user, team_id):
    """
    Add a member to a team.

    Only camp managers can add team members.

    Request body:
        {
            "user_id": 123  // Must be an approved camp member
        }

    Returns:
        201: Team member added successfully
        400: Validation error
        403: User not a camp manager
        404: Team not found
    """
    team = Team.query.get_or_404(team_id)
    cluster = Cluster.query.get(team.cluster_id)

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    user_id = data.get('user_id')
    if not user_id:
        return error_response('User ID is required'), 400

    # Verify user is a camp member
    member = CampMember.query.filter_by(
        camp_id=cluster.camp_id,
        user_id=user_id,
        status=AssociationStatus.APPROVED.value
    ).first()

    if not member:
        return error_response('User must be an approved camp member'), 400

    # Check permissions: camp managers can add anyone, members can only add themselves
    is_self_assignment = (user_id == current_user.id)
    if not is_self_assignment and not can_user_manage_camp(current_user, cluster.camp_id):
        return error_response('Only camp managers can add other members to teams'), 403

    # Check if already a team member
    existing = TeamMember.query.filter_by(
        team_id=team_id,
        user_id=user_id
    ).first()

    if existing:
        return error_response('User is already a member of this team'), 400

    # Add team member
    team_member = TeamMember(
        team_id=team_id,
        user_id=user_id
    )

    db.session.add(team_member)
    db.session.commit()

    return success_response(
        data={'team_member': serialize_team_member(team_member)},
        message='Team member added successfully'
    ), 201


@api_bp.route('/teams/<int:team_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required_with_user
def remove_team_member(current_user, team_id, user_id):
    """
    Remove a member from a team.

    Only camp managers can remove team members.

    Returns:
        200: Team member removed successfully
        403: User not a camp manager
        404: Team or member not found
    """
    team = Team.query.get_or_404(team_id)
    cluster = Cluster.query.get(team.cluster_id)

    # Prevent removing team leads or backup leads - they must be unassigned first
    if team.team_lead_id == user_id:
        return error_response('Cannot remove team lead from team. Unassign the team lead role first.'), 400
    if team.backup_team_lead_id == user_id:
        return error_response('Cannot remove backup team lead from team. Unassign the backup lead role first.'), 400

    # Check permissions: camp managers can remove anyone, members can only remove themselves
    is_self_removal = (user_id == current_user.id)
    if not is_self_removal and not can_user_manage_camp(current_user, cluster.camp_id):
        return error_response('Only camp managers can remove other members from teams'), 403

    team_member = TeamMember.query.filter_by(
        team_id=team_id,
        user_id=user_id
    ).first_or_404()

    user_name = team_member.user.name
    db.session.delete(team_member)
    db.session.commit()

    return success_response(message=f'{user_name} removed from team successfully')


@api_bp.route('/teams/<int:team_id>/move', methods=['PUT'])
@jwt_required_with_user
def move_team(current_user, team_id):
    """
    Move a team to a different cluster.

    Only camp managers can move teams.
    The target cluster must be in the same camp.

    Request body:
        {
            "new_cluster_id": 456
        }

    Returns:
        200: Team moved successfully
        400: Validation error (duplicate name, same camp required)
        403: User not a camp manager
        404: Team or cluster not found
    """
    team = Team.query.get_or_404(team_id)
    old_cluster = Cluster.query.get(team.cluster_id)

    # Check if user can manage this camp
    if not can_user_manage_camp(current_user, old_cluster.camp_id):
        return error_response('Only camp managers can move teams'), 403

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    new_cluster_id = data.get('new_cluster_id')
    if not new_cluster_id:
        return error_response('new_cluster_id is required'), 400

    new_cluster = Cluster.query.get_or_404(new_cluster_id)

    # Verify new cluster is in the same camp
    if new_cluster.camp_id != old_cluster.camp_id:
        return error_response('Can only move teams within the same camp'), 400

    # Check for duplicate name in new cluster
    existing = Team.query.filter_by(
        cluster_id=new_cluster_id,
        name=team.name
    ).first()

    if existing:
        return error_response(
            f'A team named "{team.name}" already exists in cluster "{new_cluster.name}"'
        ), 400

    # Move the team
    old_cluster_name = old_cluster.name
    team.cluster_id = new_cluster_id
    team.updated_at = datetime.utcnow()
    db.session.commit()

    return success_response(
        data={'team': serialize_team(team)},
        message=f'Moved team "{team.name}" from "{old_cluster_name}" to "{new_cluster.name}"'
    )
