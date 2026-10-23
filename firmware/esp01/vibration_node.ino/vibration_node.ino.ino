#include <Wire.h>
#include <ESP8266WiFi.h>


// ============================================================
// Wi-Fi Configuration
// ============================================================

const char* WIFI_SSID = "House 12 A";
const char* WIFI_PASSWORD = "38951596";

const unsigned long RECONNECT_INTERVAL = 5000;

unsigned long lastReconnectAttempt = 0;


// ============================================================
// MPU6050 Configuration
// ============================================================

#define MPU6050_ADDRESS 0x68

#define WHO_AM_I_REG       0x75
#define PWR_MGMT_1_REG     0x6B
#define ACCEL_XOUT_H_REG   0x3B

// ESP-01 I²C pins
const int SDA_PIN = 2;   // GPIO2
const int SCL_PIN = 0;   // GPIO0

// MPU6050 default sensitivity:
// ±2g = 16384 LSB/g
const float ACCEL_SCALE = 16384.0f;


// ============================================================
// Vibration Processing Configuration
// ============================================================

const int SAMPLE_COUNT = 100;

// 10 ms = approximately 100 Hz sampling
const int SAMPLE_DELAY_MS = 10;

// Gravity estimation
const float GRAVITY_ALPHA = 0.95f;


// ============================================================
// Gravity Estimate
// ============================================================

float gravityX = 0.0f;
float gravityY = 0.0f;
float gravityZ = 0.0f;


// ============================================================
// MPU6050 Register Functions
// ============================================================

void writeRegister(
  uint8_t registerAddress,
  uint8_t value
)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  Wire.write(registerAddress);
  Wire.write(value);

  Wire.endTransmission();
}


// ============================================================
// Read a Register
// ============================================================

uint8_t readRegister(
  uint8_t registerAddress
)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  Wire.write(registerAddress);

  Wire.endTransmission(false);

  Wire.requestFrom(
    MPU6050_ADDRESS,
    1
  );

  if (Wire.available())
  {
    return Wire.read();
  }

  return 0;
}


// ============================================================
// Read Raw Acceleration
// ============================================================

bool readRawAcceleration(
  int16_t &x,
  int16_t &y,
  int16_t &z
)
{
  Wire.beginTransmission(MPU6050_ADDRESS);

  Wire.write(ACCEL_XOUT_H_REG);

  if (Wire.endTransmission(false) != 0)
  {
    return false;
  }

  uint8_t bytesRequested = 6;

  uint8_t bytesReceived =
    Wire.requestFrom(
      MPU6050_ADDRESS,
      bytesRequested
    );

  if (bytesReceived != 6)
  {
    return false;
  }

  x = (Wire.read() << 8) | Wire.read();
  y = (Wire.read() << 8) | Wire.read();
  z = (Wire.read() << 8) | Wire.read();

  return true;
}


// ============================================================
// Convert Raw Acceleration to g
// ============================================================

float rawToG(int16_t rawValue)
{
  return rawValue / ACCEL_SCALE;
}


// ============================================================
// Update Gravity Estimate
// ============================================================

void updateGravityEstimate(
  float x,
  float y,
  float z
)
{
  gravityX =
    GRAVITY_ALPHA * gravityX +
    (1.0f - GRAVITY_ALPHA) * x;

  gravityY =
    GRAVITY_ALPHA * gravityY +
    (1.0f - GRAVITY_ALPHA) * y;

  gravityZ =
    GRAVITY_ALPHA * gravityZ +
    (1.0f - GRAVITY_ALPHA) * z;
}


// ============================================================
// Calculate Dynamic Acceleration Magnitude
// ============================================================

float calculateDynamicMagnitude(
  float x,
  float y,
  float z
)
{
  // Remove the estimated gravity component

  float dynamicX = x - gravityX;
  float dynamicY = y - gravityY;
  float dynamicZ = z - gravityZ;

  // Calculate magnitude

  float magnitude =
    sqrt(
      dynamicX * dynamicX +
      dynamicY * dynamicY +
      dynamicZ * dynamicZ
    );

  return magnitude;
}


// ============================================================
// Calculate Vibration RMS
// ============================================================

