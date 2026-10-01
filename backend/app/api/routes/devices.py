# backend/app/api/routes/devices.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import handle_database_error
from app.database.session import get_db
from app.models.device import Device
from app.models.reading import SensorReading
from app.schemas.device import (
    DeviceCreate,
    DeviceResponse,
    DeviceUpdate,
    DeviceDetailResponse,
)


# ============================================================
# Router configuration
# ============================================================

router = APIRouter(
    prefix="/api/devices",
    tags=["Devices"]
)


# ============================================================
# CREATE DEVICE
# ============================================================

@router.post("/", response_model=dict)
def create_device(
    device: DeviceCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new device.

    Before creating the device, the API checks whether another
    device already exists with the same device_id.

    Database errors are handled separately so that detailed
    database information is logged on the server without
    exposing internal database details to the API client.
    """

    # --------------------------------------------------------
    # Check whether the device already exists
    # --------------------------------------------------------

    existing_device = (
        db.query(Device)
        .filter(Device.device_id == device.device_id)
        .first()
    )

    if existing_device:
        raise HTTPException(
            status_code=400,
            detail="Device with this ID already exists"
        )

    # --------------------------------------------------------
    # Create the SQLAlchemy model
    # --------------------------------------------------------

    new_device = Device(
        device_id=device.device_id,
        device_name=device.device_name,
        device_type=device.device_type,
        location=device.location,
        status=device.status or "offline"
    )

    # --------------------------------------------------------
    # Save the device
    # --------------------------------------------------------

    try:
        db.add(new_device)
        db.commit()
        db.refresh(new_device)

    except SQLAlchemyError as e:
        db.rollback()

        raise handle_database_error(
            e,
            "Unable to create device."
        )

    # --------------------------------------------------------
    # Return successful response
    # --------------------------------------------------------

    return {
        "message": "Device created successfully",
        "id": new_device.id,
        "device_id": new_device.device_id
    }


# ============================================================
# LIST DEVICES
# ============================================================

@router.get(
    "/",
    response_model=list[DeviceResponse]
)
def list_devices(
    db: Session = Depends(get_db)
):
    """
    Return all registered devices.
    """

    try:
        devices = db.query(Device).all()

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to retrieve devices."
        )

    return devices


# ============================================================
# GET DEVICE DETAILS
# ============================================================

@router.get(
    "/{device_id}",
    response_model=DeviceDetailResponse
)
def get_device(
    device_id: int,
    db: Session = Depends(get_db)
):
    """
    Return detailed information about a device.

    The response also contains the device's most recent
    sensor reading.
    """

    # --------------------------------------------------------
    # Find device
    # --------------------------------------------------------

    try:
        device = (
            db.query(Device)
            .filter(Device.id == device_id)
            .first()
        )

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to retrieve device."
        )

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    # --------------------------------------------------------
    # Find latest sensor reading
    # --------------------------------------------------------

    try:
        latest_reading = (
            db.query(SensorReading)
            .filter(
                SensorReading.device_id == device_id
            )
            .order_by(
                SensorReading.timestamp.desc()
            )
            .first()
        )

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to retrieve the device's latest reading."
        )

    # --------------------------------------------------------
    # Return detailed device response
    # --------------------------------------------------------

    return DeviceDetailResponse(
        id=device.id,
        device_id=device.device_id,
        device_name=device.device_name,
        device_type=device.device_type,
        location=device.location,
        status=device.status,
        created_at=device.created_at,
        latest_reading=latest_reading
    )


# ============================================================
# UPDATE DEVICE
# ============================================================

@router.put(
    "/{device_id}",
    response_model=DeviceResponse
)
def update_device(
    device_id: int,
    device_update: DeviceUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing device.

    Only fields supplied in the request are changed.
    """

    # --------------------------------------------------------
    # Find device
    # --------------------------------------------------------

    try:
        device = (
            db.query(Device)
            .filter(Device.id == device_id)
            .first()
        )

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to retrieve device."
        )

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    # --------------------------------------------------------
    # Get only fields supplied by the client
    # --------------------------------------------------------

    update_data = device_update.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Apply updates
    # --------------------------------------------------------

    for field, value in update_data.items():
        setattr(device, field, value)

    # --------------------------------------------------------
    # Save changes
    # --------------------------------------------------------

    try:
        db.commit()
        db.refresh(device)

    except SQLAlchemyError as e:
        db.rollback()

        raise handle_database_error(
            e,
            "Unable to update device."
        )

    return device


# ============================================================
# DELETE DEVICE
# ============================================================

@router.delete(
    "/{device_id}",
    response_model=dict
)
def delete_device(
    device_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a device.

    A device cannot be deleted if sensor readings already
    exist for it.

    This prevents foreign-key related problems and protects
    historical sensor data.
    """

    # --------------------------------------------------------
    # Find device
    # --------------------------------------------------------

    try:
        device = (
            db.query(Device)
            .filter(Device.id == device_id)
            .first()
        )

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to retrieve device."
        )

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    # --------------------------------------------------------
    # Check whether readings exist
    # --------------------------------------------------------

    try:
        readings_exist = (
            db.query(SensorReading)
            .filter(
                SensorReading.device_id == device_id
            )
            .first()
        )

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to check device sensor readings."
        )

    if readings_exist:
        raise HTTPException(
            status_code=409,
            detail=(
                "Device cannot be deleted because "
                "sensor readings exist for this device. "
                "Set the device status to offline instead."
            )
        )

    # --------------------------------------------------------
    # Delete device
    # --------------------------------------------------------

    try:
        db.delete(device)
        db.commit()

    except SQLAlchemyError as e:
        db.rollback()

        raise handle_database_error(
            e,
            "Unable to delete device."
        )

    # --------------------------------------------------------
    # Return successful response
    # --------------------------------------------------------

    return {
        "message": "Device deleted successfully",
        "device_id": device.device_id
    }