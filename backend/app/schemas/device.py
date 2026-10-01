# backend/app/schemas/device.py

from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.reading import SensorReadingResponse


class DeviceCreate(BaseModel):
    """
    Schema used when creating a new device.
    """
    device_id: str
    device_name: str
    device_type: str
    location: str | None = None
    status: str | None = "offline"


class DeviceUpdate(BaseModel):
    """
    Schema used when updating an existing device.

    Only fields supplied by the client will be updated.
    """
    device_name: str | None = None
    device_type: str | None = None
    location: str | None = None
    status: str | None = None


class DeviceResponse(BaseModel):
    """
    Standard response schema for a device.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: str
    device_name: str
    device_type: str
    location: str | None
    status: str
    created_at: datetime


class DeviceDetailResponse(BaseModel):
    """
    Detailed device response.

    This response contains the device information together
    with its most recent sensor reading.

    Useful for dashboards where the frontend can retrieve
    the device and its latest measurements in one call.
    """
    model_config = ConfigDict(from_attributes=True)

    # Device information
    id: int
    device_id: str
    device_name: str
    device_type: str
    location: str | None
    status: str
    created_at: datetime

    # Latest sensor reading (may be None if no readings yet)
    latest_reading: SensorReadingResponse | None = None