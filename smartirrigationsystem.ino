#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
// PC ka IP Address (cmd mein 'ipconfig' se check karein)
const char* serverUrl = "http://192.168.1.5:3000/api/data"; 

WiFiClient client;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  pinMode(A0, INPUT);
}

void loop() {
  int gasValue = analogRead(A0);
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"gasLevel\":" + String(gasValue) + "}";
    http.POST(payload);
    http.end();
  }
  delay(1000); // 1 second update
}