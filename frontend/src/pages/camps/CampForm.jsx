/**
 * Camp Form Page.
 *
 * Form for creating and editing camps.
 * Includes capacity, amenities, and approval settings.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCamp, useCreateCamp, useUpdateCamp, usePromoteCampMember, useDemoteCampManager } from '../../hooks/useCamps';
import { useAuth } from '../../contexts/AuthContext';

function CampForm() {
  const { campId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!campId;

  const { data: camp, isLoading: loadingCamp } = useCamp(campId ? parseInt(campId) : null);
  const createMutation = useCreateCamp();
  const updateMutation = useUpdateCamp();
  const promoteMutation = usePromoteCampMember();
  const demoteMutation = useDemoteCampManager();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      max_sites: 0,
      max_people: 0,
      has_communal_kitchen: false,
      has_communal_space: false,
      has_art_exhibits: false,
      has_member_activities: false,
      has_non_member_activities: false,
      custom_amenities: '',
      member_approval_mode: 'manager_only'
    }
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && camp) {
      reset({
        name: camp.name || '',
        description: camp.description || '',
        max_sites: camp.max_sites || 0,
        max_people: camp.max_people || 0,
        has_communal_kitchen: camp.has_communal_kitchen || false,
        has_communal_space: camp.has_communal_space || false,
        has_art_exhibits: camp.has_art_exhibits || false,
        has_member_activities: camp.has_member_activities || false,
        has_non_member_activities: camp.has_non_member_activities || false,
        custom_amenities: camp.custom_amenities || '',
        member_approval_mode: camp.member_approval_mode || 'manager_only'
      });
    }
  }, [isEditing, camp, reset]);

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      max_sites: parseInt(data.max_sites) || 0,
      max_people: parseInt(data.max_people) || 0
    };

    if (isEditing) {
      updateMutation.mutate(
        { campId: parseInt(campId), data: formData },
        {
          onSuccess: () => {
            navigate(`/camps/${campId}`);
          }
        }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: (response) => {
          navigate(`/camps/${response.data.camp.id}`);
        }
      });
    }
  };

  const handlePromote = (userId, userName) => {
    if (window.confirm(`Promote ${userName} to camp manager?`)) {
      promoteMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  const handleDemote = (userId, userName) => {
    if (window.confirm(`Demote ${userName} to regular member?`)) {
      demoteMutation.mutate({ campId: parseInt(campId), userId });
    }
  };

  if (isEditing && loadingCamp) {
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
            <Link to="/camps">Camps</Link>
          </li>
          {isEditing && camp ? (
            <>
              <li className="breadcrumb-item">
                <Link to={`/camps/${campId}`}>{camp.name}</Link>
              </li>
              <li className="breadcrumb-item active">Edit</li>
            </>
          ) : (
            <li className="breadcrumb-item active">Create Camp</li>
          )}
        </ol>
      </nav>

      <h2 className="mb-4">
        <i className="bi bi-flag me-2"></i>
        {isEditing ? 'Edit Camp' : 'Create Camp'}
      </h2>

      <form id="campForm" onSubmit={handleSubmit(onSubmit)}>
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
                {isEditing ? 'Save Changes' : 'Create Camp'}
              </>
            )}
          </button>

          <Link
            to={isEditing ? `/camps/${campId}` : '/camps'}
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
            After creating the camp, you will be automatically added as a camp manager.
          </div>
        )}

        {/* Basic Information */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-info-circle me-2"></i>Basic Information</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Camp Name *</label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                id="name"
                {...register('name', {
                  required: 'Camp name is required',
                  maxLength: { value: 200, message: 'Name must be less than 200 characters' }
                })}
              />
              {errors.name && (
                <div className="invalid-feedback">{errors.name.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="description"
                rows="4"
                {...register('description')}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="max_sites" className="form-label">Maximum Sites</label>
                <input
                  type="number"
                  className="form-control"
                  id="max_sites"
                  min="0"
                  {...register('max_sites')}
                />
                <div className="form-text">Number of campsites available</div>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="max_people" className="form-label">Maximum People</label>
                <input
                  type="number"
                  className="form-control"
                  id="max_people"
                  min="0"
                  {...register('max_people')}
                />
                <div className="form-text">Total camp capacity</div>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-star me-2"></i>Amenities</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_communal_kitchen"
                    {...register('has_communal_kitchen')}
                  />
                  <label className="form-check-label" htmlFor="has_communal_kitchen">
                    <strong>Communal Kitchen</strong>
                    <br />
                    <small className="text-muted">Shared cooking facilities</small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_communal_space"
                    {...register('has_communal_space')}
                  />
                  <label className="form-check-label" htmlFor="has_communal_space">
                    <strong>Communal Space</strong>
                    <br />
                    <small className="text-muted">Common gathering area</small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_art_exhibits"
                    {...register('has_art_exhibits')}
                  />
                  <label className="form-check-label" htmlFor="has_art_exhibits">
                    <strong>Art Exhibits</strong>
                    <br />
                    <small className="text-muted">Art displays or galleries</small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_member_activities"
                    {...register('has_member_activities')}
                  />
                  <label className="form-check-label" htmlFor="has_member_activities">
                    <strong>Member Activities</strong>
                    <br />
                    <small className="text-muted">Activities for camp members only</small>
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="has_non_member_activities"
                    {...register('has_non_member_activities')}
                  />
                  <label className="form-check-label" htmlFor="has_non_member_activities">
                    <strong>Public Activities</strong>
                    <br />
                    <small className="text-muted">Activities open to non-members</small>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-0">
              <label htmlFor="custom_amenities" className="form-label">Additional Amenities</label>
              <input
                type="text"
                className="form-control"
                id="custom_amenities"
                placeholder="e.g., Fire pit, WiFi, Swimming pool"
                {...register('custom_amenities')}
              />
              <div className="form-text">List any other amenities (comma-separated)</div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-gear me-2"></i>Settings</h5>
          </div>
          <div className="card-body">
            <div className="mb-0">
              <label className="form-label">Member Approval Mode</label>
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id="approval_manager"
                  value="manager_only"
                  {...register('member_approval_mode')}
                />
                <label className="form-check-label" htmlFor="approval_manager">
                  <strong>Manager Only</strong>
                  <br />
                  <small className="text-muted">Only camp managers can approve new members</small>
                </label>
              </div>
              <div className="form-check">
                <input
                  type="radio"
                  className="form-check-input"
                  id="approval_all"
                  value="all_members"
                  {...register('member_approval_mode')}
                />
                <label className="form-check-label" htmlFor="approval_all">
                  <strong>All Members</strong>
                  <br />
                  <small className="text-muted">Any approved member can approve new members</small>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Member Role Management - Only shown when editing */}
      {isEditing && camp && camp.members && (camp.members.managers?.length > 0 || camp.members.regular_members?.length > 0) && (
        <div className="card mt-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-gear me-2"></i>Manage Member Roles
            </h5>
          </div>
          <div className="card-body">
            {/* Managers */}
            {camp.members.managers && camp.members.managers.length > 0 && (
              <>
                <h6 className="text-primary">Managers</h6>
                <div className="list-group mb-3">
                  {camp.members.managers.map((member) => (
                    <div key={member.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{member.user.name}</strong>
                          <br />
                          <small className="text-muted">{member.user.email}</small>
                        </div>
                        {member.user.id !== user?.id && (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleDemote(member.user.id, member.user.name)}
                            disabled={demoteMutation.isPending}
                          >
                            <i className="bi bi-arrow-down-circle me-1"></i>Demote
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Regular Members */}
            {camp.members.regular_members && camp.members.regular_members.length > 0 && (
              <>
                <h6 className="text-success">Members</h6>
                <div className="list-group">
                  {camp.members.regular_members.map((member) => (
                    <div key={member.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{member.user.name}</strong>
                          <br />
                          <small className="text-muted">{member.user.email}</small>
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handlePromote(member.user.id, member.user.name)}
                          disabled={promoteMutation.isPending}
                        >
                          <i className="bi bi-arrow-up-circle me-1"></i>Promote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Actions - Bottom */}
      <div className="d-flex gap-2 mb-4 mt-4">
        <button
          type="submit"
          form="campForm"
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
              {isEditing ? 'Save Changes' : 'Create Camp'}
            </>
          )}
        </button>

        <Link
          to={isEditing ? `/camps/${campId}` : '/camps'}
          className="btn btn-outline-secondary"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

export default CampForm;
