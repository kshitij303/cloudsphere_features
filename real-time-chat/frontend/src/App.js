import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('http://localhost:5000');

function App() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState({});
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const userVideo = useRef();
  const partnerVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    socket.on('receiveMessage', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('usersList', (users) => {
      setUsers(users);
    });

    socket.on('incomingCall', (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('usersList');
      socket.off('incomingCall');
    };
  }, []);

  const registerUser = () => {
    if (username.trim()) {
      socket.emit('registerUser', username);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit('sendMessage', { username, message });
      setMessage('');
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(stream);
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  };

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', { userToCall: id, signalData: data, from: socket.id });
    });

    peer.on('stream', (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', { signal: data, to: caller });
    });

    peer.on('stream', (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Real-Time Chat & Video Call</h2>

      {/* Username Input */}
      <input 
        type="text" 
        placeholder="Enter your username" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
      />
      <button onClick={registerUser}>Set Username</button>

      {/* Online Users List */}
      <h3>Online Users</h3>
      <ul>
        {Object.keys(users).map((id) => (
          id !== socket.id && (
            <li key={id}>
              {users[id]} 
              <button onClick={() => callUser(id)}>Call</button>
            </li>
          )
        ))}
      </ul>

      {/* Chat Messages */}
      <div>
        {messages.map((msg, index) => (
          <p key={index}><b>{msg.username}:</b> {msg.message}</p>
        ))}
      </div>

      {/* Chat Input */}
      <input 
        type="text" 
        value={message} 
        onChange={(e) => setMessage(e.target.value)} 
        placeholder="Type a message..." 
      />
      <button onClick={sendMessage}>Send</button>

      <hr />

      {/* Video Call Buttons */}
      <button onClick={startVideo}>Start Video</button>

      {/* Video Displays */}
      {stream && <video playsInline muted ref={userVideo} autoPlay style={{ width: '300px' }} />}
      {callAccepted && <video playsInline ref={partnerVideo} autoPlay style={{ width: '300px' }} />}

      {/* Incoming Call UI */}
      {receivingCall ? (
        <div>
          <h4>Incoming Call...</h4>
          <button onClick={answerCall}>Accept Call</button>
        </div>
      ) : null}
    </div>
  );
}

export default App;
