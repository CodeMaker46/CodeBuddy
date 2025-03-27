import React from "react";

const RoomInfo = ({ roomId }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => alert("Room ID copied to clipboard!"))
      .catch((error) => console.error("Failed to copy the room ID:", error));
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <div className="flex items-center justify-between">
        <span className="text-lg">Room ID: {roomId}</span>
        <button
          onClick={copyToClipboard}
          className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center font-semibold shadow-lg"
        >
          Copy ID
        </button>
      </div>
      
    </div>
  );
};

export default RoomInfo;
