/**
 * Team Members Modal Component.
 *
 * Modal for managing team members (add/remove).
 */

import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTeam } from '../../hooks/useTeams';
import { useAddTeamMember, useRemoveTeamMember } from '../../hooks/useTeams';
import { formatMemberNameWithPronouns } from '../../utils/nameFormatter';

function TeamMembersModal({ show, onHide, team, campId, campMembers }) {
  const [selectedUserId, setSelectedUserId] = useState('');

  const { data: teamData, isLoading: teamLoading } = useTeam(team?.id);
  const addMemberMutation = useAddTeamMember();
  const removeMemberMutation = useRemoveTeamMember();

  const currentMembers = teamData?.members || [];

  // Filter out users who are already team members
  const availableMembers = campMembers.filter(
    (member) => !currentMembers.some((tm) => tm.user.id === (member.user?.id || member.id))
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      await addMemberMutation.mutateAsync({
        teamId: team.id,
        userId: parseInt(selectedUserId),
        campId
      });

      setSelectedUserId('');
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the team?')) return;

    try {
      await removeMemberMutation.mutateAsync({
        teamId: team.id,
        userId,
        campId
      });
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Manage Team Members - {team?.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {teamLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Current Members */}
            <div className="mb-4">
              <h6 className="mb-3">Current Members ({currentMembers.length})</h6>

              {currentMembers.length > 0 ? (
                <div className="list-group">
                  {currentMembers.map((member) => (
                    <div key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-person-circle me-2"></i>
                        <strong>{formatMemberNameWithPronouns(member)}</strong>
                        <br />
                        <small className="text-muted">{member.user.email}</small>
                        {member.user.id === team?.team_lead?.id && (
                          <span className="badge bg-warning text-dark ms-2">Team Lead</span>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveMember(member.user.id)}
                        disabled={removeMemberMutation.isLoading}
                      >
                        <i className="bi bi-x-circle"></i> Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No members in this team yet.</p>
              )}
            </div>

            {/* Add Member */}
            <div>
              <h6 className="mb-3">Add Member</h6>

              {availableMembers.length > 0 ? (
                <div className="input-group">
                  <select
                    className="form-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">-- Select a camp member --</option>
                    {availableMembers.map((member) => {
                      const userId = member.user?.id || member.id;
                      const userName = member.user?.preferred_name || member.user?.name || member.preferred_name || member.name;
                      const userEmail = member.user?.email || member.email;
                      const user = member.user || member;
                      const pronouns = user.show_pronouns && user.pronouns ? ` (${user.pronouns})` : '';

                      return (
                        <option key={userId} value={userId}>
                          {userName}{pronouns} ({userEmail})
                        </option>
                      );
                    })}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddMember}
                    disabled={!selectedUserId || addMemberMutation.isLoading}
                  >
                    {addMemberMutation.isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add Member
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-muted">All camp members are already in this team.</p>
              )}
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default TeamMembersModal;
