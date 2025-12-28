"""
API error handlers and custom exceptions.

This module defines custom exception classes and error handlers
that return JSON responses for API endpoints.
"""

from flask import jsonify, make_response
from flask_jwt_extended.exceptions import NoAuthorizationError
from werkzeug.exceptions import HTTPException
from app.api import api_bp


# Custom Exception Classes

class APIError(Exception):
    """Base class for API errors."""

    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        """Convert exception to dictionary for JSON response."""
        rv = {'success': False, 'error': self.message}
        if self.payload:
            rv.update(self.payload)
        return rv


class ValidationError(APIError):
    """Raised when request validation fails."""

    status_code = 422

    def __init__(self, message, errors=None):
        super().__init__(message)
        self.errors = errors

    def to_dict(self):
        rv = super().to_dict()
        if self.errors:
            rv['validation_errors'] = self.errors
        return rv


class AuthenticationError(APIError):
    """Raised when authentication fails."""

    status_code = 401


class AuthorizationError(APIError):
    """Raised when user lacks required permissions."""

    status_code = 403


class NotFoundError(APIError):
    """Raised when requested resource is not found."""

    status_code = 404


# Error Handlers for API Blueprint


@api_bp.errorhandler(APIError)
def handle_api_error(error):
    """Handle custom API errors."""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@api_bp.errorhandler(ValidationError)
def handle_validation_error(error):
    """Handle validation errors."""
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@api_bp.errorhandler(NoAuthorizationError)
def handle_no_authorization_error(error):
    """Handle JWT NoAuthorizationError (missing or invalid token)."""
    return jsonify({
        'success': False,
        'error': 'Authentication required',
        'code': 'NO_AUTHORIZATION'
    }), 401


@api_bp.errorhandler(400)
def handle_bad_request(error):
    """Handle 400 Bad Request errors."""
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'message': str(error)
    }), 400


@api_bp.errorhandler(401)
def handle_unauthorized(error):
    """Handle 401 Unauthorized errors."""
    return jsonify({
        'success': False,
        'error': 'Authentication required',
        'message': str(error)
    }), 401


@api_bp.errorhandler(403)
def handle_forbidden(error):
    """Handle 403 Forbidden errors."""
    return jsonify({
        'success': False,
        'error': 'Insufficient permissions',
        'message': str(error)
    }), 403


@api_bp.errorhandler(404)
def handle_not_found(error):
    """Handle 404 Not Found errors."""
    return jsonify({
        'success': False,
        'error': 'Resource not found',
        'message': str(error)
    }), 404


@api_bp.errorhandler(422)
def handle_unprocessable_entity(error):
    """Handle 422 Unprocessable Entity errors."""
    return jsonify({
        'success': False,
        'error': 'Validation failed',
        'message': str(error)
    }), 422


@api_bp.errorhandler(500)
def handle_internal_server_error(error):
    """Handle 500 Internal Server Error."""
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


@api_bp.errorhandler(Exception)
def handle_unexpected_error(error):
    """Handle unexpected exceptions."""
    # Log the error for debugging
    import traceback
    traceback.print_exc()

    # Return generic error to client
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


# Helper functions for consistent API responses

def success_response(data=None, message=None, status_code=200):
    """
    Create a successful JSON response.

    Args:
        data: Response data (dict, list, or None)
        message: Optional success message
        status_code: HTTP status code (default: 200)

    Returns:
        Flask response with JSON content
    """
    response = {'success': True}

    if data is not None:
        response['data'] = data

    if message:
        response['message'] = message

    resp = make_response(jsonify(response))
    resp.status_code = status_code
    return resp


def error_response(error, status_code=400):
    """
    Create an error JSON response.

    Args:
        error: Error message (string)
        status_code: HTTP status code (default: 400)

    Returns:
        Flask response with JSON content
    """
    resp = make_response(jsonify({
        'success': False,
        'error': error
    }))
    resp.status_code = status_code
    return resp
