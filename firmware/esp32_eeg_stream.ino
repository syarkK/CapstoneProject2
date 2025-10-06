// esp32_eeg_stream.ino
// Simple ADC streamer: outputs CSV lines "timestamp_ms,value\n"
// Adjust pins, sample rate, and scaling to your hardware.

#include <Arduino.h>

const int eegPin = 34;          // example ADC pin
const unsigned long sampleHz = 250; // sample rate (Hz) - change as needed
const unsigned long sampleIntervalMicros = 1000000UL / sampleHz;

unsigned long lastMicros = 0;
unsigned long tms = 0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 12-bit ADC (0-4095) on many ESP32s
  // wait for serial
  delay(1000);
}

void loop() {
  unsigned long now = micros();
  if (now - lastMicros >= sampleIntervalMicros) {
    lastMicros += sampleIntervalMicros;
    int raw = analogRead(eegPin);
    // optionally scale / convert to voltage: float v = raw * (3.3 / 4095.0);
    Serial.print(tms); Serial.print(','); Serial.println(raw);
    tms += (1000UL / sampleHz); // approximate ms increment
  }
}
