import React from 'react';

const Form = ({ roomId, userName, setRoomId, setUserName, handleJoin }) => {
  const onSubmit = (e) => {
    e.preventDefault();
    // Ensure that userName and roomId are correctly passed to handleJoin
    handleJoin(roomId, userName); 
    
  };

  

  const generateRoomId = async ()=>{
    try {
      const response = await fetch('http://localhost:4000/api/generate-room-id');
      const data = await response.json();
      setRoomId(data.roomId);
    } catch (error) {
      console.error('Error generating room ID:', error);
    }
  }

  return (
    <div>

      {/* heading  */}
      <div className="mt-6"> {/* Add margin-top to move it above */}
        <h2 className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-500">
          Welcome to CodeBuddy
        </h2>
      </div>

      {/* Form */}

      <div className="flex items-center justify-center min-h-screen bg-black text-white flex flex-col items-center justify-center">
      
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black p-8 rounded-3xl shadow-xl w-full max-w-md ">
        
        <h2 className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-500">
          Join a Room
        </h2>
        <form onSubmit={onSubmit} className="space-y-6 mt-6">
          {/* Room ID Input */}
          <div>
            <label
              htmlFor="roomId"
              className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500"
            >
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)} // This updates roomId
              className="w-full p-3 rounded-lg bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Create your room ID"
              required
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={generateRoomId}
                className="py-1 text-green-500 from-gray-800 via-gray-900 to-black hover:text-green-400 focus:outline-none"
              >
                Generate Unique Room Id
              </button>
            </div>
          </div>
          {/* Username Input */}
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500"
            >
              Username
            </label>
            <input
              type="text"
              id="userName"
              value={userName} // This is the value passed from App.jsx
              onChange={(e) => setUserName(e.target.value)} // Updates userName state in App.jsx
              className="w-full p-3 rounded-lg bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Create your username"
              required
            />
          </div>
          {/* Join Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 transition duration-200 transform hover:scale-105 font-semibold shadow-lg text-white"
          >
            Join Now
          </button>
        </form>
      </div>
    </div>


    </div>
  );
};

export default Form;
