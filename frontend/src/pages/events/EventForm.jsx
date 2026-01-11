/**
 * Event Form Page.
 *
 * Form for creating and editing events.
 * Handles all event fields including dates and contact information.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEvent, useCreateEvent, useUpdateEvent } from '../../hooks/useEvents';

function EventForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!eventId;

  const { data: event, isLoading: loadingEvent } = useEvent(eventId ? parseInt(eventId) : null);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      start_date: '',
      end_date: '',
      event_manager_email: '',
      event_manager_phone: '',
      safety_manager_email: '',
      safety_manager_phone: '',
      business_manager_email: '',
      business_manager_phone: '',
      board_email: '',
      has_early_arrival: false,
      early_arrival_days: '',
      has_late_departure: false,
      late_departure_days: '',
      has_accessibility_assistance: false,
      has_drinking_water: false,
      has_ice_available: false,
      has_vehicle_access: false,
      custom_event_options: ''
    }
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && event) {
      reset({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        start_date: event.start_date ? event.start_date.split('T')[0] : '',
        end_date: event.end_date ? event.end_date.split('T')[0] : '',
        event_manager_email: event.event_manager_email || '',
        event_manager_phone: event.event_manager_phone || '',
        safety_manager_email: event.safety_manager_email || '',
        safety_manager_phone: event.safety_manager_phone || '',
        business_manager_email: event.business_manager_email || '',
        business_manager_phone: event.business_manager_phone || '',
        board_email: event.board_email || '',
        has_early_arrival: event.has_early_arrival || false,
        early_arrival_days: event.early_arrival_days || '',
        has_late_departure: event.has_late_departure || false,
        late_departure_days: event.late_departure_days || '',
        has_accessibility_assistance: event.has_accessibility_assistance || false,
        has_drinking_water: event.has_drinking_water || false,
        has_ice_available: event.has_ice_available || false,
        has_vehicle_access: event.has_vehicle_access || false,
        custom_event_options: event.custom_event_options || ''
      });
    }
  }, [isEditing, event, reset]);

  const onSubmit = async (data) => {
    // Convert dates to ISO format
    const formData = {
      ...data,
      start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
      end_date: data.end_date ? new Date(data.end_date).toISOString() : null
    };

    if (isEditing) {
      updateMutation.mutate(
        { eventId: parseInt(eventId), data: formData },
        {
          onSuccess: () => {
            navigate(`/events/${eventId}`);
          }
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: (response) => {
          navigate(`/events/${response.data.event.id}`);
        }
      });
    }
  };

  const startDate = watch('start_date');
  const hasEarlyArrival = watch('has_early_arrival');
  const hasLateDeparture = watch('has_late_departure');

  if (isEditing && loadingEvent) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/events">Events</Link>
          </li>
          {isEditing && event ? (
            <>
              <li className="breadcrumb-item">
                <Link to={`/events/${eventId}`}>{event.title}</Link>
              </li>
              <li className="breadcrumb-item active">Edit</li>
            </>
          ) : (
            <li className="breadcrumb-item active">Create Event</li>
          )}
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-calendar-event me-2"></i>
          {isEditing ? 'Edit Event' : 'Create Event'}
        </h2>
        <Link to={isEditing ? `/events/${eventId}` : '/events'} className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Form Actions - Top */}
        <div className="d-flex gap-2 mb-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending || updateMutation.isPending || (isEditing && !isDirty)}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save me-2"></i>
                {isEditing ? 'Save Changes' : 'Create Event'}
              </>
            )}
          </button>

          <Link
            to={isEditing ? `/events/${eventId}` : '/events'}
            className="btn btn-outline-secondary"
          >
            Cancel
          </Link>
        </div>

        {/* Basic Information */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-info-circle me-2"></i>Basic Information</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Event Title *</label>
              <input
                type="text"
                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                id="title"
                {...register('title', {
                  required: 'Event title is required',
                  maxLength: { value: 200, message: 'Title must be less than 200 characters' }
                })}
              />
              {errors.title && (
                <div className="invalid-feedback">{errors.title.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                id="description"
                rows="4"
                {...register('description')}
              />
              {errors.description && (
                <div className="invalid-feedback">{errors.description.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="location" className="form-label">Location</label>
              <input
                type="text"
                className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                id="location"
                placeholder="Event venue or city"
                {...register('location', {
                  maxLength: { value: 200, message: 'Location must be less than 200 characters' }
                })}
              />
              {errors.location && (
                <div className="invalid-feedback">{errors.location.message}</div>
              )}
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="start_date" className="form-label">Start Date *</label>
                <input
                  type="date"
                  className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                  id="start_date"
                  {...register('start_date', {
                    required: 'Start date is required'
                  })}
                />
                {errors.start_date && (
                  <div className="invalid-feedback">{errors.start_date.message}</div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="end_date" className="form-label">End Date *</label>
                <input
                  type="date"
                  className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
                  id="end_date"
                  min={startDate}
                  {...register('end_date', {
                    required: 'End date is required',
                    validate: value => {
                      if (startDate && value < startDate) {
                        return 'End date must be after start date';
                      }
                      return true;
                    }
                  })}
                />
                {errors.end_date && (
                  <div className="invalid-feedback">{errors.end_date.message}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-people me-2"></i>Contact Information</h5>
          </div>
          <div className="card-body">
            <h6 className="mb-3">Event Manager</h6>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="event_manager_email" className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.event_manager_email ? 'is-invalid' : ''}`}
                  id="event_manager_email"
                  {...register('event_manager_email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.event_manager_email && (
                  <div className="invalid-feedback">{errors.event_manager_email.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="event_manager_phone" className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  id="event_manager_phone"
                  {...register('event_manager_phone')}
                />
              </div>
            </div>

            <h6 className="mb-3">Safety Manager</h6>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="safety_manager_email" className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.safety_manager_email ? 'is-invalid' : ''}`}
                  id="safety_manager_email"
                  {...register('safety_manager_email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.safety_manager_email && (
                  <div className="invalid-feedback">{errors.safety_manager_email.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="safety_manager_phone" className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  id="safety_manager_phone"
                  {...register('safety_manager_phone')}
                />
              </div>
            </div>

            <h6 className="mb-3">Business Manager</h6>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="business_manager_email" className="form-label">Email</label>
                <input
                  type="email"
                  className={`form-control ${errors.business_manager_email ? 'is-invalid' : ''}`}
                  id="business_manager_email"
                  {...register('business_manager_email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.business_manager_email && (
                  <div className="invalid-feedback">{errors.business_manager_email.message}</div>
                )}
              </div>
              <div className="col-md-6">
                <label htmlFor="business_manager_phone" className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  id="business_manager_phone"
                  {...register('business_manager_phone')}
                />
              </div>
            </div>

            <h6 className="mb-3">Board Contact</h6>
            <div className="mb-0">
              <label htmlFor="board_email" className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${errors.board_email ? 'is-invalid' : ''}`}
                id="board_email"
                {...register('board_email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.board_email && (
                <div className="invalid-feedback">{errors.board_email.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Event Options and Amenities */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-gear me-2"></i>Event Options and Amenities</h5>
          </div>
          <div className="card-body">
            <p className="text-muted small mb-3">
              <i className="bi bi-info-circle me-2"></i>
              Event managers can configure additional event options and amenities for attendees.
            </p>

            <div className="row">
              {/* Early Arrival */}
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_early_arrival"
                    {...register('has_early_arrival')}
                  />
                  <label className="form-check-label" htmlFor="has_early_arrival">
                    <strong>Early Arrival</strong>
                  </label>
                </div>
                {hasEarlyArrival && (
                  <div className="mt-2 ms-4">
                    <label htmlFor="early_arrival_days" className="form-label small">
                      Days before event start
                    </label>
                    <input
                      type="number"
                      className={`form-control form-control-sm ${errors.early_arrival_days ? 'is-invalid' : ''}`}
                      id="early_arrival_days"
                      min="1"
                      {...register('early_arrival_days', {
                        min: { value: 1, message: 'Must be at least 1 day' }
                      })}
                    />
                    {errors.early_arrival_days && (
                      <div className="invalid-feedback">{errors.early_arrival_days.message}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Late Departure */}
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_late_departure"
                    {...register('has_late_departure')}
                  />
                  <label className="form-check-label" htmlFor="has_late_departure">
                    <strong>Late Departure</strong>
                  </label>
                </div>
                {hasLateDeparture && (
                  <div className="mt-2 ms-4">
                    <label htmlFor="late_departure_days" className="form-label small">
                      Days after event end
                    </label>
                    <input
                      type="number"
                      className={`form-control form-control-sm ${errors.late_departure_days ? 'is-invalid' : ''}`}
                      id="late_departure_days"
                      min="1"
                      {...register('late_departure_days', {
                        min: { value: 1, message: 'Must be at least 1 day' }
                      })}
                    />
                    {errors.late_departure_days && (
                      <div className="invalid-feedback">{errors.late_departure_days.message}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Accessibility Assistance */}
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_accessibility_assistance"
                    {...register('has_accessibility_assistance')}
                  />
                  <label className="form-check-label" htmlFor="has_accessibility_assistance">
                    <strong>Accessibility Assistance</strong>
                  </label>
                </div>
              </div>

              {/* Drinking Water Onsite */}
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_drinking_water"
                    {...register('has_drinking_water')}
                  />
                  <label className="form-check-label" htmlFor="has_drinking_water">
                    <strong>Drinking Water Onsite</strong>
                  </label>
                </div>
              </div>

              {/* Ice Available */}
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_ice_available"
                    {...register('has_ice_available')}
                  />
                  <label className="form-check-label" htmlFor="has_ice_available">
                    <strong>Ice Available</strong>
                  </label>
                </div>
              </div>

              {/* Vehicle Access */}
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_vehicle_access"
                    {...register('has_vehicle_access')}
                  />
                  <label className="form-check-label" htmlFor="has_vehicle_access">
                    <strong>Vehicle Access</strong>
                  </label>
                </div>
              </div>
            </div>

            {/* Custom Event Options */}
            <div className="mb-0">
              <label htmlFor="custom_event_options" className="form-label">
                Custom Event Options
              </label>
              <input
                type="text"
                className="form-control"
                id="custom_event_options"
                placeholder="e.g., Shuttle service, Bike parking, RV hookups"
                {...register('custom_event_options')}
              />
              <div className="form-text">
                List any other event options (comma-separated). These will be enabled by default.
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions - Bottom */}
        <div className="d-flex gap-2 mb-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending || updateMutation.isPending || (isEditing && !isDirty)}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save me-2"></i>
                {isEditing ? 'Save Changes' : 'Create Event'}
              </>
            )}
          </button>

          <Link
            to={isEditing ? `/events/${eventId}` : '/events'}
            className="btn btn-outline-secondary"
          >
            Cancel
          </Link>
        </div>

        {isEditing && !isDirty && (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Make changes to the form to enable saving.
          </div>
        )}

        {!isEditing && (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            New events are created with "pending" status and require site admin approval before becoming visible to others.
          </div>
        )}
      </form>
    </div>
  );
}

export default EventForm;
