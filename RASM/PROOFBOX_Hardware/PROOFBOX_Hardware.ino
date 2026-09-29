/*******************************************************
 * PROOFBOX - NEURICK COMPLETE SENSOR + FIREBASE
 * Board: ESP32-S3
 *
 * VERIFIED HARDWARE:
 * OLED     -> I2C 0x3C
 * MPU6050  -> I2C 0x68
 * DHT22    -> GPIO 1
 * Flame DO -> GPIO 14
 * Flame AO -> GPIO 48
 *
 * NOT USED:
 * RC522, Ultrasonic, microSD, STM32/motors
 *******************************************************/

#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <WiFi.h>
#include <Wire.h>
#include <FirebaseClient.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <math.h>


// =====================================================
// 1. WIFI
// =====================================================

#define WIFI_SSID       "Loading... Please Wait... "
#define WIFI_PASSWORD   "gottilla."


// =====================================================
// 2. FIREBASE
// =====================================================

#define API_KEY         "AIzaSyB8c3smPOuC1tP8lO7HeLUbGNik4Tzl4Hk"

#define USER_EMAIL      "itzmerathan@gmail.com"
#define USER_PASSWORD   "123456789"

#define DATABASE_URL \
"https://proofbox-7596f-default-rtdb.asia-southeast1.firebasedatabase.app"


// =====================================================
// 3. DEVICE
// =====================================================

#define DEVICE_ID "PROOFBOX_001"


// =====================================================
// 4. PIN DEFINITIONS
// =====================================================

// DHT22
#define DHT_PIN 1
#define DHT_TYPE DHT22

// Flame sensor
#define FLAME_DO 14
#define FLAME_AO 48

// I2C
#define SDA_PIN 8
#define SCL_PIN 9

// OLED
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 32
#define OLED_ADDRESS 0x3C

// MPU6050
#define MPU_ADDRESS 0x68


// =====================================================
// 5. OBJECTS
// =====================================================

DHT dht(DHT_PIN, DHT_TYPE);

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);


// Firebase
SSL_CLIENT ssl_client;

using AsyncClient = AsyncClientClass;

AsyncClient aClient(ssl_client);

UserAuth user_auth(
  API_KEY,
  USER_EMAIL,
  USER_PASSWORD,
  3000
);

FirebaseApp app;

RealtimeDatabase Database;

AsyncResult databaseResult;


// =====================================================
// 6. SENSOR VARIABLES
// =====================================================

float temperature = 0.0;
float humidity = 0.0;

int flameDigital = 0;
int flameAnalog = 0;

int16_t ax = 0;
int16_t ay = 0;
int16_t az = 0;

float acceleration = 0.0;

bool motionDetected = false;
bool flameDetected = false;

unsigned long lastSensorRead = 0;
unsigned long lastFirebaseUpload = 0;

const unsigned long SENSOR_INTERVAL = 2000;
const unsigned long FIREBASE_INTERVAL = 5000;


// =====================================================
// 7. MPU6050 FUNCTIONS
// =====================================================

bool writeMPU(uint8_t reg, uint8_t value)
{
  Wire.beginTransmission(MPU_ADDRESS);
  Wire.write(reg);
  Wire.write(value);

  return Wire.endTransmission() == 0;
}


bool readMPU(uint8_t reg, uint8_t *data, uint8_t length)
{
  Wire.beginTransmission(MPU_ADDRESS);
  Wire.write(reg);

  if (Wire.endTransmission(false) != 0)
    return false;

  uint8_t received =
    Wire.requestFrom(MPU_ADDRESS, length);

  if (received != length)
    return false;

  for (uint8_t i = 0; i < length; i++)
  {
    data[i] = Wire.read();
  }

  return true;
}


bool initMPU()
{
  // Wake MPU6050
  if (!writeMPU(0x6B, 0x00))
    return false;

  delay(100);

  // WHO_AM_I
  uint8_t who = 0;

  if (!readMPU(0x75, &who, 1))
    return false;

  Serial.print("MPU6050 WHO_AM_I = 0x");
  Serial.println(who, HEX);

  return who == 0x68;
}


