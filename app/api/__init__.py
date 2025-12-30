"""
API Blueprint module.

This module defines the API blueprint for RESTful endpoints that serve
the React frontend. All API routes are prefixed with /api/v1.
"""

from flask import Blueprint

# Create API blueprint
api_bp = Blueprint('api', __name__)

# Import routes after blueprint creation to avoid circular imports
# Routes will be registered when modules are imported
from app.api import auth, users, events, camps, inventory, admin, clusters, teams, errors
