// src/components/Sidebar/LanguageSelector.jsx
import React, { useEffect } from "react";
import socket from "../utils/socket";



const LanguageSelector = ({ roomId, language, setLanguage }) => {
  
    const handleLanguageChange = (event) => {
      const newLanguage = event.target.value
        setLanguage(newLanguage);
        // Optionally, emit to the server to notify about the language change
        socket.emit("languageChange",{roomId, language : newLanguage })
    };    

    useEffect(() => {
    console.log("Current language:", language);
    }, [language]); 
  

  

  return (
    <div>
      <h2 className="text-xl font-bold">Select Language</h2>
      <select
        onChange={handleLanguageChange}
        value={language}
        className="mt-2 p-2 bg-gray-700 text-white rounded-lg w-full"
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
        {/* Add more languages as needed */}
      </select>

      
    </div>
  );
};

export default LanguageSelector;
