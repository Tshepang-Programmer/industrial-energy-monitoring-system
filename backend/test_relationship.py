from app.database.session import SessionLocal
from app.models.device import Device
from app.models.reading import SensorReading


db = SessionLocal()

try:
    # --------------------------------------------------------
    # Test 1: Device → SensorReadings
    # --------------------------------------------------------

    device = db.query(Device).first()

    if device:
        print("DEVICE → READINGS")
        print("------------------")
        print(f"Device: {device.device_name}")

        for reading in device.readings:
            print(
                f"Reading ID: {reading.id} | "
                f"Power: {reading.power} W"
            )

    # --------------------------------------------------------
    # Test 2: SensorReading → Device
    # --------------------------------------------------------

    reading = db.query(SensorReading).first()

    if reading:
        print("\nREADING → DEVICE")
        print("-----------------")
        print(f"Reading ID: {reading.id}")
        print(f"Power: {reading.power} W")
        print(f"Device: {reading.device.device_name}")

finally:
    db.close()