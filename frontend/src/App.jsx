// frontend/src/App.jsx
import React, { useState, useEffect, useRef } from "react";
import Graph from "./components/Graph";
import Controls from "./components/Controls";
import BlinkStats from "./components/BlinkStats";

const MAX_GRAPH_POINTS = 2500; // 10 seconds of data

function App() {
  const [eegData, setEegData] = useState([]);
  const [blinkEvents, setBlinkEvents] = useState([]);
  const [fatigueStats, setFatigueStats] = useState({ blinkRate: 0, avgDuration: 0 });

  const socket = useRef(null);

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:3001");

    socket.current.onopen = () => console.log("WebSocket Connected");
    socket.current.onclose = () => console.log("WebSocket Disconnected");

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle EEG signal data
      if (data.eegVal !== undefined) {
        // Create an object with x (timestamp) and y (value) for the time-series chart
        const newDataPoint = { x: data.timestamp, y: data.eegVal };

        setEegData(prevData => {
          const newData = [...prevData, newDataPoint];
          if (newData.length > MAX_GRAPH_POINTS) {
            return newData.slice(newData.length - MAX_GRAPH_POINTS);
          }
          return newData;
        });
      }

      // Handle detected blink events
      if (data.blinkEvent) {
        setBlinkEvents(prevBlinks => [data.blinkEvent, ...prevBlinks].slice(0, 10));
      }
      
      // Handle calculated fatigue statistics
      if (data.fatigueStats) {
        setFatigueStats(data.fatigueStats);
      }
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>EEG Fatigue Dashboard</h1>
      
      <Controls socket={socket.current} />

      {/* Pass both eegData and blinkEvents to the Graph component */}
      <Graph eegData={eegData} blinkEvents={blinkEvents} />

      <BlinkStats blinkEvents={blinkEvents} stats={fatigueStats} />
    </div>
  );
}

export default App;