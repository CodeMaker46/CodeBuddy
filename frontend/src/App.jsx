import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import socket from './utils/socket'; // Assuming you have a socket instance
import Form from './components/Form';
import Sidebar from './components/Sidebar';
import Editor from '@monaco-editor/react';
import Whiteboard from './components/Whiteboard';

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Start coding here...');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState([]);
  const [showWhiteBoard, setShowWhiteBoard] = useState(false);

  //const userVideoRef = useRef(null);
  //const peerConnections = useRef({});

  // useEffect(() => {
  //   if (joined) {
  //     startVideoStream();
  //   }
  //   return () => {
  //     stopVideoStream();
  //   };
  // }, [joined]);

  // const startVideoStream = async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({
  //       video: true,
  //       audio: true,
  //     });

  //     if (userVideoRef.current) {
  //       userVideoRef.current.srcObject = stream;
  //     }

  //     peerConnections.current.localStream = stream;
  //   } catch (err) {
  //     console.error('Error accessing media devices.', err);
  //   }
  // };

  // const stopVideoStream = () => {
  //   const stream = peerConnections.current.localStream;
  //   if (stream) {
  //     const tracks = stream.getTracks();
  //     tracks.forEach((track) => track.stop());
  //   }
  // };

  const handleJoin = (roomId, userName) => {
    socket.emit('join', { roomId, userName });
    setRoomId(roomId);
    setUserName(userName);
    setJoined(true);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit('codeChange', { roomId, code: newCode });
    socket.emit('typing', { roomId, userName });
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    socket.emit('languageChange', { roomId, language: newLanguage });
  };

  const handleRunCode = async () => {
    try {
      const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': 'f9eb67ee20mshbc9cb68f5e49379p1c234fjsne0d501c9daed', // Replace with your actual API key
        },
        body: JSON.stringify({
          language_id: getLanguageId(language),
          source_code: code,
          stdin: input,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOutput(data.stdout || data.stderr || 'No output produced.');
      } else {
        setOutput(`Error: ${data.message || 'An error occurred while executing the code.'}`);
      }
    } catch (error) {
      console.error('Error running code:', error);
      setOutput('An error occurred while executing the code.');
    }
  };

  const getLanguageId = (language) => {
    const languages = {
      javascript: 63,
      python: 71,
      java: 62,
      c: 50,
      cpp: 54,
    };
    return languages[language.toLowerCase()] || 63; // Default to JavaScript if unknown
  };

  // const toggleVideo = () => {
  //   setVideoOn((prev) => !prev);
  //   if (peerConnections.current.localStream) {
  //     const videoTrack = peerConnections.current.localStream.getVideoTracks()[0];
  //     videoTrack.enabled = !videoTrack.enabled;
  //   }
  // };

  // const toggleAudio = () => {
  //   setAudioOn((prev) => !prev);
  //   if (peerConnections.current.localStream) {
  //     const audioTrack = peerConnections.current.localStream.getAudioTracks()[0];
  //     audioTrack.enabled = !audioTrack.enabled;
  //   }
  // };

  useEffect(() => {
    socket.on('userJoined', (roomUsers) => {
      setUsers(roomUsers);
    });

    socket.on('userTyping', (userName) => {
      setTyping((prevTyping) => [...prevTyping, userName]);
      setTimeout(() => {
        setTyping((prevTyping) => prevTyping.filter((user) => user !== userName));
      }, 3000); // Clear after 3 seconds
    });

    socket.on('codeUpdate', (newCode) => {
      setCode(newCode);
    });

    socket.on('languageUpdate', (newLanguage) => {
      setLanguage(newLanguage);
    });

    return () => {
      socket.off('userJoined');
      socket.off('userTyping');
      socket.off('codeUpdate');
      socket.off('languageUpdate');
    };
  }, [roomId]);

  return (
    <Router>
      <div className="flex min-h-screen bg-black text-white">
        {!joined ? (
          <div className="w-full">
            <Form
              roomId={roomId}
              userName={userName}
              setRoomId={setRoomId}
              setUserName={setUserName}
              handleJoin={handleJoin}
            />
          </div>
        ) : (
          <div className="flex w-full">
            <Sidebar
              roomId={roomId}
              users={users}
              setUsers={setUsers}
              setLanguage={handleLanguageChange}
              language={language}
              typing={typing}
              setJoined={setJoined}
              setUserName={setUserName}
              setRoomId={setRoomId}
              setCode={setCode}
              setShowWhiteBoard={setShowWhiteBoard}
              showWhiteBoard={showWhiteBoard}
              // handleJoinCall={handleJoinCall}
            />
            <div className="w-3/4 p-4 flex flex-col gap-4 relative">
              {showWhiteBoard ? (
                <Whiteboard socket={socket} roomId={roomId} />
              ) : (
                <>
                  <h1 className="text-2xl font-semibold text-center">Welcome to Room {roomId}</h1>
                  <p className="text-lg text-center">
                    Hello, <span className="font-bold">{userName}</span>! Start coding below.
                  </p>
                  <Editor
                    language={language}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 16,
                    }}
                    height="400px"
                  />
                  <div>
                    <p className="mb-3">Input</p>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full p-2 mt-2 bg-gray-700 rounded-lg text-white"
                      rows="4"
                      placeholder="Enter input for your code here..."
                    />
                  </div>
                  <button
                    onClick={handleRunCode}
                    className="py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold shadow-lg"
                  >
                    Run Code
                  </button>
                  <p>Output</p>
                  <div
                    className="w-full p-2 mt-1 bg-gray-800 rounded-lg text-white overflow-y-auto max-h-40"
                    dangerouslySetInnerHTML={{
                      __html: (output || 'The output will be displayed here...').replace(/\n/g, '<br />'),
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;