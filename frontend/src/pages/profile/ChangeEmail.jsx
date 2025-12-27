/**
 * Change Email Page.
 *
 * Allows user to request an email change.
 * Sends verification email to new address.
 */

import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useRequestEmailChange } from '../../hooks/useProfile';

function ChangeEmail() {
  const navigate = useNavigate();
  const requestEmailChangeMutation = useRequestEmailChange();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();

  const onSubmit = async (data) => {
    requestEmailChangeMutation.mutate(data.new_email, {
      onSuccess: () => {
        // Redirect to profile after a delay to let user see success message
        setTimeout(() => navigate('/profile'), 3000);
      }
    });
  };

  const newEmail = watch('new_email');
  const confirmEmail = watch('confirm_email');

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bi bi-envelope me-2"></i>Change Email Address
              </h4>
            </div>
            <div className="card-body">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                A verification email will be sent to your new email address. You must click the link in that email to complete the change.
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label htmlFor="new_email" className="form-label">New Email Address</label>
                  <input
                    type="email"
                    className={`form-control ${errors.new_email ? 'is-invalid' : ''}`}
                    id="new_email"
                    {...register('new_email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  {errors.new_email && (
                    <div className="invalid-feedback">{errors.new_email.message}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="confirm_email" className="form-label">Confirm New Email</label>
                  <input
                    type="email"
                    className={`form-control ${errors.confirm_email ? 'is-invalid' : ''}`}
                    id="confirm_email"
                    {...register('confirm_email', {
                      required: 'Please confirm your email',
                      validate: value => value === newEmail || 'Email addresses do not match'
                    })}
                  />
                  {errors.confirm_email && (
                    <div className="invalid-feedback">{errors.confirm_email.message}</div>
                  )}
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={requestEmailChangeMutation.isPending}
                  >
                    {requestEmailChangeMutation.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Send Verification Email
                      </>
                    )}
                  </button>

                  <Link to="/profile" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangeEmail;
