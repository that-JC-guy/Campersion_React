/**
 * Leadership Assignment Component.
 *
 * Reusable component for assigning leaders to camps, clusters, or teams.
 */

import { useState, useEffect } from 'react';
import { formatNameWithPronouns } from '../../utils/nameFormatter';

function LeadershipAssignment({
  role,
  currentLeadId,
  availableMembers,
  onAssign,
  onClear,
  disabled = false,
  excludedUserId = null
}) {
  const [selectedUserId, setSelectedUserId] = useState(currentLeadId || '');

  // Sync internal state when currentLeadId prop changes
  useEffect(() => {
    setSelectedUserId(currentLeadId || '');
  }, [currentLeadId]);

  const getRoleLabel = () => {
    switch (role) {
      case 'camp_lead':
        return 'Camp Lead';
      case 'backup_camp_lead':
        return 'Backup Camp Lead';
      case 'cluster_lead':
        return 'Cluster Lead';
      case 'backup_cluster_lead':
        return 'Backup Cluster Lead';
      case 'team_lead':
        return 'Team Lead';
      case 'backup_team_lead':
        return 'Backup Team Lead';
      default:
        return 'Leader';
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSelectedUserId(value);

    if (value === '') {
      onClear();
    } else {
      onAssign(parseInt(value));
    }
  };

  const currentLead = availableMembers.find(m => m.user?.id === currentLeadId || m.id === currentLeadId);

  return (
    <div className="mb-3">
      <label className="form-label fw-bold">{getRoleLabel()}</label>

      {currentLead && (
        <div className="alert alert-info py-2 px-3 mb-2">
          <i className="bi bi-person-badge me-2"></i>
          <strong>Current {getRoleLabel()}:</strong>{' '}
          {formatNameWithPronouns(currentLead.user || currentLead)}
          {' '}
          <span className="badge bg-primary">Leader</span>
        </div>
      )}

      <select
        className="form-select"
        value={selectedUserId}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="">-- No {getRoleLabel()} Assigned --</option>
        {availableMembers.map((member) => {
          const userId = member.user?.id || member.id;
          const userName = member.user?.preferred_name || member.user?.name || member.preferred_name || member.name;
          const user = member.user || member;
          const pronouns = user.show_pronouns && user.pronouns ? ` (${user.pronouns})` : '';
          const isExcluded = excludedUserId && Number(userId) === Number(excludedUserId);

          return (
            <option key={userId} value={userId} disabled={isExcluded}>
              {userName}{pronouns}{isExcluded ? ' - Already assigned to other role' : ''}
            </option>
          );
        })}
      </select>

      {selectedUserId && !disabled && (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mt-2"
          onClick={() => {
            setSelectedUserId('');
            onClear();
          }}
        >
          <i className="bi bi-x-circle me-1"></i>
          Clear Assignment
        </button>
      )}
    </div>
  );
}

export default LeadershipAssignment;