float calculateVibrationRMS(
  uint16_t &validSamples,
  uint16_t &failedSamples
)
{
  float sumSquares = 0.0f;

  validSamples = 0;
  failedSamples = 0;


  for (int i = 0; i < SAMPLE_COUNT; i++)
  {
    int16_t rawX;
    int16_t rawY;
    int16_t rawZ;


    bool success =
      readRawAcceleration(
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


      // Calculate dynamic vibration

      float dynamicMagnitude =
        calculateDynamicMagnitude(
          accelX,
          accelY,
          accelZ
        );


      // Add squared value for RMS

      sumSquares +=
        dynamicMagnitude *
        dynamicMagnitude;


      validSamples++;
    }
    else
    {
      failedSamples++;
    }


    // Allow ESP-01 background Wi-Fi processing

    delay(SAMPLE_DELAY_MS);
  }


  if (validSamples == 0)
  {
    return 0.0f;
  }


  // RMS calculation

  float rms =
    sqrt(
      sumSquares /
      validSamples
    );


  return rms;
}


// ============================================================
// Connect to Wi-Fi
// ============================================================

void connectToWiFi()
{
  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);


  WiFi.mode(WIFI_STA);

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );


  unsigned long startTime = millis();


  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - startTime < 15000
  )
  {
    delay(500);

    Serial.print(".");
  }


  Serial.println();


  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.println("Wi-Fi connected.");

    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  }
  else
  {
    Serial.println("Wi-Fi connection failed.");
  }
}


// ============================================================
// Check Wi-Fi
// ============================================================

void checkWiFi()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    return;
  }


  if (
    millis() - lastReconnectAttempt >=
    RECONNECT_INTERVAL
  )
  {
    lastReconnectAttempt = millis();


    Serial.println();
    Serial.println("Wi-Fi disconnected.");
    Serial.println("Attempting to reconnect...");


    connectToWiFi();
  }
}


// ============================================================
// Setup
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);


  Serial.println();
  Serial.println("================================");
  Serial.println("ESP-01 Vibration Node");
  Serial.println("MPU6050 + Wi-Fi");
  Serial.println("================================");


  // ----------------------------------------------------------
  // Start I²C
  // ----------------------------------------------------------

  Wire.begin(
    SDA_PIN,
    SCL_PIN
  );


  // ----------------------------------------------------------
  // Wake up MPU6050
  // ----------------------------------------------------------

  writeRegister(
    PWR_MGMT_1_REG,
    0x00
  );


  delay(100);


  // ----------------------------------------------------------
  // Check MPU6050
  // ----------------------------------------------------------

  uint8_t deviceID =
    readRegister(
      WHO_AM_I_REG
    );


  Serial.print("MPU6050 WHO_AM_I: 0x");
  Serial.println(
    deviceID,
    HEX
  );


  if (deviceID == 0x68)
  {
    Serial.println("MPU6050 detected.");
  }
  else
  {
    Serial.println("WARNING: MPU6050 not detected.");
  }


  // ----------------------------------------------------------
  // Connect to Wi-Fi
  // ----------------------------------------------------------

  connectToWiFi();

  lastReconnectAttempt = millis();
}


// ============================================================
// Main Loop
// ============================================================

void loop()
{
  // ----------------------------------------------------------
  // Make sure Wi-Fi remains available
  // ----------------------------------------------------------

  checkWiFi();


  // ----------------------------------------------------------
  // Calculate vibration
  // ----------------------------------------------------------

  uint16_t validSamples = 0;
  uint16_t failedSamples = 0;


  float vibrationRMS =
    calculateVibrationRMS(
      validSamples,
      failedSamples
    );


  // ----------------------------------------------------------
  // Display result
  // ----------------------------------------------------------

  Serial.print("Valid: ");
  Serial.print(validSamples);

  Serial.print("/");
  Serial.print(SAMPLE_COUNT);

  Serial.print(" | Failed: ");
  Serial.print(failedSamples);

  Serial.print(" | Vibration RMS: ");

  Serial.print(
    vibrationRMS,
    4
  );

  Serial.println(" g");


  // ----------------------------------------------------------
  // Display Wi-Fi status
  // ----------------------------------------------------------

  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.print("Wi-Fi: OK");

    Serial.print(" | IP: ");
    Serial.print(WiFi.localIP());

    Serial.print(" | RSSI: ");
    Serial.print(WiFi.RSSI());

    Serial.println(" dBm");
  }
  else
  {
    Serial.println("Wi-Fi: DISCONNECTED");
  }


  Serial.println("--------------------------------");


  // Small pause before next measurement window

  delay(100);
}