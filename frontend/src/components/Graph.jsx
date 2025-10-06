// frontend/src/components/Graph.jsx
import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
// Import the date adapter to enable the time-series axis
import 'chartjs-adapter-date-fns';

// <-- MODIFIED: Accept the new blinkEvents prop
export default function Graph({ eegData = [], blinkEvents = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Initialize the chart
    if (canvasRef.current && !chartInstance.current) {
      chartInstance.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          // Labels are not needed when using a timeseries axis
          datasets: [
            {
              label: "EEG Signal",
              data: [],
              borderColor: "blue",
              borderWidth: 1.5,
              pointRadius: 0,
            },
            // <-- ADDED: A new dataset just for blink markers
            {
              label: 'Blinks',
              data: [],
              type: 'scatter',
              backgroundColor: 'rgba(255, 0, 0, 0.7)',
              pointRadius: 6,
              pointHoverRadius: 8,
            }
          ],
        },
        options: {
          animation: false,
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            // <-- MODIFIED: Configure the x-axis for time series
            x: {
              type: 'timeseries',
              display: true,
              time: {
                unit: 'second',
                displayFormats: {
                  second: 'HH:mm:ss' // Format: Hour:Minute:Second
                }
              },
              ticks: {
                source: 'auto',
                maxRotation: 0,
                autoSkip: true,
              }
            },
            y: { 
              min: -500, 
              max: 500 
            },
          },
        },
      });
    }

    // Cleanup function to destroy chart on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []); // Empty dependency array means this runs only once on mount

  // <-- MODIFIED: This useEffect now also depends on blinkEvents
  useEffect(() => {
    if (chartInstance.current) {
      const chart = chartInstance.current;
      
      // Update the main EEG signal line
      chart.data.datasets[0].data = eegData;

      // <-- ADDED: Logic to create the marker data points
      const blinkMarkers = blinkEvents.map(blink => {
        // Find the corresponding data point for the blink's timestamp
        const dataPoint = eegData.find(d => d.x === blink.ts);
        // If found, return a point for the scatter plot
        return dataPoint ? { x: dataPoint.x, y: dataPoint.y } : null;
      }).filter(p => p !== null); // Filter out any nulls if the point is not in the current window

      // Update the blink marker dataset
      chart.data.datasets[1].data = blinkMarkers;
      
      chart.update("none"); // "none" prevents animation for smoother rendering
    }
  }, [eegData, blinkEvents]); // <-- MODIFIED: Add blinkEvents to the dependency array

  return <div style={{height: '400px'}}><canvas ref={canvasRef}></canvas></div>;
}