// backend/blinkDetector.js

class BlinkDetector {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 250;
    
    // We'll analyze the last 1 second of data (250 samples) at a time.
    const bufferSeconds = 1;
    this.bufferSize = bufferSeconds * this.sampleRate;
    this.buffer = [];

    // To avoid detecting the same blink multiple times, we'll ignore a 
    // short period after a blink is found.
    this.refractoryPeriod = 0.5 * this.sampleRate; // 500 ms
    this.samplesSinceLastBlink = 0;
  }

  /**
   * Adds a new sample to our data buffer and processes it.
   * @param {object} sample - An object with { value, timestamp }.
   * @returns {object|null} A blink event or null.
   */
  process(sample) {
    // Add the new sample to our buffer (a sliding window)
    this.buffer.push(sample);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift(); // Keep the buffer at a fixed size
    }
    
    this.samplesSinceLastBlink++;

    // Don't look for a new blink right after finding one
    if (this.samplesSinceLastBlink < this.refractoryPeriod) {
      return null;
    }

    // Only run the detection logic if we have enough data
    if (this.buffer.length < this.bufferSize) {
      return null;
    }

    // --- Core Blink Detection Algorithm ---
    const blink = this.findBlinkShape(this.buffer);

    if (blink) {
      // Reset the counter and remove the processed blink from the buffer
      // to prevent re-detection.
      this.samplesSinceLastBlink = 0;
      this.buffer = [];
      return blink;
    }

    return null;
  }
  
  /**
   * Analyzes a chunk of data to find a blink shape (minima between two stable points).
   * @param {array} dataChunk - An array of { value, timestamp } objects.
   * @returns {object|null} A blink event or null.
   */
  findBlinkShape(dataChunk) {
    // 1. Find the local minima (the lowest point of the potential blink)
    let minIndex = -1;
    let minVal = Infinity;
    for (let i = 0; i < dataChunk.length; i++) {
      if (dataChunk[i].value < minVal) {
        minVal = dataChunk[i].value;
        minIndex = i;
      }
    }

    // Ensure the minima is not at the very edge of our data window
    if (minIndex < 10 || minIndex >= dataChunk.length - 10) {
      return null;
    }
    
    // 2. Find the left and right stable points
    const leftPoint = this.findStablePoint(dataChunk, minIndex, 'left');
    const rightPoint = this.findStablePoint(dataChunk, minIndex, 'right');

    if (leftPoint && rightPoint) {
      const duration = rightPoint.timestamp - leftPoint.timestamp;
      
      // Basic validation for the blink event
      if (duration > 40 && duration < 500) { // Duration between 40ms and 500ms
        return {
          ts: rightPoint.timestamp,
          duration: duration / 1000, // Convert to seconds
        };
      }
    }

    return null;
  }

  /**
   * Searches from a minima to find a "stable" point where the signal flattens.
   * @param {array} dataChunk - The data to search within.
   * @param {number} startIndex - The index of the minima to start from.
   * @param {string} direction - 'left' or 'right'.
   * @returns {object|null} The stable point { value, timestamp } or null.
   */
  findStablePoint(dataChunk, startIndex, direction) {
    const increment = direction === 'left' ? -1 : 1;
    let currentIndex = startIndex;

    // Move away from the minima as long as the signal is generally rising
    while (
      currentIndex > 0 && 
      currentIndex < dataChunk.length - 1 &&
      dataChunk[currentIndex + increment].value > dataChunk[currentIndex].value
    ) {
      currentIndex += increment;
    }

    // To be considered stable, the point shouldn't be too close to the minima
    if (Math.abs(startIndex - currentIndex) > 5) {
      return dataChunk[currentIndex];
    }
    
    return null;
  }
}

module.exports = BlinkDetector;