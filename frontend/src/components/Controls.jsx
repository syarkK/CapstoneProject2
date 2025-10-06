// frontend/src/components/Controls.jsx

// I've renamed the component from EEGDashboard to Controls for clarity
export default function Controls({ socket }) {

  const startRecording = () => {
    if (socket) {
      // Send a JSON message to the server
      socket.send(JSON.stringify({ command: 'start-recording' }));
      console.log('Sent start-recording command');
    }
  };

  const stopRecording = () => {
    if (socket) {
      socket.send(JSON.stringify({ command: 'stop-recording' }));
      console.log('Sent stop-recording command');
    }
  };

  return (
    <div style={{ margin: '20px 0' }}>
      <button onClick={startRecording}>
        Start Record
      </button>
      <button onClick={stopRecording} style={{ marginLeft: 10 }}>
        Stop
      </button>
      {/* The server now handles saving, so we don't need a client-side export */}
    </div>
  );
}