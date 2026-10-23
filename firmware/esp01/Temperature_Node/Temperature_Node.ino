#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

//==================================================
// WIFI CONFIGURATION
//==================================================

const char* ssid = "House 12 A";
const char* password = "38951596";

//==================================================
// ESP32 CONFIGURATION
//==================================================

String ESP32_IP_ADDRESS = "192.168.0.164";

//==================================================
// TIMING CONSTANTS
//==================================================

const unsigned long TEMPERATURE_INTERVAL = 5000;

const unsigned long MESSAGE_INTERVAL = 5000;

const unsigned long REPORT_INTERVAL = 10000;


//==================================================
// DS18B20 CONFIGURATION
//==================================================

const int ONE_WIRE_BUS = 2;


//==================================================
// DS18B20 OBJECTS
//==================================================

OneWire oneWire(ONE_WIRE_BUS);

DallasTemperature sensors(&oneWire);


//==================================================
// SYSTEM STATES
//==================================================

String systemStatus = "ONLINE";

String networkStatus = "DISCONNECTED";

String sensorStatus = "OFFLINE";

String temperatureStatus = "WAITING";

String messageStatus = "WAITING";

String currentBuild = "BUILD-005";

String lastMessage = "NOT AVAILABLE";


//==================================================
// TEMPERATURE VARIABLES
//==================================================

float currentTemperature = 0.0;

float previousTemperature = 0.0;


//==================================================
// SYSTEM VARIABLES
//==================================================

unsigned long systemUptime = 0;

unsigned long previousTemperatureTime = 0;

unsigned long previousMessageTime = 0;

unsigned long previousReportTime = 0;


//==================================================
// SYSTEM FUNCTIONS
//==================================================

void initializeSystem()
{

  systemStatus = "ONLINE";

}


void initializeESP01()
{

  Serial.println();

  Serial.println("ESP01 INITIALIZATION SUCCESSFUL");

  Serial.println();

}


void updateSystemUptime()
{

  systemUptime = millis()/1000;

}


//==================================================
// WIFI FUNCTIONS
//==================================================

void connectWiFi() {
  Serial.println("\nCONNECTING TO WIFI.....");
  WiFi.begin(ssid, password);

  unsigned long startAttemptTime = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 20000) {
    Serial.print(".");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    networkStatus = "CONNECTED";
    Serial.println("\nWIFI CONNECTION SUCCESSFUL");
    Serial.print("IP ADDRESS : ");
    Serial.println(WiFi.localIP());
  } else {
    networkStatus = "FAILED";
    Serial.println("\nWIFI CONNECTION FAILED");
  }
}


//==================================================
// DS18B20 FUNCTIONS
//==================================================

void initializeDS18B20()
{

  sensors.begin();

  sensorStatus = "ONLINE";


  Serial.println();

  Serial.println("DS18B20 INITIALIZATION SUCCESSFUL");

  Serial.println();

}


void acquireTemperature()
{

  sensors.requestTemperatures();


  currentTemperature =

  sensors.getTempCByIndex(0);


  if(currentTemperature ==
     DEVICE_DISCONNECTED_C)
  {

    sensorStatus = "OFFLINE";

    temperatureStatus = "ERROR";

    lastMessage = "SENSOR ERROR";

    return;

  }


  sensorStatus = "ONLINE";

  temperatureStatus = "AVAILABLE";

}


void updateTemperature()
{

  previousTemperature = currentTemperature;


  acquireTemperature();


  if(sensorStatus == "ONLINE")
  {

    lastMessage =

    String(currentTemperature,1)

    + " C";

  }

}


//==================================================
// COMMUNICATION FUNCTIONS
//==================================================

void transmitMessage()
{

  if(WiFi.status() != WL_CONNECTED)
  {

    messageStatus = "FAILED";

    return;

  }


  WiFiClient client;

  HTTPClient http;


  String url =

  "http://"

  + ESP32_IP_ADDRESS +

  "/update?temperature="

  + String(currentTemperature,1);


  http.begin(client,url);


  int responseCode = http.GET();


  if(responseCode > 0)
  {

    messageStatus = "TRANSMITTED";

  }

  else
  {

    messageStatus = "FAILED";

  }


  http.end();


  Serial.println();

  Serial.print("TRANSMITTING : ");

  Serial.println(lastMessage);

  Serial.println();

}


//==================================================
// REPORTING FUNCTIONS
//==================================================

void statusReport()
{

  Serial.println();

  Serial.println("====================================");

  Serial.println("         ESP01 STATUS REPORT");

  Serial.println("             BUILD-005");

  Serial.println("====================================");


  Serial.println();

  Serial.println("SYSTEM STATUS");

  Serial.println();

  Serial.println(systemStatus);


  Serial.println();

  Serial.println("------------------------------------");


  Serial.println();

  Serial.println("NETWORK STATUS");

  Serial.println();

  Serial.println(networkStatus);


  Serial.println();

  Serial.println("------------------------------------");


  Serial.println();

  Serial.println("TEMPERATURE STATUS");

  Serial.println();

  Serial.println(temperatureStatus);


  Serial.println();

  Serial.println("------------------------------------");


  Serial.println();

  Serial.println("CURRENT TEMPERATURE");

  Serial.println();

  Serial.print(currentTemperature,1);

  Serial.println(" C");


  Serial.println();

  Serial.println("------------------------------------");


  Serial.println();

  Serial.println("MESSAGE STATUS");

  Serial.println();

  Serial.println(messageStatus);


  Serial.println();

  Serial.println("------------------------------------");


  Serial.println();

  Serial.println("LAST MESSAGE");

  Serial.println();

  Serial.println(lastMessage);


  Serial.println();

  Serial.println("------------------------------------");


  Serial.println();

  Serial.println("SYSTEM UPTIME");

  Serial.println();

  Serial.print(systemUptime);

  Serial.println(" Seconds");


  Serial.println();

  Serial.println("------------------------------------");


  Serial.println();

  Serial.println("CURRENT BUILD");

  Serial.println();

  Serial.println(currentBuild);


  Serial.println();

  Serial.println("====================================");

  Serial.println();

}


//==================================================
// MAIN SERVICE
//==================================================

void runESP01()
{

  updateSystemUptime();


  unsigned long currentTime = millis();


  //--------------------------------
  // Temperature Service
  //--------------------------------

  if(currentTime -
     previousTemperatureTime >=
     TEMPERATURE_INTERVAL)
  {

    previousTemperatureTime = currentTime;

    updateTemperature();

  }


  //--------------------------------
  // Communication Service
  //--------------------------------

  if(currentTime -
     previousMessageTime >=
     MESSAGE_INTERVAL)
  {

    previousMessageTime = currentTime;

    transmitMessage();

  }


  //--------------------------------
  // Reporting Service
  //--------------------------------

  if(currentTime -
     previousReportTime >=
     REPORT_INTERVAL)
  {

    previousReportTime = currentTime;

    statusReport();

  }


}


//==================================================
// SETUP
//==================================================

void setup()
{

  Serial.begin(115200);

  delay(2000);


  initializeSystem();

  connectWiFi();

  initializeESP01();

  initializeDS18B20();

}


//==================================================
// LOOP
//==================================================

void loop()
{

  runESP01();

}