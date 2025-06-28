import React, { useEffect, useState } from 'react';
import socketService from '../services/socketService';

const ConnectionTest = () => {
  const [connectionInfo, setConnectionInfo] = useState({});
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const runTests = async () => {
      const results = [];
      
      // Test 1: Check if socketService exists
      results.push({
        test: 'Socket Service',
        status: socketService ? 'PASS' : 'FAIL',
        details: socketService ? 'Service loaded' : 'Service not found'
      });

      // Test 2: Get debug info
      const debugInfo = socketService.getDebugInfo();
      results.push({
        test: 'Debug Info',
        status: debugInfo ? 'PASS' : 'FAIL',
        details: JSON.stringify(debugInfo, null, 2)
      });

      // Test 3: Test server URL
      const serverUrl = socketService.getServerUrl();
      results.push({
        test: 'Server URL',
        status: serverUrl ? 'PASS' : 'FAIL',
        details: serverUrl
      });

      // Test 4: Test API endpoint
      try {
        const response = await fetch(`${serverUrl}/api/health`);
        const data = await response.json();
        results.push({
          test: 'API Health Check',
          status: response.ok ? 'PASS' : 'FAIL',
          details: JSON.stringify(data, null, 2)
        });
      } catch (error) {
        results.push({
          test: 'API Health Check',
          status: 'FAIL',
          details: error.message
        });
      }

      // Test 5: Connection status
      const isConnected = socketService.getConnectionStatus();
      results.push({
        test: 'Socket Connection',
        status: isConnected ? 'PASS' : 'FAIL',
        details: isConnected ? 'Connected' : 'Disconnected'
      });

      setTestResults(results);
      setConnectionInfo(debugInfo || {});
    };

    runTests();
    const interval = setInterval(runTests, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const testCreateRoom = async () => {
    try {
      const roomId = await socketService.createRoom();
      alert(`Room created successfully: ${roomId}`);
    } catch (error) {
      alert(`Failed to create room: ${error.message}`);
    }
  };

  const testJoinRoom = () => {
    const roomId = prompt('Enter room ID to test:');
    if (roomId) {
      const success = socketService.joinRoom(roomId);
      alert(success ? 'Join room success' : 'Join room failed');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 10000
    }}>
      <h2>RTC Connection Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results:</h3>
        {testResults.map((result, index) => (
          <div key={index} style={{
            padding: '8px',
            margin: '4px 0',
            backgroundColor: result.status === 'PASS' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.status === 'PASS' ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px'
          }}>
            <strong>{result.test}:</strong> 
            <span style={{ color: result.status === 'PASS' ? 'green' : 'red' }}>
              {result.status}
            </span>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {result.details}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Connection Info:</h3>
        <pre style={{ 
          background: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(connectionInfo, null, 2)}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={testCreateRoom} style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Test Create Room
        </button>
        
        <button onClick={testJoinRoom} style={{
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Test Join Room
        </button>
        
        <button onClick={() => window.location.reload()} style={{
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Close Test
        </button>
      </div>
    </div>
  );
};

export default ConnectionTest; 