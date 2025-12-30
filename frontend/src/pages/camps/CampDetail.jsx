/**
 * Camp Detail Page.
 *
 * Displays camp details including:
 * - Amenities and capacity (collapsible)
 * - Members list (collapsible)
 * - Shared inventory from members (collapsible)
 * - Member management (for managers, collapsible)
 * - Event associations (collapsible)
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useCamp,
  useRequestCampMembership,
  useApproveCampMember,
  useRejectCampMember,
  usePromoteCampMember,
  useDemoteCampManager,
  useRequestEventAssociation
} from '../../hooks/useCamps';
import { useClusters, useUpdateCluster } from '../../hooks/useClusters';
import { useUpdateTeam, useAddTeamMember, useRemoveTeamMember } from '../../hooks/useTeams';
import { useUpdateCamp } from '../../hooks/useCamps';
import { useAuth } from '../../contexts/AuthContext';

function CampDetail() {
  const { campId } = useParams();
  const { data: camp, isLoading, error } = useCamp(parseInt(campId));
  const { data: clustersData } = useClusters(campId, true);
  const { user } = useAuth();

  const requestMembershipMutation = useRequestCampMembership();
  const approveMemberMutation = useApproveCampMember();
  const rejectMemberMutation = useRejectCampMember();
  const promoteMutation = usePromoteCampMember();
  const demoteMutation = useDemoteCampManager();
  const requestEventMutation = useRequestEventAssociation();
  const updateCampMutation = useUpdateCamp();
  const updateClusterMutation = useUpdateCluster();
  const updateTeamMutation = useUpdateTeam();
  const addTeamMemberMutation = useAddTeamMember();
  const removeTeamMemberMutation = useRemoveTeamMember();

  const [selectedEvent, setSelectedEvent] = useState('');

  const clusters = clustersData?.clusters || [];

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState({
    details: false,
    members: false,
    inventory: false,
    memberManagement: false,
    organization: false,
    events: false
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRequestMembership = () => {
    if (window.confirm('Request to join this camp?')) {
      requestMembershipMutation.mutate(parseInt(campId));
    }
  };

  const handleApproveMember = (userId, userName) => {
    if (window.confirm(`Approve ${userName}'s membership?`)) {
      approveMemberMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handleRejectMember = (userId, userName) => {
    if (window.confirm(`Reject ${userName}'s membership request?`)) {
      rejectMemberMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handlePromote = (userId, userName) => {
    if (window.confirm(`Promote ${userName} to camp manager?`)) {
      promoteMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handleDemote = (userId, userName) => {
    if (window.confirm(`Demote ${userName} to regular member?`)) {
      demoteMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handleRequestEvent = () => {
    if (!selectedEvent) return;
    if (window.confirm('Request to join this event?')) {
      requestEventMutation.mutate(
        { campId: parseInt(campId), eventId: parseInt(selectedEvent) },
        {
          onSuccess: () => setSelectedEvent('')
        }
      );
    }
  };

  // Self-assignment handlers
  const handleToggleCampLead = async (isCurrentlyAssigned) => {
    const newLeadId = isCurrentlyAssigned ? null : user.id;
    await updateCampMutation.mutateAsync({
      campId: parseInt(campId),
      data: { camp_lead_id: newLeadId }
    });
  };

  const handleToggleBackupCampLead = async (isCurrentlyAssigned) => {
    const newLeadId = isCurrentlyAssigned ? null : user.id;
    await updateCampMutation.mutateAsync({
      campId: parseInt(campId),
      data: { backup_camp_lead_id: newLeadId }
    });
  };

  const handleToggleClusterLead = async (cluster, isCurrentlyAssigned) => {
    const newLeadId = isCurrentlyAssigned ? null : user.id;
    await updateClusterMutation.mutateAsync({
      clusterId: cluster.id,
      campId,
      data: { cluster_lead_id: newLeadId }
    });
  };

  const handleToggleBackupClusterLead = async (cluster, isCurrentlyAssigned) => {
    const newLeadId = isCurrentlyAssigned ? null : user.id;
    await updateClusterMutation.mutateAsync({
      clusterId: cluster.id,
      campId,
      data: { backup_cluster_lead_id: newLeadId }
    });
  };

  const handleToggleTeamLead = async (team, isCurrentlyAssigned) => {
    const newLeadId = isCurrentlyAssigned ? null : user.id;
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      clusterId: team.cluster_id,
      campId,
      data: { team_lead_id: newLeadId }
    });
  };

  const handleToggleBackupTeamLead = async (team, isCurrentlyAssigned) => {
    const newLeadId = isCurrentlyAssigned ? null : user.id;
    await updateTeamMutation.mutateAsync({
      teamId: team.id,
      clusterId: team.cluster_id,
      campId,
      data: { backup_team_lead_id: newLeadId }
    });
  };

  const handleToggleTeamMember = async (team, isCurrentlyMember) => {
    // Don't allow removing if user is a lead (checkbox should be disabled, but double-check)
    const isTeamLead = team.team_lead?.id === user?.id;
    const isBackupTeamLead = team.backup_team_lead?.id === user?.id;

    if (isCurrentlyMember && (isTeamLead || isBackupTeamLead)) {
      // Silently ignore - user has a leadership role
      return;
    }

    if (isCurrentlyMember) {
      await removeTeamMemberMutation.mutateAsync({
        teamId: team.id,
        userId: user.id,
        campId
      });
    } else {
      await addTeamMemberMutation.mutateAsync({
        teamId: team.id,
        userId: user.id,
        campId
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {error.response?.data?.error || 'Failed to load camp. Please try again.'}
        </div>
        <Link to="/camps" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back to Camps
        </Link>
      </div>
    );
  }

  if (!camp) return null;

  const isManager = camp.user_membership?.role === 'manager';
  const isMember = camp.user_membership?.status === 'approved';
  const isPending = camp.user_membership?.status === 'pending';
  const canManage = isManager || (user && ['site_admin', 'global_admin'].includes(user.role));

  // Calculate total members
  const totalMembers = (camp.members?.managers?.length || 0) + (camp.members?.regular_members?.length || 0);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-flag me-2"></i>{camp.name}</h2>
        <div className="btn-group">
          <Link to="/camps" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back
          </Link>
          {canManage && (
            <Link to={`/camps/${campId}/organization`} className="btn btn-outline-primary">
              <i className="bi bi-diagram-3 me-2"></i>Organization
            </Link>
          )}
          {user && camp.creator_id === user.id && (
            <Link to={`/camps/${campId}/edit`} className="btn btn-primary">
              <i className="bi bi-pencil me-2"></i>Edit
            </Link>
          )}
        </div>
      </div>

      {/* Membership Actions */}
      {user && !isMember && !isPending && (
        <div className="alert alert-info">
          <button
            className="btn btn-primary"
            onClick={handleRequestMembership}
            disabled={requestMembershipMutation.isPending}
          >
            <i className="bi bi-person-plus me-2"></i>
            Request to Join Camp
          </button>
        </div>
      )}

      {isPending && (
        <div className="alert alert-warning">
          <i className="bi bi-clock me-2"></i>
          Your membership request is pending approval.
        </div>
      )}

      {/* Camp Details - Collapsible */}
      <div className="card mb-3">
        <div
          className="card-header d-flex justify-content-between align-items-center"
          style={{ cursor: 'pointer' }}
          onClick={() => toggleSection('details')}
        >
          <h5 className="mb-0">Camp Details</h5>
          <i className={`bi bi-chevron-${collapsedSections.details ? 'down' : 'up'}`}></i>
        </div>
        <div className={`collapse ${!collapsedSections.details ? 'show' : ''}`}>
          <div className="card-body">
            {camp.description && (
              <div className="row mb-3">
                <div className="col-md-3 fw-bold">Description:</div>
                <div className="col-md-9">{camp.description}</div>
              </div>
            )}

            <div className="row mb-3">
              <div className="col-md-3 fw-bold">Capacity:</div>
              <div className="col-md-9">
                <i className="bi bi-house me-2"></i>
                {camp.max_sites || 'N/A'} sites
                <span className="ms-3">
                  <i className="bi bi-people me-2"></i>
                  {camp.max_people || 'N/A'} people
                </span>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-3 fw-bold">Amenities:</div>
              <div className="col-md-9">
                {camp.has_communal_kitchen && <span className="badge bg-success me-1 mb-1">Communal Kitchen</span>}
                {camp.has_communal_space && <span className="badge bg-success me-1 mb-1">Common Space</span>}
                {camp.has_art_exhibits && <span className="badge bg-success me-1 mb-1">Art Exhibits</span>}
                {camp.has_member_activities && <span className="badge bg-success me-1 mb-1">Member Activities</span>}
                {camp.has_non_member_activities && <span className="badge bg-success me-1 mb-1">Public Activities</span>}
                {camp.custom_amenities && (
                  <div className="mt-1">
                    <small className="text-muted">{camp.custom_amenities}</small>
                  </div>
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-md-3 fw-bold">Created:</div>
              <div className="col-md-9">{formatDate(camp.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Members List - Collapsible, visible to all */}
      <div className="card mb-3">
        <div
          className="card-header d-flex justify-content-between align-items-center"
          style={{ cursor: 'pointer' }}
          onClick={() => toggleSection('members')}
        >
          <h5 className="mb-0">
            <i className="bi bi-people me-2"></i>Members
            <span className="badge bg-secondary ms-2">{totalMembers}</span>
          </h5>
          <i className={`bi bi-chevron-${collapsedSections.members ? 'down' : 'up'}`}></i>
        </div>
        <div className={`collapse ${!collapsedSections.members ? 'show' : ''}`}>
          <div className="card-body">
            {camp.members && (
              <>
                {/* Managers */}
                {camp.members.managers && camp.members.managers.length > 0 && (
                  <>
                    <h6 className="text-primary">Managers ({camp.members.managers.length})</h6>
                    <div className="list-group mb-3">
                      {camp.members.managers.map((member) => (
                        <div key={member.id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{member.user.name}</strong>
                              {isMember && (
                                <>
                                  <br />
                                  <small className="text-muted">{member.user.email}</small>
                                </>
                              )}
                            </div>
                            <span className="badge bg-primary">Manager</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Regular Members */}
                {camp.members.regular_members && camp.members.regular_members.length > 0 && (
                  <>
                    <h6 className="text-success">Members ({camp.members.regular_members.length})</h6>
                    <div className="list-group">
                      {camp.members.regular_members.map((member) => (
                        <div key={member.id} className="list-group-item">
                          <div>
                            <strong>{member.user.name}</strong>
                            {isMember && (
                              <>
                                <br />
                                <small className="text-muted">{member.user.email}</small>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {totalMembers === 0 && (
                  <p className="text-muted mb-0">No members yet.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* My Volunteering - Clusters & Teams - Collapsible, visible to members */}
      {isMember && (camp.enable_camp_lead || camp.enable_backup_camp_lead || clusters.length > 0) && (
        <div className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleSection('organization')}
          >
            <h5 className="mb-0">
              <i className="bi bi-person-check me-2"></i>My Volunteering - Clusters &amp; Teams
              {clusters.length > 0 && (
                <span className="badge bg-secondary ms-2">{clusters.length} clusters</span>
              )}
            </h5>
            <i className={`bi bi-chevron-${collapsedSections.organization ? 'down' : 'up'}`}></i>
          </div>
          <div className={`collapse ${!collapsedSections.organization ? 'show' : ''}`}>
            <div className="card-body">
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                <small>Check the boxes to volunteer for leadership roles or team membership</small>
              </div>

              {/* Camp Leadership Self-Assignment */}
              {(camp.enable_camp_lead || camp.enable_backup_camp_lead) && (
                <div className="card mb-3 border-primary">
                  <div className="card-header bg-primary text-white">
                    <h6 className="mb-0">
                      <i className="bi bi-flag me-2"></i>
                      Camp Leadership
                    </h6>
                  </div>
                  <div className="card-body">
                    {/* Display current camp leadership */}
                    {(camp.camp_lead || camp.backup_camp_lead) && (
                      <div className="mb-2 pb-2 border-bottom">
                        <small className="text-muted">
                          {camp.camp_lead && (
                            <div>
                              <i className="bi bi-person-badge me-1"></i>
                              <strong>Camp Lead:</strong>{' '}
                              {camp.camp_lead.preferred_name || camp.camp_lead.name}
                            </div>
                          )}
                          {camp.backup_camp_lead && (
                            <div>
                              <i className="bi bi-person-badge me-1"></i>
                              <strong>Backup Lead:</strong>{' '}
                              {camp.backup_camp_lead.preferred_name || camp.backup_camp_lead.name}
                            </div>
                          )}
                        </small>
                      </div>
                    )}

                    {/* Camp Leadership Self-Assignment Checkboxes */}
                    <div className="d-flex flex-wrap gap-3">
                      {camp.enable_camp_lead && (
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="camp-lead-volunteer"
                            checked={camp.camp_lead?.id === user?.id}
                            onChange={() => handleToggleCampLead(camp.camp_lead?.id === user?.id)}
                            disabled={camp.camp_lead && camp.camp_lead.id !== user?.id}
                            title={camp.camp_lead && camp.camp_lead.id !== user?.id ? "Role is currently filled" : ""}
                          />
                          <label className="form-check-label" htmlFor="camp-lead-volunteer">
                            <strong>Camp Lead</strong>
                            {camp.camp_lead && camp.camp_lead.id !== user?.id && (
                              <span className="text-muted ms-1">
                                ({camp.camp_lead.preferred_name || camp.camp_lead.name})
                              </span>
                            )}
                          </label>
                        </div>
                      )}
                      {camp.enable_backup_camp_lead && (
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="backup-camp-lead-volunteer"
                            checked={camp.backup_camp_lead?.id === user?.id}
                            onChange={() => handleToggleBackupCampLead(camp.backup_camp_lead?.id === user?.id)}
                            disabled={camp.backup_camp_lead && camp.backup_camp_lead.id !== user?.id}
                            title={camp.backup_camp_lead && camp.backup_camp_lead.id !== user?.id ? "Role is currently filled" : ""}
                          />
                          <label className="form-check-label" htmlFor="backup-camp-lead-volunteer">
                            <strong>Backup Camp Lead</strong>
                            {camp.backup_camp_lead && camp.backup_camp_lead.id !== user?.id && (
                              <span className="text-muted ms-1">
                                ({camp.backup_camp_lead.preferred_name || camp.backup_camp_lead.name})
                              </span>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {clusters.map((cluster) => {
                const isClusterLead = cluster.cluster_lead?.id === user?.id;
                const isBackupClusterLead = cluster.backup_cluster_lead?.id === user?.id;

                return (
                  <div key={cluster.id} className="card mb-3 border-secondary">
                    <div className="card-header bg-light">
                      <div className="d-flex align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-2">
                            <i className="bi bi-diagram-2 me-2"></i>
                            {cluster.name}
                            <span className="badge bg-info text-dark ms-2">
                              {cluster.team_count} {cluster.team_count === 1 ? 'team' : 'teams'}
                            </span>
                          </h6>
                          {cluster.description && (
                            <p className="text-muted small mb-2">{cluster.description}</p>
                          )}

                          {/* Display current cluster leadership */}
                          {(cluster.cluster_lead || cluster.backup_cluster_lead) && (
                            <div className="mb-2 pb-2 border-bottom">
                              <small className="text-muted">
                                {cluster.cluster_lead && (
                                  <div>
                                    <i className="bi bi-person-badge me-1"></i>
                                    <strong>Cluster Lead:</strong>{' '}
                                    {cluster.cluster_lead.preferred_name || cluster.cluster_lead.name}
                                  </div>
                                )}
                                {cluster.backup_cluster_lead && (
                                  <div>
                                    <i className="bi bi-person-badge me-1"></i>
                                    <strong>Backup Lead:</strong>{' '}
                                    {cluster.backup_cluster_lead.preferred_name || cluster.backup_cluster_lead.name}
                                  </div>
                                )}
                              </small>
                            </div>
                          )}

                          {/* Cluster Leadership Self-Assignment */}
                          <div className="d-flex flex-wrap gap-3 mt-2">
                            {cluster.enable_cluster_lead && (
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`cluster-lead-${cluster.id}`}
                                  checked={isClusterLead}
                                  onChange={() => handleToggleClusterLead(cluster, isClusterLead)}
                                  disabled={cluster.cluster_lead && cluster.cluster_lead.id !== user?.id}
                                  title={cluster.cluster_lead && cluster.cluster_lead.id !== user?.id ? "Role is currently filled" : ""}
                                />
                                <label className="form-check-label small" htmlFor={`cluster-lead-${cluster.id}`}>
                                  Cluster Lead
                                  {cluster.cluster_lead && !isClusterLead && (
                                    <span className="text-muted ms-1">
                                      ({cluster.cluster_lead.preferred_name || cluster.cluster_lead.name})
                                    </span>
                                  )}
                                </label>
                              </div>
                            )}
                            {cluster.enable_backup_cluster_lead && (
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`backup-cluster-lead-${cluster.id}`}
                                  checked={isBackupClusterLead}
                                  onChange={() => handleToggleBackupClusterLead(cluster, isBackupClusterLead)}
                                  disabled={cluster.backup_cluster_lead && cluster.backup_cluster_lead.id !== user?.id}
                                  title={cluster.backup_cluster_lead && cluster.backup_cluster_lead.id !== user?.id ? "Role is currently filled" : ""}
                                />
                                <label className="form-check-label small" htmlFor={`backup-cluster-lead-${cluster.id}`}>
                                  Backup Cluster Lead
                                  {cluster.backup_cluster_lead && !isBackupClusterLead && (
                                    <span className="text-muted ms-1">
                                      ({cluster.backup_cluster_lead.preferred_name || cluster.backup_cluster_lead.name})
                                    </span>
                                  )}
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Teams */}
                    {cluster.teams && cluster.teams.length > 0 && (
                      <div className="card-body">
                        <h6 className="text-muted small mb-3">Teams:</h6>
                        {cluster.teams.map((team) => {
                          const isTeamLead = team.team_lead?.id === user?.id;
                          const isBackupTeamLead = team.backup_team_lead?.id === user?.id;
                          const isTeamMember = team.members?.some(m => m.user.id === user?.id);
                          const isAnyLead = isTeamLead || isBackupTeamLead;

                          return (
                            <div key={team.id} className="border rounded p-3 mb-2 bg-white">
                              <div className="d-flex align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">
                                    <i className="bi bi-people me-2"></i>
                                    {team.name}
                                    <span className="badge bg-success ms-2">
                                      {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                                    </span>
                                  </h6>
                                  {team.description && (
                                    <p className="text-muted small mb-2">{team.description}</p>
                                  )}

                                  {/* Team Self-Assignment Checkboxes */}
                                  <div className="d-flex flex-wrap gap-3 mt-2">
                                    {team.enable_team_lead && (
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`team-lead-${team.id}`}
                                          checked={isTeamLead}
                                          onChange={() => handleToggleTeamLead(team, isTeamLead)}
                                          disabled={team.team_lead && team.team_lead.id !== user?.id}
                                          title={team.team_lead && team.team_lead.id !== user?.id ? "Role is currently filled" : ""}
                                        />
                                        <label className="form-check-label small" htmlFor={`team-lead-${team.id}`}>
                                          Team Lead
                                          {team.team_lead && !isTeamLead && (
                                            <span className="text-muted ms-1">
                                              ({team.team_lead.preferred_name || team.team_lead.name})
                                            </span>
                                          )}
                                        </label>
                                      </div>
                                    )}
                                    {team.enable_backup_team_lead && (
                                      <div className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`backup-team-lead-${team.id}`}
                                          checked={isBackupTeamLead}
                                          onChange={() => handleToggleBackupTeamLead(team, isBackupTeamLead)}
                                          disabled={team.backup_team_lead && team.backup_team_lead.id !== user?.id}
                                          title={team.backup_team_lead && team.backup_team_lead.id !== user?.id ? "Role is currently filled" : ""}
                                        />
                                        <label className="form-check-label small" htmlFor={`backup-team-lead-${team.id}`}>
                                          Backup Team Lead
                                          {team.backup_team_lead && !isBackupTeamLead && (
                                            <span className="text-muted ms-1">
                                              ({team.backup_team_lead.preferred_name || team.backup_team_lead.name})
                                            </span>
                                          )}
                                        </label>
                                      </div>
                                    )}
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`team-member-${team.id}`}
                                        checked={isTeamMember || isAnyLead}
                                        onChange={() => handleToggleTeamMember(team, isTeamMember)}
                                        disabled={isAnyLead}
                                        title={isAnyLead ? "Leadership roles include team membership" : ""}
                                      />
                                      <label className="form-check-label small" htmlFor={`team-member-${team.id}`}>
                                        Team Member
                                        {isAnyLead && (
                                          <span className="text-muted ms-1">(included with leadership role)</span>
                                        )}
                                      </label>
                                    </div>
                                  </div>

                                  {/* Leadership Info */}
                                  {(team.team_lead || team.backup_team_lead) && (
                                    <div className="mt-2 pt-2 border-top">
                                      <small className="text-muted d-block mb-1">
                                        {team.team_lead && (
                                          <div>
                                            <i className="bi bi-person-badge me-1"></i>
                                            <strong>Team Lead:</strong>{' '}
                                            {team.team_lead.preferred_name || team.team_lead.name}
                                          </div>
                                        )}
                                        {team.backup_team_lead && (
                                          <div>
                                            <i className="bi bi-person-badge me-1"></i>
                                            <strong>Backup Lead:</strong>{' '}
                                            {team.backup_team_lead.preferred_name || team.backup_team_lead.name}
                                          </div>
                                        )}
                                      </small>
                                    </div>
                                  )}

                                  {/* Team Members List */}
                                  {team.members && team.members.length > 0 && (
                                    <div className="mt-2">
                                      <small className="text-muted d-block">
                                        <i className="bi bi-people me-1"></i>
                                        <strong>Team Members ({team.members.length}):</strong>
                                      </small>
                                      <small className="d-block mt-1">
                                        {team.members.map((member, idx) => (
                                          <span key={member.id}>
                                            {member.user.preferred_name || member.user.name}
                                            {member.user.id === team.team_lead?.id && (
                                              <span className="badge bg-warning text-dark ms-1" style={{ fontSize: '0.65rem' }}>Lead</span>
                                            )}
                                            {member.user.id === team.backup_team_lead?.id && (
                                              <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem' }}>Backup</span>
                                            )}
                                            {idx < team.members.length - 1 ? ', ' : ''}
                                          </span>
                                        ))}
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Shared Inventory - Collapsible */}
      {camp.shared_inventory && camp.shared_inventory.length > 0 && (
        <div className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleSection('inventory')}
          >
            <h5 className="mb-0">
              <i className="bi bi-box me-2"></i>Shared Inventory
              <span className="badge bg-secondary ms-2">{camp.shared_inventory.length}</span>
            </h5>
            <i className={`bi bi-chevron-${collapsedSections.inventory ? 'down' : 'up'}`}></i>
          </div>
          <div className={`collapse ${!collapsedSections.inventory ? 'show' : ''}`}>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Total Quantity</th>
                      <th>Owners</th>
                    </tr>
                  </thead>
                  <tbody>
                    {camp.shared_inventory.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.description && (
                            <div className="small text-muted">{item.description}</div>
                          )}
                        </td>
                        <td>{item.total_quantity}</td>
                        <td><small className="text-muted">{item.owners}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Management - Only for managers, Collapsible */}
      {canManage && camp.members && camp.members.pending && camp.members.pending.length > 0 && (
        <div className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleSection('memberManagement')}
          >
            <h5 className="mb-0">
              <i className="bi bi-person-check me-2"></i>Pending Member Requests
              <span className="badge bg-warning text-dark ms-2">{camp.members.pending.length}</span>
            </h5>
            <i className={`bi bi-chevron-${collapsedSections.memberManagement ? 'down' : 'up'}`}></i>
          </div>
          <div className={`collapse ${!collapsedSections.memberManagement ? 'show' : ''}`}>
            <div className="card-body">
              <div className="list-group">
                {camp.members.pending.map((member) => (
                  <div key={member.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{member.user.name}</strong>
                        <br />
                        <small className="text-muted">{member.user.email}</small>
                      </div>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApproveMember(member.user.id, member.user.name)}
                          disabled={approveMemberMutation.isPending}
                        >
                          <i className="bi bi-check-circle me-1"></i>Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRejectMember(member.user.id, member.user.name)}
                          disabled={rejectMemberMutation.isPending}
                        >
                          <i className="bi bi-x-circle me-1"></i>Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member Role Management - Only for managers with existing members */}
      {canManage && camp.members && (camp.members.managers?.length > 0 || camp.members.regular_members?.length > 0) && (
        <div className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleSection('memberManagement')}
          >
            <h5 className="mb-0">
              <i className="bi bi-gear me-2"></i>Manage Member Roles
            </h5>
            <i className={`bi bi-chevron-${collapsedSections.memberManagement ? 'down' : 'up'}`}></i>
          </div>
          <div className={`collapse ${!collapsedSections.memberManagement ? 'show' : ''}`}>
            <div className="card-body">
              {/* Managers */}
              {camp.members.managers && camp.members.managers.length > 0 && (
                <>
                  <h6 className="text-primary">Managers</h6>
                  <div className="list-group mb-3">
                    {camp.members.managers.map((member) => (
                      <div key={member.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{member.user.name}</strong>
                            <br />
                            <small className="text-muted">{member.user.email}</small>
                          </div>
                          {member.user.id !== user?.id && (
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleDemote(member.user.id, member.user.name)}
                              disabled={demoteMutation.isPending}
                            >
                              <i className="bi bi-arrow-down-circle me-1"></i>Demote
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Regular Members */}
              {camp.members.regular_members && camp.members.regular_members.length > 0 && (
                <>
                  <h6 className="text-success">Members</h6>
                  <div className="list-group">
                    {camp.members.regular_members.map((member) => (
                      <div key={member.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{member.user.name}</strong>
                            <br />
                            <small className="text-muted">{member.user.email}</small>
                          </div>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handlePromote(member.user.id, member.user.name)}
                            disabled={promoteMutation.isPending}
                          >
                            <i className="bi bi-arrow-up-circle me-1"></i>Promote
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Associations - For managers, Collapsible */}
      {canManage && camp.event_associations && (
        <div className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleSection('events')}
          >
            <h5 className="mb-0"><i className="bi bi-calendar-event me-2"></i>Event Associations</h5>
            <i className={`bi bi-chevron-${collapsedSections.events ? 'down' : 'up'}`}></i>
          </div>
          <div className={`collapse ${!collapsedSections.events ? 'show' : ''}`}>
            <div className="card-body">
              {/* Request Event Form */}
              {camp.available_events && camp.available_events.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Request to Join Event</label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                    >
                      <option value="">Select an event...</option>
                      {camp.available_events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {formatDate(event.start_date)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={handleRequestEvent}
                      disabled={!selectedEvent || requestEventMutation.isPending}
                    >
                      Request
                    </button>
                  </div>
                </div>
              )}

              {/* Approved Events */}
              {camp.event_associations.approved && camp.event_associations.approved.length > 0 && (
                <>
                  <h6 className="text-success">Approved Events</h6>
                  <div className="list-group mb-3">
                    {camp.event_associations.approved.map((assoc) => (
                      <div key={assoc.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{assoc.event.title}</strong>
                            <br />
                            <small className="text-muted">
                              {formatDate(assoc.event.start_date)} - {formatDate(assoc.event.end_date)}
                            </small>
                            {assoc.location && (
                              <p className="mb-0 mt-1">
                                <i className="bi bi-geo-alt me-1"></i>
                                <small>Location: {assoc.location}</small>
                              </p>
                            )}
                          </div>
                          <span className="badge bg-success">Approved</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pending Events */}
              {camp.event_associations.pending && camp.event_associations.pending.length > 0 && (
                <>
                  <h6 className="text-warning">Pending Requests</h6>
                  <div className="list-group mb-3">
                    {camp.event_associations.pending.map((assoc) => (
                      <div key={assoc.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{assoc.event.title}</strong>
                            <br />
                            <small className="text-muted">
                              {formatDate(assoc.event.start_date)} - {formatDate(assoc.event.end_date)}
                            </small>
                          </div>
                          <span className="badge bg-warning text-dark">Pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {camp.event_associations.approved?.length === 0 &&
               camp.event_associations.pending?.length === 0 &&
               camp.event_associations.rejected?.length === 0 && (
                <p className="text-muted mb-0">No event associations yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public Event List - For approved events, non-managers, Collapsible */}
      {!canManage && camp.event_associations?.approved && camp.event_associations.approved.length > 0 && (
        <div className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleSection('events')}
          >
            <h5 className="mb-0"><i className="bi bi-calendar-event me-2"></i>Participating in Events</h5>
            <i className={`bi bi-chevron-${collapsedSections.events ? 'down' : 'up'}`}></i>
          </div>
          <div className={`collapse ${!collapsedSections.events ? 'show' : ''}`}>
            <div className="card-body">
              <div className="list-group">
                {camp.event_associations.approved.map((assoc) => (
                  <div key={assoc.id} className="list-group-item">
                    <strong>{assoc.event.title}</strong>
                    <br />
                    <small className="text-muted">
                      {formatDate(assoc.event.start_date)} - {formatDate(assoc.event.end_date)}
                    </small>
                    {assoc.location && (
                      <p className="mb-0 mt-1">
                        <i className="bi bi-geo-alt me-1"></i>
                        <small>Location: {assoc.location}</small>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampDetail;