bool readMPUData()
{
  uint8_t data[6];

  if (!readMPU(0x3B, data, 6))
  {
    Serial.println("MPU6050 READ ERROR");
    return false;
  }

  ax = (int16_t)((data[0] << 8) | data[1]);
  ay = (int16_t)((data[2] << 8) | data[3]);
  az = (int16_t)((data[4] << 8) | data[5]);

  // Convert raw acceleration to g
  float axg = ax / 16384.0;
  float ayg = ay / 16384.0;
  float azg = az / 16384.0;

  acceleration =
    sqrt(
      axg * axg +
      ayg * ayg +
      azg * azg
    );

  // Simple motion detection
  if (fabs(acceleration - 1.0) > 0.15)
    motionDetected = true;
  else
    motionDetected = false;

  return true;
}


// =====================================================
// 8. DHT22
// =====================================================

void readDHT()
{
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t))
  {
    humidity = h;
    temperature = t;
  }
  else
  {
    Serial.println("DHT22 READ ERROR");
  }
}


// =====================================================
// 9. FLAME SENSOR
// =====================================================

void readFlame()
{
  flameDigital = digitalRead(FLAME_DO);

  flameAnalog = analogRead(FLAME_AO);

  /*
   * Most flame modules have:
   * DO = digital threshold output
   *
   * Depending on your module,
   * LOW may mean flame detected.
   */

  flameDetected = (flameDigital == LOW);
}


// =====================================================
// 10. READ ALL SENSORS
// =====================================================

void readAllSensors()
{
  readDHT();
  readFlame();
  readMPUData();
}


// =====================================================
// 11. SERIAL MONITOR
// =====================================================

void printSensorData()
{
  Serial.println();
  Serial.println("======================================");
  Serial.println("         PROOFBOX SENSOR DATA");
  Serial.println("======================================");

  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" °C");

  Serial.print("Humidity    : ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Flame DO    : ");
  Serial.println(flameDigital);

  Serial.print("Flame AO    : ");
  Serial.println(flameAnalog);

  Serial.print("Flame       : ");

  if (flameDetected)
    Serial.println("DETECTED");
  else
    Serial.println("SAFE");

  Serial.print("AX          : ");
  Serial.println(ax);

  Serial.print("AY          : ");
  Serial.println(ay);

  Serial.print("AZ          : ");
  Serial.println(az);

  Serial.print("Acceleration: ");
  Serial.print(acceleration);
  Serial.println(" g");

  Serial.print("Motion      : ");

  if (motionDetected)
    Serial.println("DETECTED");
  else
    Serial.println("STABLE");

  Serial.println("======================================");
}


// =====================================================
// 12. OLED
// =====================================================

void oledDisplay()
{
  display.clearDisplay();

  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.println("PROOFBOX");

  display.setCursor(0, 10);

  display.print("T:");
  display.print(temperature, 1);

  display.print("C H:");
  display.print(humidity, 0);
  display.print("%");

  display.setCursor(0, 20);

  if (flameDetected)
    display.print("FLAME ALERT");
  else
    display.print("FLAME SAFE");

  display.setCursor(75, 20);

  if (motionDetected)
    display.print("MOV");
  else
    display.print("STABLE");

  display.display();
}


// =====================================================
// 13. FIREBASE CALLBACK
// =====================================================

void processData(AsyncResult &aResult)
{
  if (!aResult.isResult())
    return;

  if (aResult.isEvent())
  {
    Firebase.printf(
      "Event: %s | %s | code:%d\n",
      aResult.uid().c_str(),
      aResult.eventLog().message().c_str(),
      aResult.eventLog().code()
    );
  }

  if (aResult.isDebug())
  {
    Firebase.printf(
      "Debug: %s\n",
      aResult.debug().c_str()
    );
  }

  if (aResult.isError())
  {
    Firebase.printf(
      "Firebase ERROR: %s | code:%d\n",
      aResult.error().message().c_str(),
      aResult.error().code()
    );
  }

  if (aResult.available())
  {
    Firebase.printf(
      "Firebase payload: %s\n",
      aResult.c_str()
    );
  }
}


// =====================================================
// 14. SEND SENSOR DATA TO FIREBASE
// =====================================================

