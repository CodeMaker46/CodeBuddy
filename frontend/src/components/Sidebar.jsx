import React from "react";
import PropTypes from "prop-types";
import RoomInfo from "./RoomInfo";
import UserList from "./UserList";
import LanguageSelector from "./LanguageSelector";
import LeaveRoom from "./LeaveRoom";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const Sidebar = ({
  roomId,
  users,
  language,
  setLanguage,
  typing,
  setJoined,
  setUserName,
  setRoomId,
  setCode,
}) => {
  const navigate = useNavigate(); // Hook for navigation

  const handleWhiteboardNavigation = () => {
    navigate("/whiteboard"); // Navigate to the whiteboard page
  };

  return (
    <div
      className="sticky top-0 w-full sm:w-1/3 md:w-1/4 lg:w-1/5 p-4 bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white rounded-lg shadow-xl h-screen"
      role="complementary"
      aria-label="Sidebar Navigation"
    >
      {/* Room Info */}
      <RoomInfo roomId={roomId} />

      {/* User List */}
      <UserList users={users} typing={typing} />

      {/* Language Selector */}
      <LanguageSelector language={language} setLanguage={setLanguage} roomId={roomId} />

      {/* Leave Room */}
      <LeaveRoom
        setJoined={setJoined}
        setUserName={setUserName}
        setRoomId={setRoomId}
        setCode={setCode}
        setLanguage={setLanguage}
      />

      {/* Whiteboard Button */}
      <button
        onClick={handleWhiteboardNavigation}
        className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center font-semibold shadow-lg"
      >
        Open Whiteboard
      </button>
    </div>
  );
};

Sidebar.defaultProps = {
  users: [],
  typing: null,
  language: "javascript",
};

Sidebar.propTypes = {
  roomId: PropTypes.string.isRequired,
  users: PropTypes.arrayOf(PropTypes.string),
  typing: PropTypes.arrayOf(PropTypes.string), // Accept an array
  language: PropTypes.string.isRequired,
  setLanguage: PropTypes.func.isRequired,
  setJoined: PropTypes.func.isRequired,
  setUserName: PropTypes.func.isRequired,
  setRoomId: PropTypes.func.isRequired,
  setCode: PropTypes.func.isRequired,
};


export default Sidebar;
