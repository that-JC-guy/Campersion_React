/**
 * Cluster Card Component.
 *
 * Displays a cluster with team count, cluster lead, and management actions.
 * Expandable to show teams list.
 */

import { useState } from 'react';
import TeamCard from './TeamCard';

function ClusterCard({
  cluster,
  teams = [],
  onEdit,
  onDelete,
  onAddTeam,
  onEditTeam,
  onDeleteTeam,
  onManageTeamMembers,
  onMoveTeam,
  availableClusters = [],
  canManage = false
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div className="flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <h5 className="mb-0">
            <i className={`bi bi-chevron-${expanded ? 'down' : 'right'} me-2`}></i>
            {cluster.name}
            <span className="badge bg-secondary ms-2">{cluster.team_count} teams</span>
          </h5>
          {cluster.description && (
            <small className="text-muted">{cluster.description}</small>
          )}
        </div>

        {canManage && (
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(cluster);
              }}
              title="Edit cluster"
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete cluster "${cluster.name}"? This will also delete all teams and team members.`)) {
                  onDelete(cluster.id);
                }
              }}
              title="Delete cluster"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        )}
      </div>

      {(cluster.cluster_lead || cluster.backup_cluster_lead) && (
        <div className="card-body py-2 bg-light">
          <small>
            {cluster.cluster_lead && (
              <>
                <i className="bi bi-person-badge me-1"></i>
                <strong>Cluster Lead:</strong>{' '}
                {cluster.cluster_lead.preferred_name || cluster.cluster_lead.name}
              </>
            )}
            {cluster.backup_cluster_lead && (
              <>
                {cluster.cluster_lead && <span className="mx-2">|</span>}
                <i className="bi bi-person-badge me-1"></i>
                <strong>Backup:</strong>{' '}
                {cluster.backup_cluster_lead.preferred_name || cluster.backup_cluster_lead.name}
              </>
            )}
          </small>
        </div>
      )}

      {expanded && (
        <div className="card-body">
          {canManage && (
            <div className="mb-3">
              <button
                className="btn btn-sm btn-success"
                onClick={() => onAddTeam(cluster.id)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Team
              </button>
            </div>
          )}

          {teams && teams.length > 0 ? (
            <div>
              <h6 className="mb-3">Teams in this Cluster:</h6>
              {teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onEdit={onEditTeam}
                  onDelete={onDeleteTeam}
                  onManageMembers={onManageTeamMembers}
                  onMoveTeam={onMoveTeam}
                  availableClusters={availableClusters}
                  canManage={canManage}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted mb-0">No teams in this cluster yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ClusterCard;
