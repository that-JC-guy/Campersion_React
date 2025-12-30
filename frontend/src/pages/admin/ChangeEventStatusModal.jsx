/**
 * Change Event Status Modal Component.
 *
 * Modal for changing event status with optional reason.
 */

import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useChangeEventStatus } from '../../hooks/useAdmin';
import StatusBadge from '../../components/admin/StatusBadge';

function ChangeEventStatusModal({ show, onHide, event }) {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  const changeStatusMutation = useChangeEventStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newStatus || newStatus === event.status) {
      return;
    }

    try {
      await changeStatusMutation.mutateAsync({
        eventId: event.id,
        data: { status: newStatus, reason: reason.trim() }
      });

      setNewStatus('');
      setReason('');
      onHide();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    if (!changeStatusMutation.isPending) {
      setNewStatus('');
      setReason('');
      onHide();
    }
  };

  if (!event) return null;

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Change Event Status</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-3">
            <strong>Event:</strong> {event.title}
          </div>

          <div className="mb-3">
            <strong>Current Status:</strong>{' '}
            <StatusBadge status={event.status} type="event" />
          </div>

          <Form.Group className="mb-3">
            <Form.Label>New Status *</Form.Label>
            <Form.Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={changeStatusMutation.isPending}
              required
            >
              <option value="">Select new status...</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Reason (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              disabled={changeStatusMutation.isPending}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={changeStatusMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={changeStatusMutation.isPending || !newStatus || newStatus === event.status}
          >
            {changeStatusMutation.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Changing...
              </>
            ) : (
              'Change Status'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ChangeEventStatusModal;
