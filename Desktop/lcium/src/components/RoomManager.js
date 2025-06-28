import React, { useEffect, useState } from 'react';
import socketService from '../services/socketService';
import './RoomManager.css';

const RoomManager = ({ onRoomJoined, currentRoom, connectedUsers = [] }) => {
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const checkConnection = () => {
      const connected = socketService.getConnectionStatus();
      setIsConnected(connected);
      
      // Update debug info
      if (process.env.NODE_ENV === 'development') {
        setDebugInfo(socketService.getDebugInfo());
      }
    };
    
    checkConnection(); // Initial check
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const validateRoomId = (id) => {
    const cleanId = id.trim().toUpperCase();
    if (cleanId.length === 0) return { valid: false, error: 'Please enter a room ID' };
    if (cleanId.length !== 6) return { valid: false, error: 'Room ID must be 6 characters' };
    if (!/^[A-Z0-9]+$/.test(cleanId)) return { valid: false, error: 'Room ID can only contain letters and numbers' };
    return { valid: true, error: '' };
  };

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setInputError('');
    
    if (!isConnected) {
      setInputError('Not connected to server. Please check your connection.');
      setIsLoading(false);
      return;
    }
    
    try {
      const newRoomId = await socketService.createRoom();
      handleJoinRoom(newRoomId);
    } catch (error) {
      console.error('Failed to create room:', error);
      setInputError(`Failed to create room: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleJoinRoom = (targetRoomId = roomId) => {
    const cleanRoomId = targetRoomId.trim().toUpperCase();
    const validation = validateRoomId(cleanRoomId);
    
    if (!validation.valid) {
      setInputError(validation.error);
      return;
    }

    if (!isConnected) {
      setInputError('Not connected to server. Please check your connection.');
      return;
    }

    setInputError('');
    const success = socketService.joinRoom(cleanRoomId);
    
    if (success) {
      onRoomJoined(cleanRoomId);
      setShowRoomDialog(false);
      setRoomId('');
    } else {
      setInputError('Failed to join room. Connection lost.');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setRoomId(value);
      setInputError('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && roomId.trim()) {
      e.preventDefault();
      handleJoinRoom();
    }
  };

  const handleLeaveRoom = () => {
    socketService.disconnect();
    onRoomJoined(null);
  };

  const copyRoomId = async () => {
    if (currentRoom) {
      try {
        await navigator.clipboard.writeText(currentRoom);
        // Visual feedback for successful copy
        const element = document.querySelector('.room-id');
        if (element) {
          element.style.background = 'rgba(76, 175, 80, 0.2)';
          element.style.color = '#4CAF50';
          setTimeout(() => {
            element.style.background = '';
            element.style.color = '';
          }, 1000);
        }
      } catch (err) {
        // Fallback for browsers that don't support clipboard API
        console.log('Clipboard not available, showing alert');
        alert(`Room ID: ${currentRoom}\n\nCopy this ID to share with others!`);
      }
    }
  };

  const handleDialogClose = () => {
    setShowRoomDialog(false);
    setRoomId('');
    setInputError('');
  };

  const showDebugInfo = () => {
    if (debugInfo) {
      alert(`Debug Info:\n${JSON.stringify(debugInfo, null, 2)}`);
    }
  };

  return (
    <div className="room-manager">
      {/* Connection Status */}
      <div 
        className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
        onClick={process.env.NODE_ENV === 'development' ? showDebugInfo : undefined}
        title={process.env.NODE_ENV === 'development' ? 'Click for debug info' : undefined}
      >
        <div className="status-indicator"></div>
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      {/* Room Controls */}
      {!currentRoom ? (
        <button 
          className="room-button primary"
          onClick={() => setShowRoomDialog(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Join/Create Room
        </button>
      ) : (
        <div className="room-info">
          <div className="room-details">
            <span className="room-label">Room:</span>
            <span className="room-id" onClick={copyRoomId} title="Tap to copy">
              {currentRoom}
            </span>
          </div>
          
          <div className="user-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''}
          </div>

          <button 
            className="room-button secondary"
            onClick={handleLeaveRoom}
            title="Leave Room"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Room Dialog */}
      {showRoomDialog && (
        <div className="room-dialog-overlay" onClick={handleDialogClose}>
          <div className="room-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Join or Create Room</h3>
            
            {!isConnected && (
              <div className="connection-warning">
                ⚠️ Not connected to server. Please check your internet connection.
              </div>
            )}
            
            <div className="dialog-content">
              <div className="input-group">
                <label>Enter Room ID (6 characters)</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="ABC123"
                  maxLength={6}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                  inputMode="text"
                  className={inputError ? 'error' : ''}
                  autoFocus={false}
                  disabled={!isConnected}
                />
                {inputError && <span className="input-error">{inputError}</span>}
                <div className="input-hint">
                  Room ID: 6 characters (letters and numbers only)
                </div>
              </div>

              <div className="dialog-actions">
                <button 
                  className="dialog-button primary"
                  onClick={handleCreateRoom}
                  disabled={isLoading || !isConnected}
                >
                  {isLoading ? 'Creating...' : 'Create New Room'}
                </button>
                
                <button 
                  className="dialog-button secondary"
                  onClick={() => handleJoinRoom()}
                  disabled={!roomId.trim() || isLoading || inputError || !isConnected}
                >
                  Join Room
                </button>
                
                <button 
                  className="dialog-button"
                  onClick={handleDialogClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManager; 