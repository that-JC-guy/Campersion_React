/**
 * Login Page.
 *
 * Main login page with OAuth provider buttons (Google, Microsoft)
 * and link to email/password login.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { login as loginAPI, getOAuthUrl } from '../../api/services/auth';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await loginAPI(data);

      // Set user in auth context
      setAuthUser(response.data.user);

      toast.success(response.message || 'Successfully logged in!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = getOAuthUrl(provider);
  };

  if (showEmailLogin) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center auth-gradient">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-lg border-0 rounded-lg">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center justify-content-center mb-4">
                    <img
                      src="/Logo-Light.png"
                      alt="Campersion Logo"
                      style={{ height: '60px', width: 'auto' }}
                      className="me-3"
                    />
                    <div>
                      <h3 className="fw-bold mb-1">Sign In</h3>
                      <p className="text-muted mb-0">Enter your email and password</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        id="email"
                        {...register('email', { required: 'Email is required' })}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email.message}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password</label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        id="password"
                        {...register('password', { required: 'Password is required' })}
                      />
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password.message}</div>
                      )}
                    </div>

                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="remember_me"
                        {...register('remember_me')}
                      />
                      <label className="form-check-label" htmlFor="remember_me">
                        Remember me
                      </label>
                    </div>

                    <div className="d-grid mb-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </button>
                    </div>
                  </form>

                  <div className="text-center">
                    <Link to="/forgot-password" className="text-decoration-none small">
                      Forgot your password?
                    </Link>
                  </div>

                  <hr className="my-4" />

                  <div className="text-center">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setShowEmailLogin(false)}
                    >
                      ← Back to OAuth Login
                    </button>
                  </div>

                  <div className="text-center mt-3">
                    <span className="text-muted small">Don't have an account? </span>
                    <Link to="/register" className="text-decoration-none small">
                      Sign up
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

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center auth-gradient">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-lg">
              <div className="card-body p-5">
                <div className="d-flex align-items-center justify-content-center mb-4">
                  <img
                    src="/Logo-Light.png"
                    alt="Campersion Logo"
                    style={{ height: '60px', width: 'auto' }}
                    className="me-3"
                  />
                  <div>
                    <h2 className="fw-bold mb-1">Welcome to Campersion</h2>
                    <p className="text-muted mb-0">Sign in to continue</p>
                  </div>
                </div>

                {/* OAuth Buttons */}
                <div className="d-grid gap-3 mb-4">
                  <button
                    className="btn btn-light btn-lg d-flex align-items-center justify-content-center border"
                    onClick={() => handleOAuthLogin('google')}
                    style={{ color: '#000' }}
                  >
                    <i className="bi bi-google me-2"></i>
                    Continue with Google
                  </button>

                  <button
                    className="btn btn-outline-primary btn-lg d-flex align-items-center justify-content-center"
                    onClick={() => handleOAuthLogin('microsoft')}
                  >
                    <i className="bi bi-microsoft me-2"></i>
                    Continue with Microsoft
                  </button>
                </div>

                <div className="text-center my-3">
                  <span className="text-muted">or</span>
                </div>

                {/* Email Login Button */}
                <div className="d-grid mb-3">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowEmailLogin(true)}
                  >
                    Sign in with Email
                  </button>
                </div>

                <div className="text-center mt-4">
                  <span className="text-muted small">Don't have an account? </span>
                  <Link to="/register" className="text-decoration-none small">
                    Sign up
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

export default Login;
