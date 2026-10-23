#include <ESP8266WiFi.h>

// ============================================================
// Wi-Fi configuration
// ============================================================

// Replace these with your own Wi-Fi details.
const char* WIFI_SSID = "House 12 A";
const char* WIFI_PASSWORD = "38951596";
// How long to wait between connection attempts.
const unsigned long RECONNECT_INTERVAL = 5000;

unsigned long lastReconnectAttempt = 0;


// ============================================================
// Connect to Wi-Fi
// ============================================================

void connectToWiFi()
{
  Serial.println();
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startTime = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - startTime < 15000)
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
// SETUP
// ============================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("ESP-01 Wi-Fi Test");
  Serial.println("================================");

  connectToWiFi();

  lastReconnectAttempt = millis();
}


// ============================================================
// LOOP
// ============================================================

void loop()
{
  // ----------------------------------------------------------
  // Check Wi-Fi connection
  // ----------------------------------------------------------

  if (WiFi.status() == WL_CONNECTED)
  {
    static unsigned long lastStatus = 0;

    // Print status every 5 seconds
    if (millis() - lastStatus >= 5000)
    {
      lastStatus = millis();

      Serial.print("Wi-Fi OK | IP: ");
      Serial.print(WiFi.localIP());

      Serial.print(" | RSSI: ");
      Serial.print(WiFi.RSSI());

      Serial.println(" dBm");
    }
  }
  else
  {
    // --------------------------------------------------------
    // Wi-Fi connection lost
    // --------------------------------------------------------

    if (millis() - lastReconnectAttempt >= RECONNECT_INTERVAL)
    {
      lastReconnectAttempt = millis();

      Serial.println();
      Serial.println("Wi-Fi disconnected.");
      Serial.println("Attempting to reconnect...");

      connectToWiFi();
    }
  }

  delay(100);
}