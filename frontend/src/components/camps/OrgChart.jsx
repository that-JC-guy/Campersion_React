/**
 * Organizational Chart Component.
 *
 * Displays a visual hierarchy of Camp → Clusters → Teams
 * with leadership roles.
 */

import './OrgChart.css';

function OrgChart({ camp, clusters = [] }) {
  // Helper function to get display name
  const getDisplayName = (user) => {
    return user?.preferred_name || user?.name || 'Unassigned';
  };

  return (
    <div className="org-chart">
      {/* Camp Level */}
      <div className="org-level camp-level">
        <div className="org-node camp-node">
          <div className="org-node-header">
            <i className="bi bi-building me-2"></i>
            {camp.name}
          </div>
          <div className="org-node-body">
            {camp.enable_camp_lead && (
              <div className="org-leader">
                <i className="bi bi-person-badge me-1"></i>
                <strong>Lead:</strong> {getDisplayName(camp.camp_lead)}
              </div>
            )}
            {camp.enable_backup_camp_lead && (
              <div className="org-leader backup">
                <i className="bi bi-person-badge me-1"></i>
                <strong>Backup:</strong> {getDisplayName(camp.backup_camp_lead)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connecting Line */}
      {clusters.length > 0 && <div className="org-connector-vertical"></div>}

      {/* Clusters Level */}
      {clusters.length > 0 && (
        <div className="org-level cluster-level">
          <div className="org-connector-horizontal"></div>
          {clusters.map((cluster) => (
            <div key={cluster.id} className="org-branch">
              <div className="org-connector-to-node"></div>
              <div className="org-node cluster-node">
                <div className="org-node-header">
                  <i className="bi bi-diagram-2 me-2"></i>
                  {cluster.name}
                  <span className="badge bg-light text-dark ms-2">
                    {cluster.team_count} {cluster.team_count === 1 ? 'team' : 'teams'}
                  </span>
                </div>
                <div className="org-node-body">
                  {cluster.enable_cluster_lead && (
                    <div className="org-leader">
                      <i className="bi bi-person-badge me-1"></i>
                      <strong>Lead:</strong> {getDisplayName(cluster.cluster_lead)}
                    </div>
                  )}
                  {cluster.enable_backup_cluster_lead && (
                    <div className="org-leader backup">
                      <i className="bi bi-person-badge me-1"></i>
                      <strong>Backup:</strong> {getDisplayName(cluster.backup_cluster_lead)}
                    </div>
                  )}
                </div>

                {/* Teams for this Cluster */}
                {cluster.teams && cluster.teams.length > 0 && (
                  <>
                    <div className="org-connector-vertical-small"></div>
                    <div className="org-teams">
                      <div className="org-connector-horizontal-small"></div>
                      {cluster.teams.map((team) => (
                        <div key={team.id} className="org-team-branch">
                          <div className="org-connector-to-team"></div>
                          <div className="org-node team-node">
                            <div className="org-node-header">
                              <i className="bi bi-people me-2"></i>
                              {team.name}
                              <span className="badge bg-light text-dark ms-2">
                                {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                              </span>
                            </div>
                            <div className="org-node-body">
                              {team.enable_team_lead && (
                                <div className="org-leader">
                                  <i className="bi bi-person-badge me-1"></i>
                                  <strong>Lead:</strong> {getDisplayName(team.team_lead)}
                                </div>
                              )}
                              {team.enable_backup_team_lead && (
                                <div className="org-leader backup">
                                  <i className="bi bi-person-badge me-1"></i>
                                  <strong>Backup:</strong> {getDisplayName(team.backup_team_lead)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {clusters.length === 0 && (
        <div className="org-empty-state">
          <p className="text-muted">
            <i className="bi bi-info-circle me-2"></i>
            No clusters or teams to display in the organizational chart.
          </p>
        </div>
      )}
    </div>
  );
}

export default OrgChart;
