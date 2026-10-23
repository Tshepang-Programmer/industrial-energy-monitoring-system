#include <Wire.h>
#include <math.h>

// ============================================================
// MPU6050 configuration
// ============================================================

#define MPU6050_ADDRESS 0x68

// ESP-01 I2C pins
#define SDA_PIN 2
#define SCL_PIN 0

// MPU6050 registers
#define MPU6050_WHO_AM_I    0x75
#define MPU6050_PWR_MGMT_1  0x6B
#define ACCEL_XOUT_H        0x3B

// MPU6050 default accelerometer sensitivity
//
// Default range: +/-2g
// Sensitivity: 16384 LSB/g
//
#define ACCEL_SENSITIVITY 16384.0f


// ============================================================
// Sampling configuration
// ============================================================

// Number of samples used to calculate one RMS value.
#define SAMPLE_COUNT 100

// Delay between samples.
// 10 ms = approximately 100 Hz sampling rate.
#define SAMPLE_DELAY_MS 10


// ============================================================
// Gravity filter
// ============================================================
//
// This controls how quickly our gravity estimate changes.
//
// Smaller alpha:
//     gravity estimate follows changes more slowly.
//
// Larger alpha:
//     gravity estimate follows changes more quickly.
//
// We start with 0.95.
//
#define GRAVITY_ALPHA 0.95f


// ============================================================
// Gravity estimates
// ============================================================

float gravityX = 0.0f;
float gravityY = 0.0f;
float gravityZ = 0.0f;

bool gravityInitialized = false;


// ============================================================
// Write to an MPU6050 register
// ============================================================

void writeMPU6050(uint8_t registerAddress, uint8_t value)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  Wire.write(registerAddress);
  Wire.write(value);

  Wire.endTransmission();
}


// ============================================================
// Read one byte from MPU6050
// ============================================================

uint8_t readMPU6050(uint8_t registerAddress)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  Wire.write(registerAddress);

  Wire.endTransmission(false);

  Wire.requestFrom(MPU6050_ADDRESS, (uint8_t)1);

  if (Wire.available())
  {
    return Wire.read();
  }

  return 0;
}


// ============================================================
// Read raw acceleration
// ============================================================

bool readRawAcceleration(
  int16_t &accelX,
  int16_t &accelY,
  int16_t &accelZ
)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  Wire.write(ACCEL_XOUT_H);

  // Repeated-start
  if (Wire.endTransmission(false) != 0)
  {
    return false;
  }

  // Request X, Y and Z
  // 6 bytes total
  //
  // X high
  // X low
  // Y high
  // Y low
  // Z high
  // Z low
  //
  uint8_t received = Wire.requestFrom(
    MPU6050_ADDRESS,
    (uint8_t)6
  );

  if (received != 6)
  {
    return false;
  }

  accelX = (int16_t)(
    (Wire.read() << 8) | Wire.read()
  );

  accelY = (int16_t)(
    (Wire.read() << 8) | Wire.read()
  );

  accelZ = (int16_t)(
    (Wire.read() << 8) | Wire.read()
  );

  return true;
}


// ============================================================
// Convert raw MPU6050 value to g
// ============================================================

float rawToG(int16_t rawValue)
{
  return rawValue / ACCEL_SENSITIVITY;
}


// ============================================================
// Update gravity estimate
// ============================================================

void updateGravityEstimate(
  float accelX,
  float accelY,
  float accelZ
)
{
  if (!gravityInitialized)
  {
    gravityX = accelX;
    gravityY = accelY;
    gravityZ = accelZ;

    gravityInitialized = true;

    return;
  }

  gravityX =
    GRAVITY_ALPHA * gravityX +
    (1.0f - GRAVITY_ALPHA) * accelX;

  gravityY =
    GRAVITY_ALPHA * gravityY +
    (1.0f - GRAVITY_ALPHA) * accelY;

  gravityZ =
    GRAVITY_ALPHA * gravityZ +
    (1.0f - GRAVITY_ALPHA) * accelZ;
}


// ============================================================
// Calculate dynamic acceleration
// ============================================================

float calculateDynamicMagnitude(
  float accelX,
  float accelY,
  float accelZ
)
{
  // Remove estimated gravity
  float dynamicX = accelX - gravityX;
  float dynamicY = accelY - gravityY;
  float dynamicZ = accelZ - gravityZ;

  // Calculate 3-axis dynamic acceleration magnitude
  float magnitude = sqrt(
    dynamicX * dynamicX +
    dynamicY * dynamicY +
    dynamicZ * dynamicZ
  );

  return magnitude;
}


// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println("MPU6050 Vibration Processing Test");
  Serial.println("======================================");

  // Start I2C
  Wire.begin(SDA_PIN, SCL_PIN);

  delay(100);

  // Check sensor identity
  uint8_t whoAmI = readMPU6050(MPU6050_WHO_AM_I);

  Serial.print("WHO_AM_I: 0x");
  Serial.println(whoAmI, HEX);

  if (whoAmI != 0x68)
  {
    Serial.println("WARNING: MPU6050 identity check failed.");
  }
  else
  {
    Serial.println("MPU6050 detected.");
  }

  // Wake MPU6050
  writeMPU6050(
    MPU6050_PWR_MGMT_1,
    0x00
  );

  delay(100);

  Serial.println("MPU6050 initialized.");
  Serial.println();

  Serial.println(
    "Keep the sensor still for a few seconds..."
  );

  delay(3000);

  Serial.println(
    "Starting vibration measurement."
  );

  Serial.println();
}


// ============================================================
// LOOP
// ============================================================
void loop()
{
  float sumSquares = 0.0f;

  uint16_t validSamples = 0;
  uint16_t failedSamples = 0;

  // Collect one second of samples
  for (int i = 0; i < SAMPLE_COUNT; i++)
  {
    int16_t rawX;
    int16_t rawY;
    int16_t rawZ;

    bool success = readRawAcceleration(
      rawX,
      rawY,
      rawZ
    );

    if (success)
    {
      // Convert raw values to g
      float accelX = rawToG(rawX);
      float accelY = rawToG(rawY);
      float accelZ = rawToG(rawZ);

      // Estimate and remove gravity
      updateGravityEstimate(
        accelX,
        accelY,
        accelZ
      );

      // Calculate dynamic acceleration
      float dynamicMagnitude =
        calculateDynamicMagnitude(
          accelX,
          accelY,
          accelZ
        );

      // Add squared value for RMS
      sumSquares +=
        dynamicMagnitude * dynamicMagnitude;

      validSamples++;
    }
    else
    {
      failedSamples++;
    }

    delay(SAMPLE_DELAY_MS);
  }

  // ----------------------------------------------------------
  // Only calculate RMS when we received valid data
  // ----------------------------------------------------------

  if (validSamples > 0)
  {
    float rms = sqrt(
      sumSquares / validSamples
    );

    Serial.print("Valid: ");
    Serial.print(validSamples);

    Serial.print("/");
    Serial.print(SAMPLE_COUNT);

    Serial.print(" | Failed: ");
    Serial.print(failedSamples);

    Serial.print(" | Vibration RMS: ");
    Serial.print(rms, 4);

    Serial.println(" g");
  }
  else
  {
    Serial.println(
      "MPU6050 communication failure."
    );
  }
}