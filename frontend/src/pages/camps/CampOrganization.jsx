/**
 * Camp Organization Page.
 *
 * Main page for managing camp organizational structure including
 * camp leadership, clusters, and teams.
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCamp, useUpdateCamp } from '../../hooks/useCamps';
import { useClusters, useDeleteCluster } from '../../hooks/useClusters';
import { useTeams, useDeleteTeam, useMoveTeam } from '../../hooks/useTeams';
import ClusterCard from '../../components/camps/ClusterCard';
import OrgChart from '../../components/camps/OrgChart';
import ClusterModal from './ClusterModal';
import TeamModal from './TeamModal';
import TeamMembersModal from './TeamMembersModal';
import { useAuth } from '../../contexts/AuthContext';

function CampOrganization() {
  const { campId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: camp, isLoading: campLoading } = useCamp(campId);
  const { data: clustersData, isLoading: clustersLoading } = useClusters(campId, true);
  const updateCampMutation = useUpdateCamp();
  const deleteClusterMutation = useDeleteCluster();
  const deleteTeamMutation = useDeleteTeam();
  const moveTeamMutation = useMoveTeam();

  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Check if user is a camp manager
  const isCampManager = camp?.members?.managers?.some(
    (m) => m.user.id === user?.id
  );

  const canManage = isCampManager || user?.role === 'site admin' || user?.role === 'global admin';

  if (campLoading || clustersLoading) {
    return (
      <div className="container mt-4">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Camp not found</div>
      </div>
    );
  }

  const clusters = clustersData?.clusters || [];
  const campMembers = [
    ...(camp.members?.managers || []),
    ...(camp.members?.regular_members || [])
  ];

  const handleEnableCampLead = async (enabled) => {
    await updateCampMutation.mutateAsync({
      campId: camp.id,
      data: { enable_camp_lead: enabled }
    });
  };

  const handleEnableBackupCampLead = async (enabled) => {
    await updateCampMutation.mutateAsync({
      campId: camp.id,
      data: { enable_backup_camp_lead: enabled }
    });
  };

  const handleAssignCampLead = async (userId) => {
    await updateCampMutation.mutateAsync({
      campId: camp.id,
      data: { camp_lead_id: userId }
    });
  };

  const handleAssignBackupCampLead = async (userId) => {
    await updateCampMutation.mutateAsync({
      campId: camp.id,
      data: { backup_camp_lead_id: userId }
    });
  };

  const handleEditCluster = (cluster) => {
    setSelectedCluster(cluster);
    setShowClusterModal(true);
  };

  const handleDeleteCluster = async (clusterId) => {
    await deleteClusterMutation.mutateAsync({ clusterId, campId });
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowTeamModal(true);
  };

  const handleDeleteTeam = async (teamId, clusterId) => {
    await deleteTeamMutation.mutateAsync({ teamId, clusterId, campId });
  };

  const handleManageTeamMembers = (team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
  };

  const handleAddCluster = () => {
    setSelectedCluster(null);
    setShowClusterModal(true);
  };

  const handleAddTeam = (clusterId) => {
    setSelectedTeam({ cluster_id: clusterId });
    setShowTeamModal(true);
  };

  const handleMoveTeam = async (teamId, newClusterId) => {
    await moveTeamMutation.mutateAsync({ teamId, newClusterId, campId });
  };

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/camps">Camps</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/camps/${camp.id}`}>{camp.name}</Link>
              </li>
              <li className="breadcrumb-item active">Organization</li>
            </ol>
          </nav>
          <h2>
            <i className="bi bi-diagram-3 me-2"></i>
            Organization Structure
          </h2>
        </div>
      </div>

      {/* Camp Leadership Section */}
      {(camp.enable_camp_lead || camp.enable_backup_camp_lead || canManage) && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Camp Leadership</h5>
          </div>
          <div className="card-body">
            {canManage && (
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="enableCampLead"
                      checked={camp.enable_camp_lead}
                      onChange={(e) => handleEnableCampLead(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="enableCampLead">
                      Enable Camp Lead Role
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="enableBackupCampLead"
                      checked={camp.enable_backup_camp_lead}
                      onChange={(e) => handleEnableBackupCampLead(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="enableBackupCampLead">
                      Enable Backup Camp Lead Role
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              {camp.enable_camp_lead && (
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Camp Lead</label>
                    {camp.camp_lead ? (
                      <div className="alert alert-info py-2 px-3">
                        <i className="bi bi-person-badge me-2"></i>
                        <strong>{camp.camp_lead.preferred_name || camp.camp_lead.name}</strong>
                        <span className="badge bg-primary ms-2">Camp Lead</span>
                      </div>
                    ) : (
                      <p className="text-muted">No camp lead assigned</p>
                    )}
                    {canManage && (
                      <select
                        className="form-select"
                        value={camp.camp_lead?.id || ''}
                        onChange={(e) => handleAssignCampLead(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">-- No Camp Lead --</option>
                        {campMembers.map((member) => (
                          <option key={member.user.id} value={member.user.id}>
                            {member.user.preferred_name || member.user.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {camp.enable_backup_camp_lead && (
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Backup Camp Lead</label>
                    {camp.backup_camp_lead ? (
                      <div className="alert alert-info py-2 px-3">
                        <i className="bi bi-person-badge me-2"></i>
                        <strong>{camp.backup_camp_lead.preferred_name || camp.backup_camp_lead.name}</strong>
                        <span className="badge bg-secondary ms-2">Backup Lead</span>
                      </div>
                    ) : (
                      <p className="text-muted">No backup camp lead assigned</p>
                    )}
                    {canManage && (
                      <select
                        className="form-select"
                        value={camp.backup_camp_lead?.id || ''}
                        onChange={(e) => handleAssignBackupCampLead(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">-- No Backup Camp Lead --</option>
                        {campMembers.map((member) => (
                          <option key={member.user.id} value={member.user.id}>
                            {member.user.preferred_name || member.user.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Organizational Chart */}
      {clusters.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-diagram-3 me-2"></i>
              Organizational Chart
            </h5>
          </div>
          <div className="card-body">
            <OrgChart camp={camp} clusters={clusters} />
          </div>
        </div>
      )}

      {/* Clusters Section */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Clusters &amp; Teams</h5>
          {canManage && (
            <button className="btn btn-primary" onClick={handleAddCluster}>
              <i className="bi bi-plus-circle me-2"></i>
              Add Cluster
            </button>
          )}
        </div>
        <div className="card-body">
          {clusters.length > 0 ? (
            <>
              {clusters.map((cluster) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  teams={cluster.teams || []}
                  onEdit={handleEditCluster}
                  onDelete={handleDeleteCluster}
                  onAddTeam={handleAddTeam}
                  onEditTeam={handleEditTeam}
                  onDeleteTeam={(teamId) => handleDeleteTeam(teamId, cluster.id)}
                  onManageTeamMembers={handleManageTeamMembers}
                  onMoveTeam={handleMoveTeam}
                  availableClusters={clusters.filter((c) => c.id !== cluster.id)}
                  canManage={canManage}
                />
              ))}
            </>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-diagram-3 text-muted" style={{ fontSize: '3rem' }}></i>
              <p className="text-muted mt-3">
                No clusters yet. {canManage && 'Add your first cluster to organize teams.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ClusterModal
        show={showClusterModal}
        onHide={() => {
          setShowClusterModal(false);
          setSelectedCluster(null);
        }}
        cluster={selectedCluster}
        campId={campId}
        campMembers={campMembers}
      />

      <TeamModal
        show={showTeamModal}
        onHide={() => {
          setShowTeamModal(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
        clusterId={selectedTeam?.cluster_id}
        campId={campId}
        campMembers={campMembers}
      />

      <TeamMembersModal
        show={showMembersModal}
        onHide={() => {
          setShowMembersModal(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
        campId={campId}
        campMembers={campMembers}
      />
    </div>
  );
}

export default CampOrganization;
