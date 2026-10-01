# backend/app/models/reading.py

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.device import Device


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    # --------------------------------------------------------
    # Database index
    # --------------------------------------------------------
    #
    # This composite index improves queries that:
    #
    # 1. Filter readings by device_id
    # 2. Sort readings by timestamp
    #
    # This is useful for queries such as:
    #
    # "Give me the latest readings for device 1."
    #
    __table_args__ = (
        Index(
            "ix_sensor_readings_device_timestamp",
            "device_id",
            "timestamp"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    device_id: Mapped[int] = mapped_column(
        ForeignKey("devices.id"),
        nullable=False
    )

    # --------------------------------------------------------
    # Relationship with Device
    # --------------------------------------------------------
    #
    # Each sensor reading belongs to exactly one Device.
    #
    # This allows us to do:
    #
    # reading.device
    #
    # and access the Device that produced the reading.
    #
    # The actual database relationship is provided by:
    #
    # device_id -> devices.id
    #
    device: Mapped["Device"] = relationship(
        back_populates="readings"
    )

    voltage: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    current: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    power: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    energy: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    power_factor: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    frequency: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    temperature: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    humidity: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    pressure: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    vibration: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )