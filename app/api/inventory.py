"""
Inventory API endpoints.

This module provides RESTful API endpoints for inventory management including
CRUD operations, bulk updates, and quick-add functionality.
"""

from flask import request
from app.api import api_bp
from app.api.errors import success_response, error_response, NotFoundError
from app.api.decorators import jwt_required_with_user
from app.models import InventoryItem
from app import db


# Common items for quick-add feature
COMMON_ITEMS = {
    'tent': 'Tent',
    'canopy': 'Canopy',
    'table': 'Table',
    'chairs': 'Camp Chairs',
    'cooler': 'Cooler',
    'grill': 'Grill',
    'sleeping-bag': 'Sleeping Bag',
    'cot': 'Cot',
    'generator': 'Generator',
    'lights': 'Lights',
    'sound-system': 'Sound System',
    'art': 'Art Installation',
    'shade': 'Shade Structure',
    'fire-pit': 'Fire Pit',
    'tools': 'Tools',
    'first-aid': 'First Aid Kit'
}


def serialize_inventory_item(item):
    """Serialize inventory item to dictionary."""
    return {
        'id': item.id,
        'name': item.name,
        'quantity': item.quantity,
        'description': item.description,
        'is_shared_gear': item.is_shared_gear,
        'created_at': item.created_at.isoformat() if item.created_at else None,
        'updated_at': item.updated_at.isoformat() if item.updated_at else None
    }


@api_bp.route('/inventory', methods=['GET'])
@jwt_required_with_user
def get_inventory(current_user):
    """
    List user's inventory items.

    Returns:
        200: List of inventory items
    """
    items = current_user.inventory_items.order_by(InventoryItem.created_at.desc()).all()

    return success_response(data={
        'items': [serialize_inventory_item(item) for item in items],
        'common_items': COMMON_ITEMS  # Include common items for quick-add UI
    })


