/**
 * Leadership Assignment Component.
 *
 * Reusable component for assigning leaders to camps, clusters, or teams.
 */

import { useState } from 'react';

function LeadershipAssignment({
  role,
  currentLeadId,
  availableMembers,
  onAssign,
  onClear,
  disabled = false
}) {
  const [selectedUserId, setSelectedUserId] = useState(currentLeadId || '');

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
          {currentLead.user?.preferred_name || currentLead.user?.name || currentLead.preferred_name || currentLead.name}
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

          return (
            <option key={userId} value={userId}>
              {userName}
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
