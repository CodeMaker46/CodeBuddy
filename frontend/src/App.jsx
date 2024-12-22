import React, { useState, useEffect } from "react";
import Form from "./components/Form";
import Sidebar from "./components/Sidebar";
import socket from "./utils/socket";
import Editor from "@monaco-editor/react";

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("//start code here");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState([]);
  const [typingTimeouts, setTypingTimeouts] = useState({});

  const handleJoin = (roomId, userName) => {
    // Emit the join event to the server
    socket.emit("join", { roomId: roomId, userName });
    // Set the user as joined
    setRoomId(roomId);
    setUserName(userName);
    setJoined(true);
  };



  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  useEffect(() => {
    socket.on("userJoined", (users) => {
      console.log("Users in the room: ", users);
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      // Add the user to typing list if they are not already typing
      setTyping((prevTyping) => {
        if (!prevTyping.includes(user)) {
          return [...prevTyping, user];
        }
        return prevTyping;
      });

      // Clear any previous timeout for this user if they are typing again
      if (typingTimeouts[user]) {
        clearTimeout(typingTimeouts[user]);
      }

      // Set a timeout to remove the user from the typing list after 2 seconds
      const timeoutId = setTimeout(() => {
        setTyping((prevTyping) => prevTyping.filter((typingUser) => typingUser !== user));
      }, 1500);

      // Store the timeout ID for this user
      setTypingTimeouts((prev) => ({
        ...prev,
        [user]: timeoutId,
      }));
    });


    socket.on("langaugeUpdate", (newLanguage) => {
      setLanguage(newLanguage); // Update language when the event is received
    });

    // Cleanup the socket event when the component is unmounted
    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageChange");
    };
  }, [typingTimeouts]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup the event listener
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    // Dynamically load languages when the selected language changes
    if (language === "python") {
      import("monaco-editor/esm/vs/basic-languages/python/python.contribution").then(() => {
        console.log("Python language support loaded");
      });
    } else if (language === "java") {
      import("monaco-editor/esm/vs/basic-languages/java/java.contribution").then(() => {
        console.log("Java language support loaded");
      });
    } else if (language === "cpp") {
      import("monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution").then(() => {
        console.log("C++ language support loaded");
      });
    } else if (language === "javascript") {
      import("monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution").then(() => {
        console.log("JavaScript language support loaded");
      });
    }

    // Add more languages as needed...
  }, [language]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Form only if the user hasn't joined */}
      {!joined ? (
        <div className="w-full">
          <Form
            roomId={roomId}
            userName={userName}  // Pass the state as a prop
            setRoomId={setRoomId}
            setUserName={setUserName}
            handleJoin={handleJoin}  // Pass the function to handle form submission
          />
        </div>
      ) : (
        <div className="flex w-full">
          {/* Sidebar with room info, user list, and language selector */}
          <Sidebar
            roomId={roomId}
            users={users}
            setUsers={setUsers}
            setLanguage={setLanguage}
            language={language}
            typing={typing}
            setJoined={setJoined}
            setUserName={setUserName}
            setRoomId={setRoomId}
            setCode={setCode}
          />

          {/* Main content area (Code Editor, etc.) */}
          <div className="w-3/4 p-4">
            <h1 className="text-2xl font-semibold text-center">Welcome to Room {roomId}</h1>
            <p className="mt-4 text-lg text-center">
              Hello, <span className="font-bold">{userName}</span>! Start coding below.
            </p>

            {/* You can add your Code Editor component here */}
            <Editor
              language={language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 16,
              }}
            />

            
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