@api_bp.route('/inventory', methods=['POST'])
@jwt_required_with_user
def create_inventory(current_user):
    """
    Create new inventory item.

    Request body:
        {
            "name": "Tent",
            "quantity": 2,
            "description": "4-person camping tent",
            "is_shared_gear": true
        }

    Returns:
        201: Item created successfully
        400: Validation error
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    name = data.get('name', '').strip()
    quantity = data.get('quantity', 1)
    description = data.get('description', '').strip()
    is_shared_gear = data.get('is_shared_gear', False)

    # Validate required fields
    if not name:
        return error_response('Item name is required'), 400

    # Validate quantity
    try:
        quantity = int(quantity)
        if quantity < 0:
            return error_response('Quantity must be 0 or greater'), 400
    except (ValueError, TypeError):
        return error_response('Invalid quantity value'), 400

    # Create item
    item = InventoryItem(
        user_id=current_user.id,
        name=name,
        quantity=quantity,
        description=description if description else None,
        is_shared_gear=is_shared_gear
    )

    db.session.add(item)
    db.session.commit()

    return success_response(
        data={'item': serialize_inventory_item(item)},
        message=f'"{item.name}" has been added to your inventory!',
        status_code=201
    )


@api_bp.route('/inventory/<int:item_id>', methods=['GET'])
@jwt_required_with_user
def get_inventory_item(current_user, item_id):
    """
    Get single inventory item.

    Args:
        item_id: ID of the inventory item

    Returns:
        200: Item data
        404: Item not found
        403: Not authorized (not owner)
    """
    item = InventoryItem.query.get_or_404(item_id)

    # Verify ownership
    if item.user_id != current_user.id:
        return error_response('You can only view your own inventory items'), 403

    return success_response(data={'item': serialize_inventory_item(item)})


@api_bp.route('/inventory/<int:item_id>', methods=['PUT'])
@jwt_required_with_user
def update_inventory(current_user, item_id):
    """
    Update inventory item.

    Args:
        item_id: ID of the inventory item

    Request body:
        {
            "name": "Updated Tent",
            "quantity": 3,
            "description": "Updated description",
            "is_shared_gear": false
        }

    Returns:
        200: Item updated successfully
        404: Item not found
        403: Not authorized (not owner)
        400: Validation error
    """
    item = InventoryItem.query.get_or_404(item_id)

    # Verify ownership
    if item.user_id != current_user.id:
        return error_response('You can only edit your own inventory items'), 403

    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    # Update fields if provided
    if 'name' in data:
        name = data['name'].strip()
        if not name:
            return error_response('Item name cannot be empty'), 400
        item.name = name

    if 'quantity' in data:
        try:
            quantity = int(data['quantity'])
            if quantity < 0:
                return error_response('Quantity must be 0 or greater'), 400
            item.quantity = quantity
        except (ValueError, TypeError):
            return error_response('Invalid quantity value'), 400

    if 'description' in data:
        item.description = data['description'].strip() if data['description'] else None

    if 'is_shared_gear' in data:
        item.is_shared_gear = bool(data['is_shared_gear'])

    db.session.commit()

    return success_response(
        data={'item': serialize_inventory_item(item)},
        message=f'"{item.name}" has been updated!'
    )


@api_bp.route('/inventory/<int:item_id>', methods=['DELETE'])
@jwt_required_with_user
def delete_inventory(current_user, item_id):
    """
    Delete inventory item.

    Args:
        item_id: ID of the inventory item

    Returns:
        200: Item deleted successfully
        404: Item not found
        403: Not authorized (not owner)
    """
    item = InventoryItem.query.get_or_404(item_id)

    # Verify ownership
    if item.user_id != current_user.id:
        return error_response('You can only delete your own inventory items'), 403

    item_name = item.name
    db.session.delete(item)
    db.session.commit()

    return success_response(message=f'"{item_name}" has been deleted from your inventory!')


@api_bp.route('/inventory/bulk-update', methods=['POST'])
@jwt_required_with_user
def bulk_update_inventory(current_user):
    """
    Bulk update inventory items and create new items.

    Request body:
        {
            "new_item": {
                "name": "New Item",
                "quantity": 1,
                "is_shared_gear": false
            },
            "updates": [
                {
                    "id": 1,
                    "quantity": 5,
                    "is_shared_gear": true
                },
                {
                    "id": 2,
                    "quantity": 3,
                    "is_shared_gear": false
                }
            ]
        }

    Returns:
        200: Bulk update successful
        400: Validation error
    """
    data = request.get_json()

    if not data:
        return error_response('No data provided'), 400

    updates_count = 0
    creates_count = 0

    # Handle new item creation
    new_item_data = data.get('new_item')
    if new_item_data and new_item_data.get('name', '').strip():
        try:
            name = new_item_data['name'].strip()
            quantity = int(new_item_data.get('quantity', 1))
            is_shared_gear = bool(new_item_data.get('is_shared_gear', False))

            if quantity < 0:
                return error_response('Quantity must be 0 or greater'), 400

            new_item = InventoryItem(
                user_id=current_user.id,
                name=name,
                quantity=quantity,
                is_shared_gear=is_shared_gear
            )
            db.session.add(new_item)
            creates_count += 1
        except (ValueError, TypeError, KeyError):
            return error_response('Invalid data for new item'), 400

    # Handle existing item updates
    updates = data.get('updates', [])
    for update_data in updates:
        try:
            item_id = update_data.get('id')
            if not item_id:
                continue

            item = InventoryItem.query.get(item_id)
            if not item or item.user_id != current_user.id:
                continue  # Skip items that don't exist or don't belong to user

            changed = False

            # Update quantity if provided
            if 'quantity' in update_data:
                quantity = int(update_data['quantity'])
                if quantity < 0:
                    continue  # Skip invalid quantities

                if item.quantity != quantity:
                    item.quantity = quantity
                    changed = True

            # Update shared status if provided
            if 'is_shared_gear' in update_data:
                is_shared = bool(update_data['is_shared_gear'])
                if item.is_shared_gear != is_shared:
                    item.is_shared_gear = is_shared
                    changed = True

            if changed:
                updates_count += 1

        except (ValueError, TypeError, KeyError):
            continue  # Skip items with invalid data

    db.session.commit()

    # Build success message
    messages = []
    if creates_count > 0:
        messages.append(f'{creates_count} item{"s" if creates_count != 1 else ""} created')
    if updates_count > 0:
        messages.append(f'{updates_count} change{"s" if updates_count != 1 else ""} saved')

    message = ' and '.join(messages).capitalize() + '!' if messages else 'No changes to save.'

    return success_response(
        data={
            'creates_count': creates_count,
            'updates_count': updates_count
        },
        message=message
    )


@api_bp.route('/inventory/quick-add/<item_key>', methods=['POST'])
@jwt_required_with_user
def quick_add_inventory(current_user, item_key):
    """
    Quick-add common inventory item.

    Args:
        item_key: Key for the common item (e.g., 'tent', 'chairs')

    Returns:
        201: Item created successfully
        400: Invalid item key
    """
    if item_key not in COMMON_ITEMS:
        return error_response('Invalid quick-add item'), 400

    # Create item with default quantity of 1
    item = InventoryItem(
        user_id=current_user.id,
        name=COMMON_ITEMS[item_key],
        quantity=1,
        is_shared_gear=False
    )

    db.session.add(item)
    db.session.commit()

    return success_response(
        data={'item': serialize_inventory_item(item)},
        message=f'"{item.name}" has been added to your inventory!',
        status_code=201
    )
