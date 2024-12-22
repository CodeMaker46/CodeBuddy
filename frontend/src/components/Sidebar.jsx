// src/components/Sidebar.jsx
import React from "react";
import RoomInfo from "./RoomInfo";
import UserList from "./UserList";
import LanguageSelector from "./LanguageSelector";
import LeaveRoom from "./LeaveRoom";

const Sidebar = ({ roomId, users , language,setLanguage, typing ,setJoined,setUserName,setRoomId,setCode,
}) => {
  return (
    <div className="w-1/5 p-4 bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white rounded-lg shadow-xl h-screen">
      {/* Room Info */}
      <RoomInfo roomId={roomId} />

      {/* User List */}
      <UserList users={users} typing={typing}/>

      {/* Language Selector */}
      <LanguageSelector language={language} setLanguage = {setLanguage} roomId={roomId}/>

      <LeaveRoom
      setJoined={setJoined}
      setUserName={setUserName}
      setRoomId={setRoomId}
      setCode={setCode}
      setLanguage={setLanguage}
    />
    </div>
  );
};

export default Sidebar;
