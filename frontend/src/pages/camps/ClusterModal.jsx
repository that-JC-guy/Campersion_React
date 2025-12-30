/**
 * Cluster Modal Component.
 *
 * Modal for creating and editing clusters.
 */

import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useCreateCluster, useUpdateCluster } from '../../hooks/useClusters';
import LeadershipAssignment from '../../components/camps/LeadershipAssignment';

function ClusterModal({ show, onHide, cluster, campId, campMembers }) {
  const isEditMode = !!cluster?.id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enable_cluster_lead: false,
    enable_backup_cluster_lead: false,
    cluster_lead_id: null,
    backup_cluster_lead_id: null
  });

  const createClusterMutation = useCreateCluster();
  const updateClusterMutation = useUpdateCluster();

  useEffect(() => {
    if (cluster) {
      setFormData({
        name: cluster.name || '',
        description: cluster.description || '',
        enable_cluster_lead: cluster.enable_cluster_lead || false,
        enable_backup_cluster_lead: cluster.enable_backup_cluster_lead || false,
        cluster_lead_id: cluster.cluster_lead?.id || null,
        backup_cluster_lead_id: cluster.backup_cluster_lead?.id || null
      });
    } else {
      setFormData({
        name: '',
        description: '',
        enable_cluster_lead: false,
        enable_backup_cluster_lead: false,
        cluster_lead_id: null,
        backup_cluster_lead_id: null
      });
    }
  }, [cluster, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      enable_cluster_lead: formData.enable_cluster_lead,
      enable_backup_cluster_lead: formData.enable_backup_cluster_lead,
      cluster_lead_id: formData.cluster_lead_id,
      backup_cluster_lead_id: formData.backup_cluster_lead_id
    };

    try {
      if (isEditMode) {
        await updateClusterMutation.mutateAsync({
          clusterId: cluster.id,
          campId,
          data
        });
      } else {
        await createClusterMutation.mutateAsync({
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
        <Modal.Title>{isEditMode ? 'Edit Cluster' : 'Create Cluster'}</Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Cluster Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter cluster name"
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
              placeholder="Enter cluster description (optional)"
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
                    id="enableClusterLead"
                    checked={formData.enable_cluster_lead}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enable_cluster_lead: e.target.checked,
                      cluster_lead_id: e.target.checked ? prev.cluster_lead_id : null
                    }))}
                  />
                  <label className="form-check-label" htmlFor="enableClusterLead">
                    Enable Cluster Lead Role
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="enableBackupClusterLead"
                    checked={formData.enable_backup_cluster_lead}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enable_backup_cluster_lead: e.target.checked,
                      backup_cluster_lead_id: e.target.checked ? prev.backup_cluster_lead_id : null
                    }))}
                  />
                  <label className="form-check-label" htmlFor="enableBackupClusterLead">
                    Enable Backup Cluster Lead Role
                  </label>
                </div>
              </div>
            </div>

            {formData.enable_cluster_lead && (
              <LeadershipAssignment
                role="cluster_lead"
                currentLeadId={formData.cluster_lead_id}
                availableMembers={campMembers}
                onAssign={(userId) => setFormData(prev => ({ ...prev, cluster_lead_id: userId }))}
                onClear={() => setFormData(prev => ({ ...prev, cluster_lead_id: null }))}
              />
            )}

            {formData.enable_backup_cluster_lead && (
              <LeadershipAssignment
                role="backup_cluster_lead"
                currentLeadId={formData.backup_cluster_lead_id}
                availableMembers={campMembers}
                onAssign={(userId) => setFormData(prev => ({ ...prev, backup_cluster_lead_id: userId }))}
                onClear={() => setFormData(prev => ({ ...prev, backup_cluster_lead_id: null }))}
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
            disabled={createClusterMutation.isLoading || updateClusterMutation.isLoading || !formData.name.trim()}
          >
            {createClusterMutation.isLoading || updateClusterMutation.isLoading
              ? 'Saving...'
              : isEditMode
              ? 'Save Changes'
              : 'Create Cluster'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default ClusterModal;
