# backend/app/models/device.py

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.reading import SensorReading


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    device_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    device_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    device_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    location: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="offline"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # --------------------------------------------------------
    # Relationship with SensorReading
    # --------------------------------------------------------
    #
    # One Device can have many SensorReading records.
    #
    # Example:
    #
    # device.readings
    #
    # could contain:
    #
    # Reading 1
    # Reading 2
    # Reading 3
    #
    # This relationship does NOT create a new database column.
    # The actual database connection is provided by the
    # device_id foreign key in SensorReading.
    readings: Mapped[list["SensorReading"]] = relationship(
        back_populates="device"
    )