void sendToFirebase()
{
  if (!app.ready())
  {
    Serial.println("Firebase not ready...");
    return;
  }

  JsonWriter writer;

  object_t json;
  object_t obj1;
  object_t obj2;
  object_t obj3;
  object_t obj4;
  object_t obj5;
  object_t obj6;
  object_t obj7;
  object_t obj8;

  // Temperature
  writer.create(
    obj1,
    "temperature",
    number_t(temperature, 1)
  );

  // Humidity
  writer.create(
    obj2,
    "humidity",
    number_t(humidity, 1)
  );

  // Flame digital
  writer.create(
    obj3,
    "flameDigital",
    flameDigital
  );

  // Flame analog
  writer.create(
    obj4,
    "flameAnalog",
    flameAnalog
  );

  // Flame status
  writer.create(
    obj5,
    "flameDetected",
    flameDetected
  );

  // Motion
  writer.create(
    obj6,
    "motion",
    motionDetected
  );

  // Acceleration
  writer.create(
    obj7,
    "acceleration",
    number_t(acceleration, 3)
  );

  // Online status
  writer.create(
    obj8,
    "status",
    string_t("online")
  );

  // Join everything
  writer.join(
    json,
    8,
    obj1,
    obj2,
    obj3,
    obj4,
    obj5,
    obj6,
    obj7,
    obj8
  );


  Serial.println();
  Serial.println("Uploading sensor data to Firebase...");

  Database.set<object_t>(
    aClient,
    "/devices/" DEVICE_ID,
    json,
    processData,
    "sensorUpload"
  );
}


// =====================================================
// 15. SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println("       PROOFBOX STARTING");
  Serial.println("======================================");


  // ---------------------------------------------------
  // I2C
  // ---------------------------------------------------

  Wire.begin(SDA_PIN, SCL_PIN);

  // Stable I2C speed used during your MPU testing
  Wire.setClock(10000);

  Serial.println("I2C initialized.");


  // ---------------------------------------------------
  // OLED
  // ---------------------------------------------------

  if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        OLED_ADDRESS))
  {
    Serial.println("OLED ERROR!");
  }
  else
  {
    Serial.println("OLED FOUND!");

    display.clearDisplay();

    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);

    display.setCursor(0, 0);
    display.println("PROOFBOX");

    display.setCursor(0, 12);
    display.println("Starting...");

    display.display();
  }


  // ---------------------------------------------------
  // DHT
  // ---------------------------------------------------

  dht.begin();

  Serial.println("DHT22 initialized.");


  // ---------------------------------------------------
  // FLAME
  // ---------------------------------------------------

  pinMode(FLAME_DO, INPUT);

  Serial.println("Flame sensor initialized.");


  // ---------------------------------------------------
  // MPU6050
  // ---------------------------------------------------

  if (initMPU())
  {
    Serial.println("MPU6050: OK");
  }
  else
  {
    Serial.println("MPU6050: ERROR");
  }


  // ---------------------------------------------------
  // WIFI
  // ---------------------------------------------------

  Serial.println();
  Serial.print("Connecting WiFi");

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);
  }

  Serial.println();

  Serial.println("WiFi connected!");

  Serial.print("IP: ");
  Serial.println(WiFi.localIP());


  // ---------------------------------------------------
  // FIREBASE
  // ---------------------------------------------------

  Firebase.printf(
    "Firebase Client v%s\n",
    FIREBASE_CLIENT_VERSION
  );

  set_ssl_client_insecure_and_buffer(
    ssl_client
  );

  Serial.println("Initializing Firebase...");

  initializeApp(
    aClient,
    app,
    getAuth(user_auth),
    auth_debug_print,
    "authTask"
  );

  app.getApp<RealtimeDatabase>(Database);

  Database.url(DATABASE_URL);


  Serial.println();
  Serial.println("======================================");
  Serial.println("       PROOFBOX READY");
  Serial.println("======================================");
}


// =====================================================
// 16. LOOP
// =====================================================

void loop()
{
  // Firebase background processing
  app.loop();


  // -----------------------------------------------
  // SENSOR UPDATE
  // -----------------------------------------------

  if (millis() - lastSensorRead >= SENSOR_INTERVAL)
  {
    lastSensorRead = millis();

    readAllSensors();

    printSensorData();

    oledDisplay();
  }


  // -----------------------------------------------
  // FIREBASE UPDATE
  // -----------------------------------------------

  if (
    millis() - lastFirebaseUpload >=
    FIREBASE_INTERVAL
  )
  {
    lastFirebaseUpload = millis();

    sendToFirebase();
  }


  // Firebase result processing
  processData(databaseResult);

  delay(10);
}