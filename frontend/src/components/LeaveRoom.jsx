import React from 'react'
import socket from '../utils/socket';


const LeaveRoom = ({setJoined,setUserName,setRoomId,setCode,setLanguage}) => {

    const handleLeave = () => {
        // Emit the leave event to the server
        socket.emit("leaveRoom");
        setJoined(false)
        setUserName("")
        setRoomId("")
        setCode("//start code here")
    };

  return (
    <div>
            {/* Leave button */}
        <button
            onClick={handleLeave}
            className="mt-4 w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
        >
            Leave Room
        </button>
    </div>
  )
}

export default LeaveRoom