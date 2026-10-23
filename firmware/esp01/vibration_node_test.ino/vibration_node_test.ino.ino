#include <Wire.h>

// ============================================================
// MPU6050 I2C address
// ============================================================
// AD0 LOW  -> 0x68
// AD0 HIGH -> 0x69
//
#define MPU6050_ADDRESS 0x68

// ============================================================
// ESP-01 I2C pins
// ============================================================
// ESP-01:
// GPIO0 -> SCL
// GPIO2 -> SDA
//
#define SDA_PIN 2
#define SCL_PIN 0

// ============================================================
// MPU6050 registers
// ============================================================

#define MPU6050_WHO_AM_I   0x75
#define MPU6050_PWR_MGMT_1 0x6B

#define ACCEL_XOUT_H 0x3B
#define ACCEL_XOUT_L 0x3C
#define ACCEL_YOUT_H 0x3D
#define ACCEL_YOUT_L 0x3E
#define ACCEL_ZOUT_H 0x3F
#define ACCEL_ZOUT_L 0x40


// ============================================================
// Write one byte to an MPU6050 register
// ============================================================

void writeMPU6050(uint8_t registerAddress, uint8_t value)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  Wire.write(registerAddress);
  Wire.write(value);

  Wire.endTransmission();
}


// ============================================================
// Read one byte from an MPU6050 register
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
// Read acceleration values
// ============================================================

void readAcceleration(int16_t &accelX,
                      int16_t &accelY,
                      int16_t &accelZ)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  // Start reading from ACCEL_XOUT_H
  Wire.write(ACCEL_XOUT_H);

  Wire.endTransmission(false);

  // Request 6 bytes:
  //
  // X high
  // X low
  // Y high
  // Y low
  // Z high
  // Z low
  //
  Wire.requestFrom(MPU6050_ADDRESS, (uint8_t)6);

  if (Wire.available() >= 6)
  {
    accelX = (Wire.read() << 8) | Wire.read();
    accelY = (Wire.read() << 8) | Wire.read();
    accelZ = (Wire.read() << 8) | Wire.read();
  }
}


// ============================================================
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("MPU6050 Vibration Node Test");
  Serial.println("================================");

  // Start I2C
  Wire.begin(SDA_PIN, SCL_PIN);

  delay(100);

  // ----------------------------------------------------------
  // Check MPU6050 identity
  // ----------------------------------------------------------

  uint8_t whoAmI = readMPU6050(MPU6050_WHO_AM_I);

  Serial.print("MPU6050 WHO_AM_I: 0x");

  if (whoAmI < 0x10)
  {
    Serial.print("0");
  }

  Serial.println(whoAmI, HEX);

  // ----------------------------------------------------------
  // Wake up MPU6050
  // ----------------------------------------------------------
  //
  // MPU6050 starts in sleep mode.
  //
  writeMPU6050(MPU6050_PWR_MGMT_1, 0x00);

  delay(100);

  Serial.println("MPU6050 initialized.");
  Serial.println("Reading acceleration...");
  Serial.println();
}


// ============================================================
// LOOP
// ============================================================

void loop()
{
  int16_t accelX;
  int16_t accelY;
  int16_t accelZ;

  // Read acceleration
  readAcceleration(accelX, accelY, accelZ);

  // ----------------------------------------------------------
  // Print raw acceleration values
  // ----------------------------------------------------------

  Serial.print("X: ");
  Serial.print(accelX);

  Serial.print(" | Y: ");
  Serial.print(accelY);

  Serial.print(" | Z: ");
  Serial.println(accelZ);

  // Read approximately every 100 ms
  delay(100);
}
