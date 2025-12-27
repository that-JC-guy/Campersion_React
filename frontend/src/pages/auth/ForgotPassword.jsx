/**
 * Forgot Password Page.
 *
 * Request password reset link.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { forgotPassword } from '../../api/services/auth';

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await forgotPassword(data.email);

      toast.success(response.message || 'If that email is registered, we\'ve sent password reset instructions.');
      setSubmitted(true);
    } catch (error) {
      const message = error.response?.data?.error || 'Request failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center auth-gradient">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-lg border-0 rounded-lg">
                <div className="card-body p-5 text-center">
                  <div className="mb-4">
                    <i className="bi bi-envelope-check text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h3 className="fw-bold mb-3">Check Your Email</h3>
                  <p className="text-muted mb-4">
                    If that email is registered, we've sent password reset instructions.
                    Please check your inbox.
                  </p>
                  <Link to="/login" className="btn btn-primary">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center auth-gradient">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold">Forgot Password?</h3>
                  <p className="text-muted">Enter your email to receive reset instructions</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email.message}</div>
                    )}
                  </div>

                  <div className="d-grid mb-3">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
