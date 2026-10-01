# backend/app/api/routes/readings.py

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.exceptions import handle_database_error
from app.database.session import get_db
from app.models.device import Device
from app.models.reading import SensorReading
from app.schemas.reading import (
    SensorReadingCreate,
    SensorReadingCreateResponse,
    SensorReadingResponse,
    PaginatedReadingsResponse,
)


# ============================================================
# Router configuration
# ============================================================

router = APIRouter(
    prefix="/api/readings",
    tags=["Readings"]
)


# ============================================================
# CREATE SENSOR READING
# ============================================================

@router.post(
    "/",
    response_model=SensorReadingCreateResponse
)
def create_reading(
    reading: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    """
    Store a new sensor reading.

    The device must already exist before the reading can
    be stored.

    Pydantic validates the incoming sensor values before
    this function is called.
    """

    # --------------------------------------------------------
    # Check that the device exists
    # --------------------------------------------------------

    try:
        device = (
            db.query(Device)
            .filter(Device.id == reading.device_id)
            .first()
        )

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to verify the device."
        )

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    # --------------------------------------------------------
    # Determine timestamp
    # --------------------------------------------------------
    #
    # SensorReadingCreate normally provides a UTC timestamp
    # automatically.
    #
    # The fallback is kept as a defensive measure.
    # --------------------------------------------------------

    timestamp = (
        reading.timestamp
        or datetime.now(timezone.utc)
    )

    # --------------------------------------------------------
    # Create SensorReading model
    # --------------------------------------------------------

    new_reading = SensorReading(
        device_id=reading.device_id,

        voltage=reading.voltage,
        current=reading.current,
        power=reading.power,
        energy=reading.energy,
        power_factor=reading.power_factor,
        frequency=reading.frequency,

        temperature=reading.temperature,
        humidity=reading.humidity,
        pressure=reading.pressure,
        vibration=reading.vibration,

        timestamp=timestamp
    )

    # --------------------------------------------------------
    # Save reading to database
    # --------------------------------------------------------

    try:
        db.add(new_reading)
        db.commit()
        db.refresh(new_reading)

    except SQLAlchemyError as e:
        db.rollback()

        raise handle_database_error(
            e,
            "Unable to store sensor reading."
        )

    # --------------------------------------------------------
    # Return successful response
    # --------------------------------------------------------

    return SensorReadingCreateResponse(
        message="Sensor reading stored successfully",
        reading_id=new_reading.id,
        device_id=new_reading.device_id,
        timestamp=new_reading.timestamp
    )


# ============================================================
# GET SENSOR READINGS
# ============================================================

@router.get(
    "/{device_id}",
    response_model=PaginatedReadingsResponse
)
def get_readings(
    device_id: int,

    db: Session = Depends(get_db),

    start: datetime | None = Query(
        None,
        description="Start timestamp (UTC)"
    ),

    end: datetime | None = Query(
        None,
        description="End timestamp (UTC)"
    ),

    limit: int = Query(
        100,
        ge=1,
        le=1000,
        description="Maximum number of readings to return"
    ),

    offset: int = Query(
        0,
        ge=0,
        description="Number of readings to skip"
    )
):
    """
    Return sensor readings for a specific device.

    Supports:

    - Pagination
    - Start timestamp filtering
    - End timestamp filtering
    - Newest readings first
    """
    # --------------------------------------------------------
    # Validate timestamp range
    # --------------------------------------------------------

    if start and end and start > end:
        raise HTTPException(
            status_code=400,
            detail="Start timestamp cannot be later than end timestamp."
        )

    # --------------------------------------------------------
    # Check that the device exists
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
            "Unable to verify the device."
        )

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    # --------------------------------------------------------
    # Build readings query
    # --------------------------------------------------------

    query = (
        db.query(SensorReading)
        .filter(
            SensorReading.device_id == device_id
        )
    )

    # --------------------------------------------------------
    # Apply start timestamp filter
    # --------------------------------------------------------

    if start:
        query = query.filter(
            SensorReading.timestamp >= start
        )

    # --------------------------------------------------------
    # Apply end timestamp filter
    # --------------------------------------------------------

    if end:
        query = query.filter(
            SensorReading.timestamp <= end
        )

    # --------------------------------------------------------
    # Count matching readings
    # --------------------------------------------------------

    try:
        total_count = query.count()

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to count sensor readings."
        )

    # --------------------------------------------------------
    # Sort newest readings first
    # --------------------------------------------------------

    query = query.order_by(
        SensorReading.timestamp.desc()
    )

    # --------------------------------------------------------
    # Apply pagination
    # --------------------------------------------------------

    try:
        readings = (
            query
            .limit(limit)
            .offset(offset)
            .all()
        )

    except SQLAlchemyError as e:
        raise handle_database_error(
            e,
            "Unable to retrieve sensor readings."
        )

    # --------------------------------------------------------
    # Handle no readings
    # --------------------------------------------------------

    if not readings:
        raise HTTPException(
            status_code=404,
            detail="No readings found for this device"
        )

    # --------------------------------------------------------
    # Return paginated response
    # --------------------------------------------------------

    return PaginatedReadingsResponse(
        total_count=total_count,
        limit=limit,
        offset=offset,
        readings=readings
    )


# ============================================================
# GET LATEST SENSOR READING
# ============================================================

@router.get(
    "/{device_id}/latest",
    response_model=SensorReadingResponse
)
def get_latest_reading(
    device_id: int,
    db: Session = Depends(get_db)
):
    """
    Return the most recent sensor reading for a device.

    The composite database index on:

        device_id + timestamp

    helps support this type of query efficiently.
    """

    # --------------------------------------------------------
    # Check that the device exists
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
            "Unable to verify the device."
        )

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    # --------------------------------------------------------
    # Retrieve latest reading
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
            "Unable to retrieve the latest sensor reading."
        )

    # --------------------------------------------------------
    # Handle device with no readings
    # --------------------------------------------------------

    if not latest_reading:
        raise HTTPException(
            status_code=404,
            detail="No readings found for this device"
        )

    # --------------------------------------------------------
    # Return latest reading
    # --------------------------------------------------------

    return latest_reading