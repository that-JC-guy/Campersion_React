/**
 * Edit Profile Page.
 *
 * Comprehensive form for updating user profile including:
 * - Names and pronouns
 * - Phone numbers
 * - Address
 * - Display preferences
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';

function EditProfile() {
  const navigate = useNavigate();
  const { data, isLoading: loadingProfile } = useProfile();
  const updateMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm();

  // Populate form with current profile data
  useEffect(() => {
    if (data?.profile) {
      reset({
        first_name: data.profile.first_name || '',
        last_name: data.profile.last_name || '',
        preferred_name: data.profile.preferred_name || '',
        show_full_name: data.profile.show_full_name || false,
        pronouns: data.profile.pronouns || '',
        show_pronouns: data.profile.show_pronouns || false,
        home_phone: data.profile.home_phone || '',
        mobile_phone: data.profile.mobile_phone || '',
        work_phone: data.profile.work_phone || '',
        address_line1: data.profile.address_line1 || '',
        address_line2: data.profile.address_line2 || '',
        city: data.profile.city || '',
        state: data.profile.state || '',
        zip_code: data.profile.zip_code || '',
        country: data.profile.country || ''
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData) => {
    updateMutation.mutate(formData, {
      onSuccess: () => {
        navigate('/profile');
      }
    });
  };

  if (loadingProfile) {
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
            <Link to="/profile">Profile</Link>
          </li>
          <li className="breadcrumb-item active">Edit</li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <img src="/Member.png" alt="Member" style={{ height: '68px', width: 'auto' }} className="me-2" />
          Edit Profile
        </h2>
        <Link to="/profile" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>Back to Profile
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Personal Information */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-person me-2"></i>Personal Information</h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="first_name" className="form-label">First Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                  id="first_name"
                  {...register('first_name', {
                    maxLength: { value: 100, message: 'First name must be less than 100 characters' }
                  })}
                />
                {errors.first_name && (
                  <div className="invalid-feedback">{errors.first_name.message}</div>
                )}
              </div>

              <div className="col-md-6">
                <label htmlFor="last_name" className="form-label">Last Name</label>
                <input
                  type="text"
                  className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                  id="last_name"
                  {...register('last_name', {
                    maxLength: { value: 100, message: 'Last name must be less than 100 characters' }
                  })}
                />
                {errors.last_name && (
                  <div className="invalid-feedback">{errors.last_name.message}</div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="preferred_name" className="form-label">Preferred Name</label>
              <input
                type="text"
                className={`form-control ${errors.preferred_name ? 'is-invalid' : ''}`}
                id="preferred_name"
                {...register('preferred_name', {
                  maxLength: { value: 100, message: 'Preferred name must be less than 100 characters' }
                })}
              />
              <div className="form-text">The name you'd like to be called</div>
              {errors.preferred_name && (
                <div className="invalid-feedback">{errors.preferred_name.message}</div>
              )}
            </div>

            <div className="mb-3">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="show_full_name"
                  {...register('show_full_name')}
                />
                <label className="form-check-label" htmlFor="show_full_name">
                  Show my full name to other members
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="pronouns" className="form-label">Pronouns</label>
              <input
                type="text"
                className={`form-control ${errors.pronouns ? 'is-invalid' : ''}`}
                id="pronouns"
                placeholder="e.g., he/him, she/her, they/them"
                {...register('pronouns', {
                  maxLength: { value: 50, message: 'Pronouns must be less than 50 characters' }
                })}
              />
              {errors.pronouns && (
                <div className="invalid-feedback">{errors.pronouns.message}</div>
              )}
            </div>

            <div className="mb-0">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="show_pronouns"
                  {...register('show_pronouns')}
                />
                <label className="form-check-label" htmlFor="show_pronouns">
                  Show my pronouns to other members
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-telephone me-2"></i>Contact Information</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="home_phone" className="form-label">Home Phone</label>
              <input
                type="tel"
                className={`form-control ${errors.home_phone ? 'is-invalid' : ''}`}
                id="home_phone"
                placeholder="(555) 123-4567"
                {...register('home_phone', {
                  maxLength: { value: 20, message: 'Phone number must be less than 20 characters' }
                })}
              />
              {errors.home_phone && (
                <div className="invalid-feedback">{errors.home_phone.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="mobile_phone" className="form-label">Mobile Phone</label>
              <input
                type="tel"
                className={`form-control ${errors.mobile_phone ? 'is-invalid' : ''}`}
                id="mobile_phone"
                placeholder="(555) 123-4567"
                {...register('mobile_phone', {
                  maxLength: { value: 20, message: 'Phone number must be less than 20 characters' }
                })}
              />
              {errors.mobile_phone && (
                <div className="invalid-feedback">{errors.mobile_phone.message}</div>
              )}
            </div>

            <div className="mb-0">
              <label htmlFor="work_phone" className="form-label">Work Phone</label>
              <input
                type="tel"
                className={`form-control ${errors.work_phone ? 'is-invalid' : ''}`}
                id="work_phone"
                placeholder="(555) 123-4567"
                {...register('work_phone', {
                  maxLength: { value: 20, message: 'Phone number must be less than 20 characters' }
                })}
              />
              {errors.work_phone && (
                <div className="invalid-feedback">{errors.work_phone.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0"><i className="bi bi-geo-alt me-2"></i>Address</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="address_line1" className="form-label">Address Line 1</label>
              <input
                type="text"
                className={`form-control ${errors.address_line1 ? 'is-invalid' : ''}`}
                id="address_line1"
                placeholder="Street address"
                {...register('address_line1', {
                  maxLength: { value: 200, message: 'Address must be less than 200 characters' }
                })}
              />
              {errors.address_line1 && (
                <div className="invalid-feedback">{errors.address_line1.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="address_line2" className="form-label">Address Line 2</label>
              <input
                type="text"
                className={`form-control ${errors.address_line2 ? 'is-invalid' : ''}`}
                id="address_line2"
                placeholder="Apartment, suite, etc. (optional)"
                {...register('address_line2', {
                  maxLength: { value: 200, message: 'Address must be less than 200 characters' }
                })}
              />
              {errors.address_line2 && (
                <div className="invalid-feedback">{errors.address_line2.message}</div>
              )}
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="city" className="form-label">City</label>
                <input
                  type="text"
                  className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                  id="city"
                  {...register('city', {
                    maxLength: { value: 100, message: 'City must be less than 100 characters' }
                  })}
                />
                {errors.city && (
                  <div className="invalid-feedback">{errors.city.message}</div>
                )}
              </div>

              <div className="col-md-3">
                <label htmlFor="state" className="form-label">State/Province</label>
                <input
                  type="text"
                  className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                  id="state"
                  {...register('state', {
                    maxLength: { value: 50, message: 'State must be less than 50 characters' }
                  })}
                />
                {errors.state && (
                  <div className="invalid-feedback">{errors.state.message}</div>
                )}
              </div>

              <div className="col-md-3">
                <label htmlFor="zip_code" className="form-label">Zip/Postal Code</label>
                <input
                  type="text"
                  className={`form-control ${errors.zip_code ? 'is-invalid' : ''}`}
                  id="zip_code"
                  {...register('zip_code', {
                    maxLength: { value: 20, message: 'Zip code must be less than 20 characters' }
                  })}
                />
                {errors.zip_code && (
                  <div className="invalid-feedback">{errors.zip_code.message}</div>
                )}
              </div>
            </div>

            <div className="mb-0">
              <label htmlFor="country" className="form-label">Country</label>
              <input
                type="text"
                className={`form-control ${errors.country ? 'is-invalid' : ''}`}
                id="country"
                {...register('country', {
                  maxLength: { value: 100, message: 'Country must be less than 100 characters' }
                })}
              />
              {errors.country && (
                <div className="invalid-feedback">{errors.country.message}</div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="d-flex gap-2 mb-4">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateMutation.isPending || !isDirty}
          >
            {updateMutation.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save me-2"></i>
                Save Changes
              </>
            )}
          </button>

          <Link to="/profile" className="btn btn-outline-secondary">
            Cancel
          </Link>
        </div>

        {!isDirty && (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Make changes to the form to enable saving.
          </div>
        )}
      </form>
    </div>
  );
}

export default EditProfile;
