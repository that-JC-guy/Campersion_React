/**
 * Event Management Page.
 *
 * Allows admins to view and change event statuses.
 */

import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import StatusBadge from '../../components/admin/StatusBadge';
import ChangeEventStatusModal from './ChangeEventStatusModal';

function EventManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || ''
  });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: eventsData, isLoading, error } = useEvents(filters.status || undefined);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.status) params.set('status', newFilters.status);
    setSearchParams(params);
  };

  const handleChangeStatusClick = (event) => {
    setSelectedEvent(event);
  };

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {error.response?.data?.error || 'Failed to load events. Please try again.'}
        </div>
      </div>
    );
  }

  const events = eventsData?.events || [];

  return (
    <div className="container mt-4">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/admin">Admin</Link>
          </li>
          <li className="breadcrumb-item active">Event Management</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-calendar-event me-2"></i>Event Management
        </h2>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="alert alert-info">
          No events found matching the current filters.
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Creator</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <Link to={`/events/${event.id}`} className="text-decoration-none">
                        {event.title}
                      </Link>
                    </td>
                    <td>{event.location}</td>
                    <td>
                      {event.start_date
                        ? new Date(event.start_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {event.end_date
                        ? new Date(event.end_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <StatusBadge status={event.status} type="event" />
                    </td>
                    <td>
                      {event.creator_name || 'N/A'}
                      {event.creator_show_pronouns && event.creator_pronouns && (
                        <small className="text-muted"> ({event.creator_pronouns})</small>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleChangeStatusClick(event)}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change Event Status Modal */}
      {selectedEvent && (
        <ChangeEventStatusModal
          show={true}
          onHide={() => setSelectedEvent(null)}
          event={selectedEvent}
        />
      )}
    </div>
  );
}

export default EventManagement;
