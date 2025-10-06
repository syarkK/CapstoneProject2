/**
 * =================================================================
 * EEG Fatigue App - Backend Server (server.js) - With Avg. Duration Calculation
 * =================================================================
 */

// --- 1. DEPENDENCIES ---
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require('fs');
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const cors = require('cors');
const BlinkDetector = require('./blinkDetector.js');

// --- 2. SELF-CONTAINED BIQUAD FILTER CLASS ---
class BiquadFilter {
  constructor(options) {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    const Fs = options.sampleRate;
    const Fc = options.centerFrequency;
    const Q = options.Q;
    const K = Math.tan(Math.PI * Fc / Fs);
    const norm = 1 / (1 + K / Q + K * K);
    this.b0 = K / Q * norm;
    this.b1 = 0;
    this.b2 = -this.b0;
    this.a1 = 2 * (K * K - 1) * norm;
    this.a2 = (1 - K / Q + K * K) * norm;
  }
  process(sample) {
    const result = this.b0 * sample + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = sample;
    this.y2 = this.y1;
    this.y1 = result;
    return result;
  }
}

// --- 3. SERVER & WEBSOCKET SETUP ---
const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// --- 4. SERIAL PORT CONFIGURATION ---
const port = new SerialPort({
  path: "COM5", 
  baudRate: 115200,
});
const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));
port.on('error', (err) => { console.error("SerialPort Error: ", err.message); });

// --- 5. REAL-TIME FILTER & BLINK DETECTOR SETUP ---
const bandpassFilter = new BiquadFilter({
  sampleRate: 250,
  centerFrequency: 10,
  Q: 2.5
});

const blinkDetector = new BlinkDetector({
  sampleRate: 250,
});

// <-- MODIFIED: Store full blink objects to calculate duration
let recentBlinks = []; 

// <-- MODIFIED: This entire block is updated to calculate and send avg. duration
setInterval(() => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Filter out blinks older than one minute
  recentBlinks = recentBlinks.filter(blink => blink.ts > oneMinuteAgo);

  // Calculate Average Duration
  let avgDuration = 0;
  if (recentBlinks.length > 0) {
    const totalDuration = recentBlinks.reduce((sum, blink) => sum + blink.duration, 0);
    avgDuration = totalDuration / recentBlinks.length;
  }

  const stats = {
    blinkRate: recentBlinks.length,
    avgDuration: avgDuration,
  };
  
  const statsMessage = JSON.stringify({ fatigueStats: stats });
  
  // Broadcast the stats to all clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(statsMessage);
    }
  });
}, 2000); // Run every 2 seconds

// --- 6. WEBSOCKET & RECORDING LOGIC ---
let isRecording = false;
let writeStream;
wss.on("connection", (socket) => {
  console.log("✅ Client connected!");
  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.command === 'start-recording' && !isRecording) {
        const fileName = `recording-${Date.now()}.csv`;
        writeStream = fs.createWriteStream(fileName);
        writeStream.write('timestamp,filtered_eeg_value\n');
        isRecording = true;
        console.log(`🔴 Started recording to ${fileName}`);
      } else if (data.command === 'stop-recording' && isRecording) {
        isRecording = false;
        writeStream.end();
        console.log(`💾 Stopped recording. File saved.`);
      }
    } catch (e) { console.error("Error parsing message from client:", e); }
  });
  socket.on("close", () => console.log("🔌 Client disconnected."));
});

// --- 7. DATA PROCESSING PIPELINE ---
parser.on("data", (line) => {
  try {
    const parts = line.trim().split(",");
    if (parts.length === 2) {
      const timestamp = parseInt(parts[0]);
      const rawEegVal = parseInt(parts[1]);
      const filteredVal = bandpassFilter.process(rawEegVal);
      const dataToSend = { timestamp, eegVal: filteredVal };

      const blinkEvent = blinkDetector.process({ value: filteredVal, timestamp: timestamp });
      if (blinkEvent) {
        console.log('✅ Blink Detected (Dynamic)!', blinkEvent);
        
        // <-- MODIFIED: Add the full blink event object to our array
        recentBlinks.push(blinkEvent);

        const blinkMessage = JSON.stringify({ blinkEvent: blinkEvent });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(blinkMessage);
          }
        });
      }
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(dataToSend));
        }
      });
      if (isRecording) {
        writeStream.write(`${timestamp},${filteredVal}\n`);
      }
    }
  } catch (err) { console.error("Error processing serial data line:", err); }
});

// --- 8. START THE SERVER ---
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Server is running at http://localhost:${PORT}`);
  console.log("Waiting for client connections and data from serial port...");
});