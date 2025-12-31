/**
 * Team Modal Component.
 *
 * Modal for creating and editing teams.
 */

import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useCreateTeam, useUpdateTeam } from '../../hooks/useTeams';
import LeadershipAssignment from '../../components/camps/LeadershipAssignment';

function TeamModal({ show, onHide, team, clusterId, campId, campMembers }) {
  const isEditMode = !!team?.id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enable_team_lead: false,
    enable_backup_team_lead: false,
    team_lead_id: null,
    backup_team_lead_id: null
  });

  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
        enable_team_lead: team.enable_team_lead || false,
        enable_backup_team_lead: team.enable_backup_team_lead || false,
        team_lead_id: team.team_lead?.id || null,
        backup_team_lead_id: team.backup_team_lead?.id || null
      });
    } else {
      setFormData({
        name: '',
        description: '',
        enable_team_lead: false,
        enable_backup_team_lead: false,
        team_lead_id: null,
        backup_team_lead_id: null
      });
    }
  }, [team, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      enable_team_lead: formData.enable_team_lead,
      enable_backup_team_lead: formData.enable_backup_team_lead,
      team_lead_id: formData.team_lead_id,
      backup_team_lead_id: formData.backup_team_lead_id
    };

    try {
      if (isEditMode) {
        await updateTeamMutation.mutateAsync({
          teamId: team.id,
          clusterId,
          campId,
          data
        });
      } else {
        await createTeamMutation.mutateAsync({
          clusterId,
          campId,
          data
        });
      }

      onHide();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Edit Team' : 'Create Team'}</Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Team Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter team name"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter team description (optional)"
            />
          </div>

          <div className="mb-3 p-3 border rounded">
            <h6 className="mb-3">Leadership Roles</h6>

            <div className="row mb-3">
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableTeamLead"
                    checked={formData.enable_team_lead}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enable_team_lead: e.target.checked,
                      team_lead_id: e.target.checked ? prev.team_lead_id : null
                    }))}
                  />
                  <label className="form-check-label" htmlFor="enableTeamLead">
                    Enable Team Lead Role
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableBackupTeamLead"
                    checked={formData.enable_backup_team_lead}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enable_backup_team_lead: e.target.checked,
                      backup_team_lead_id: e.target.checked ? prev.backup_team_lead_id : null
                    }))}
                  />
                  <label className="form-check-label" htmlFor="enableBackupTeamLead">
                    Enable Backup Team Lead Role
                  </label>
                </div>
              </div>
            </div>

            {formData.enable_team_lead && (
              <LeadershipAssignment
                role="team_lead"
                currentLeadId={formData.team_lead_id}
                availableMembers={campMembers}
                onAssign={(userId) => setFormData(prev => ({ ...prev, team_lead_id: userId }))}
                onClear={() => setFormData(prev => ({ ...prev, team_lead_id: null }))}
                excludedUserId={formData.backup_team_lead_id}
              />
            )}

            {formData.enable_backup_team_lead && (
              <LeadershipAssignment
                role="backup_team_lead"
                currentLeadId={formData.backup_team_lead_id}
                availableMembers={campMembers}
                onAssign={(userId) => setFormData(prev => ({ ...prev, backup_team_lead_id: userId }))}
                onClear={() => setFormData(prev => ({ ...prev, backup_team_lead_id: null }))}
                excludedUserId={formData.team_lead_id}
              />
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={createTeamMutation.isLoading || updateTeamMutation.isLoading || !formData.name.trim()}
          >
            {createTeamMutation.isLoading || updateTeamMutation.isLoading
              ? 'Saving...'
              : isEditMode
              ? 'Save Changes'
              : 'Create Team'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default TeamModal;
