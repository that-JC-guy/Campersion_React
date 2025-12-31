/**
 * Team Card Component.
 *
 * Displays a team with member count, team lead, and management actions.
 * Can be expanded to show team members.
 */

import { useState } from 'react';
import { formatMemberNameWithPronouns, formatNameWithPronouns } from '../../utils/nameFormatter';

function TeamCard({
  team,
  members = [],
  onEdit,
  onDelete,
  onManageMembers,
  onMoveTeam,
  availableClusters = [],
  canManage = false,
  showMembers = false
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card mb-2">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div
            className="flex-grow-1"
            style={{ cursor: showMembers ? 'pointer' : 'default' }}
            onClick={() => showMembers && setExpanded(!expanded)}
          >
            <h6 className="mb-1">
              {showMembers && (
                <i className={`bi bi-chevron-${expanded ? 'down' : 'right'} me-2`}></i>
              )}
              {team.name}
              <span className="badge bg-info text-dark ms-2">{team.member_count} members</span>
            </h6>
            {team.description && (
              <p className="text-muted small mb-1">{team.description}</p>
            )}
            {/* Leadership Display */}
            {(team.team_lead || team.backup_team_lead) && (
              <div className="mb-1">
                <small className="text-muted">
                  {team.team_lead && (
                    <>
                      <i className="bi bi-person-badge me-1"></i>
                      <strong>Team Lead:</strong>{' '}
                      {formatNameWithPronouns(team.team_lead)}
                    </>
                  )}
                  {team.backup_team_lead && (
                    <>
                      {team.team_lead && <span className="mx-2">|</span>}
                      <i className="bi bi-person-badge me-1"></i>
                      <strong>Backup:</strong>{' '}
                      {formatNameWithPronouns(team.backup_team_lead)}
                    </>
                  )}
                </small>
              </div>
            )}

            {/* Team Members Display - Always show if available */}
            {team.members && team.members.length > 0 && (
              <div className="mt-1">
                <small className="text-muted">
                  <i className="bi bi-people me-1"></i>
                  <strong>Members ({team.members.length}):</strong>{' '}
                  {team.members.map((member, idx) => (
                    <span key={member.id}>
                      {formatMemberNameWithPronouns(member)}
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

          {canManage && (
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(team);
                }}
                title="Edit team"
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className="btn btn-outline-info"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageMembers(team);
                }}
                title="Manage members"
              >
                <i className="bi bi-people"></i>
              </button>
              {availableClusters.length > 0 && onMoveTeam && (
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    title="Move to another cluster"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="bi bi-arrow-right-square"></i>
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <h6 className="dropdown-header">Move to Cluster:</h6>
                    </li>
                    {availableClusters.map((cluster) => (
                      <li key={cluster.id}>
                        <button
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Move team "${team.name}" to cluster "${cluster.name}"?`)) {
                              onMoveTeam(team.id, cluster.id);
                            }
                          }}
                        >
                          {cluster.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                className="btn btn-outline-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete team "${team.name}"? This will also remove all team members.`)) {
                    onDelete(team.id);
                  }
                }}
                title="Delete team"
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          )}
        </div>

        {expanded && members && members.length > 0 && (
          <div className="mt-3 pt-3 border-top">
            <h6 className="small text-muted mb-2">Team Members:</h6>
            <ul className="list-unstyled mb-0">
              {members.map((member) => (
                <li key={member.id} className="mb-1">
                  <i className="bi bi-person-circle me-2"></i>
                  {formatMemberNameWithPronouns(member)}
                  {member.user.id === team.team_lead?.id && (
                    <span className="badge bg-warning text-dark ms-2">Lead</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamCard;
