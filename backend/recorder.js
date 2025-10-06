// backend/recorder.js
const fs = require('fs');
const path = require('path');

class Recorder {
  constructor(outDir = path.join(__dirname, '..', 'data')) {
    this.outDir = outDir;
    if (!fs.existsSync(this.outDir)) fs.mkdirSync(this.outDir, { recursive: true });
    this.stream = null;
    this.isRecording = false;
    this.filename = null;
  }

  start() {
    const now = new Date();
    const fname = `session_${now.toISOString().replace(/[:.]/g, '-')}.csv`;
    this.filename = path.join(this.outDir, fname);
    this.stream = fs.createWriteStream(this.filename, { flags: 'w' });
    this.stream.write('timestamp_ms,sample,blink\n');
    this.isRecording = true;
    return this.filename;
  }

  log(tsMs, sample, blink = 0) {
    if (!this.isRecording) return;
    this.stream.write(`${tsMs},${sample},${blink}\n`);
  }

  stop() {
    if (!this.isRecording) return null;
    this.stream.end();
    this.isRecording = false;
    const file = this.filename;
    this.filename = null;
    return file;
  }
}

module.exports = Recorder;
