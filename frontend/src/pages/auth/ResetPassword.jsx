/**
 * Reset Password Page.
 *
 * Reset password using token from email.
 */

import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { resetPassword } from '../../api/services/auth';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await resetPassword(token, data.password);

      toast.success(response.message || 'Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.error || 'Password reset failed. The link may be expired.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center auth-gradient">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold">Reset Password</h3>
                  <p className="text-muted">Enter your new password</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">New Password</label>
                    <input
                      type="password"
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      id="password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                    />
                    {errors.password && (
                      <div className="invalid-feedback">{errors.password.message}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirm_password" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                      id="confirm_password"
                      {...register('confirm_password', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                    />
                    {errors.confirm_password && (
                      <div className="invalid-feedback">{errors.confirm_password.message}</div>
                    )}
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-3">
                  <Link to="/login" className="text-decoration-none small">
                    ← Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
