# backend/app/schemas/reading.py

from datetime import datetime, timezone

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


# ============================================================
# SENSOR READING CREATE
# ============================================================

class SensorReadingCreate(BaseModel):
    """
    Schema used when receiving a new sensor reading.

    These fields represent the measurements sent by the
    ESP32/ESP-01 devices to the FastAPI backend.

    Pydantic validates the values before they are passed
    to the database.
    """

    device_id: int

    # --------------------------------------------------------
    # Electrical measurements
    # --------------------------------------------------------

    voltage: float | None = Field(
        default=None,
        ge=0,
        description="Voltage measurement in volts (V)"
    )

    current: float | None = Field(
        default=None,
        ge=0,
        description="Current measurement in amperes (A)"
    )

    power: float | None = Field(
        default=None,
        ge=0,
        description="Power measurement in watts (W)"
    )

    energy: float | None = Field(
        default=None,
        ge=0,
        description="Energy measurement in kWh"
    )

    power_factor: float | None = Field(
        default=None,
        ge=-1,
        le=1,
        description="Power factor (-1 to 1)"
    )

    frequency: float | None = Field(
        default=None,
        ge=0,
        description="Frequency measurement in hertz (Hz)"
    )

    # --------------------------------------------------------
    # Environmental measurements
    # --------------------------------------------------------

    temperature: float | None = Field(
        default=None,
        description="Temperature measurement in degrees Celsius"
    )

    humidity: float | None = Field(
        default=None,
        ge=0,
        le=100,
        description="Relative humidity percentage"
    )

    pressure: float | None = Field(
        default=None,
        ge=0,
        description="Atmospheric pressure"
    )

    vibration: float | None = Field(
        default=None,
        ge=0,
        description="Vibration measurement"
    )

    # --------------------------------------------------------
    # Timestamp
    # --------------------------------------------------------

    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC-aware timestamp of the reading"
    )

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, value: datetime) -> datetime:
        """
        Validate and normalise the sensor reading timestamp.

        Requirements:

        1. The timestamp must contain timezone information.
        2. The timestamp is converted to UTC.
        3. A timestamp in the future is rejected.
        """

        # ----------------------------------------------------
        # Check timezone information
        # ----------------------------------------------------

        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError(
                "Timestamp must include timezone information."
            )

        # ----------------------------------------------------
        # Convert timestamp to UTC
        # ----------------------------------------------------

        value = value.astimezone(timezone.utc)

        # ----------------------------------------------------
        # Check for future timestamp
        # ----------------------------------------------------

        now = datetime.now(timezone.utc)

        if value > now:
            raise ValueError(
                "Timestamp cannot be in the future."
            )

        return value


# ============================================================
# SENSOR READING RESPONSE
# ============================================================

class SensorReadingResponse(BaseModel):
    """
    Schema used when returning a sensor reading through the API.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int

    voltage: float | None
    current: float | None
    power: float | None
    energy: float | None
    power_factor: float | None
    frequency: float | None

    temperature: float | None
    humidity: float | None
    pressure: float | None
    vibration: float | None

    timestamp: datetime


# ============================================================
# SENSOR READING CREATE RESPONSE
# ============================================================

class SensorReadingCreateResponse(BaseModel):
    """
    Response returned after successfully storing a
    new sensor reading.
    """

    message: str
    reading_id: int
    device_id: int
    timestamp: datetime


# ============================================================
# SENSOR READING UPDATE
# ============================================================

class SensorReadingUpdate(BaseModel):
    """
    Schema used when updating an existing sensor reading.

    Only fields supplied by the client will be updated.

    The same measurement validation rules used when creating
    readings are also applied here.
    """

    voltage: float | None = Field(
        default=None,
        ge=0,
        description="Voltage measurement in volts (V)"
    )

    current: float | None = Field(
        default=None,
        ge=0,
        description="Current measurement in amperes (A)"
    )

    power: float | None = Field(
        default=None,
        ge=0,
        description="Power measurement in watts (W)"
    )

    energy: float | None = Field(
        default=None,
        ge=0,
        description="Energy measurement in kWh"
    )

    power_factor: float | None = Field(
        default=None,
        ge=-1,
        le=1,
        description="Power factor (-1 to 1)"
    )

    frequency: float | None = Field(
        default=None,
        ge=0,
        description="Frequency measurement in hertz (Hz)"
    )

    temperature: float | None = Field(
        default=None,
        description="Temperature measurement in degrees Celsius"
    )

    humidity: float | None = Field(
        default=None,
        ge=0,
        le=100,
        description="Relative humidity percentage"
    )

    pressure: float | None = Field(
        default=None,
        ge=0,
        description="Atmospheric pressure"
    )

    vibration: float | None = Field(
        default=None,
        ge=0,
        description="Vibration measurement"
    )

    timestamp: datetime | None = Field(
        default=None,
        description="UTC-aware timestamp of the reading"
    )

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(
        cls,
        value: datetime | None
    ) -> datetime | None:
        """
        Validate an optional update timestamp.

        If a timestamp is supplied:

        1. It must contain timezone information.
        2. It is converted to UTC.
        3. It cannot be in the future.
        """

        # No timestamp supplied.
        if value is None:
            return None

        # ----------------------------------------------------
        # Check timezone information
        # ----------------------------------------------------

        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError(
                "Timestamp must include timezone information."
            )

        # ----------------------------------------------------
        # Convert timestamp to UTC
        # ----------------------------------------------------

        value = value.astimezone(timezone.utc)

        # ----------------------------------------------------
        # Check for future timestamp
        # ----------------------------------------------------

        now = datetime.now(timezone.utc)

        if value > now:
            raise ValueError(
                "Timestamp cannot be in the future."
            )

        return value


# ============================================================
# PAGINATED SENSOR READINGS RESPONSE
# ============================================================

class PaginatedReadingsResponse(BaseModel):
    """
    Schema used when returning a paginated list of readings.

    Includes metadata for frontend pagination.
    """

    total_count: int
    limit: int
    offset: int
    readings: list[SensorReadingResponse]