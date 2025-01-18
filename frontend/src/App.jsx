import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import socket from './utils/socket'; // Assuming you have a socket instance
import Form from './components/Form';
import Sidebar from './components/Sidebar';
import Editor from '@monaco-editor/react';
import Whiteboard from './components/Whiteboard';
import VoiceChat from './components/VoiceChat';
import AICodeAssistant from './components/AICodeAssistant';

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
  const [speaking, setSpeaking] = useState([]);
  const [showWhiteBoard, setShowWhiteBoard] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

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
      <div className="flex min-h-screen bg-black text-white overflow-hidden">
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
          <div className="flex w-full overflow-hidden">
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
              userName={userName}
              socket={socket}
            />
            <div className="flex flex-1 overflow-hidden">
              <div className={`${showWhiteBoard ? 'w-full' : showAIAssistant ? 'w-2/3' : 'w-full'} p-4 flex flex-col gap-4 relative overflow-y-auto`}>
                {/* AI Assistant Toggle Button */}
                {!showWhiteBoard && (
                  <div className="absolute top-2 right-4 z-10">
                    <button
                      onClick={() => setShowAIAssistant(!showAIAssistant)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium shadow-lg transition-all"
                    >
                      {showAIAssistant ? (
                        <>
                          <span>Hide AI Assistant</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Show AI Assistant</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {showWhiteBoard ? (
                  <Whiteboard 
                    socket={socket} 
                    roomId={roomId} 
                  />
                ) : (
                  <>
                    <p className="text-lg text-center mt-12">
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
              {/* AI Assistant Column - Only show when whiteboard is not active and AI is toggled on */}
              {!showWhiteBoard && showAIAssistant && (
                <div className="w-1/3 border-l border-gray-700 p-4 bg-gray-900 overflow-y-auto">
                  <AICodeAssistant editorContent={code} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;