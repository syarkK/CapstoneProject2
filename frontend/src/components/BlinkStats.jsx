// frontend/src/components/BlinkStats.jsx
import React from 'react';

export default function BlinkStats({ blinkEvents = [], stats = {} }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ padding: 12, borderRadius: 8, background: '#f3f3f3' }}>
        <h3>Blink rate: {(stats.blinkRate ?? stats.score ?? 0).toFixed(1)}</h3>
        <p>Avg duration: {(stats.avgDuration ?? 0).toFixed(3)} s</p>
        <p>Fatigue score: {(stats.score ?? 0)}</p>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Recent blinks</h4>
        <ul style={{ maxHeight: 200, overflow: 'auto', paddingLeft: 10 }}>
          {blinkEvents.map((b, i) => (
            <li key={i}>[{new Date(b.ts).toLocaleTimeString()}] dur {(b.duration ?? 0).toFixed(3)} s</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

