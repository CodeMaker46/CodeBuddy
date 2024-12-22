import React from "react";

const RoomInfo = ({ roomId }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => alert("Room ID copied to clipboard!"))
      .catch((error) => console.error("Failed to copy the room ID:", error));
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-xl font-semibold mb-2">Room Information</h2>
      <div className="flex items-center justify-between">
        <span className="text-lg">Room ID: {roomId}</span>
        <button
          onClick={copyToClipboard}
          className="ml-4 py-2 px-4 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 transition duration-200 rounded-lg text-white font-semibold shadow-lg"
        >
          Copy Room ID
        </button>
      </div>
      
    </div>
  );
};

export default RoomInfo;
