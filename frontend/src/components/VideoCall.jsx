import React, { useEffect, useRef, useState } from 'react';
import socket from '../utils/socket';

const VideoCall = ({ roomId }) => {
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRefs = useRef([]);

  useEffect(() => {
    // Get user media (video/audio)
    const getUserMedia = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
        localVideoRef.current.srcObject = userStream;
        
        socket.emit("joinRoom", roomId);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    getUserMedia();

    socket.on("userJoined", (newUser) => {
      // Handle when a new user joins the room
      connectToNewUser(newUser);
    });

    socket.on("userLeft", (userId) => {
      // Handle when a user leaves the room
      setPeers((prevPeers) => prevPeers.filter((peer) => peer.id !== userId));
    });

    return () => {
      // Cleanup on component unmount
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [roomId, stream]);

  const connectToNewUser = (userId) => {
    // Connect to new user by setting up WebRTC connection
    const peer = new RTCPeerConnection();

    peer.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        socket.emit("newICECandidate", { userId, candidate: event.candidate });
      }
    });

    peer.addEventListener("track", (event) => {
      if (event.track.kind === "video") {
        remoteVideoRefs.current[userId].srcObject = event.streams[0];
      }
    });

    stream?.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.createOffer().then((offer) => {
      peer.setLocalDescription(offer);
      socket.emit("sendOffer", { userId, offer });
    });

    setPeers((prevPeers) => [...prevPeers, { id: userId, peer }]);
  };

  const handleMute = () => {
    const tracks = stream?.getTracks();
    tracks?.forEach((track) => {
      if (track.kind === "audio") {
        track.enabled = !isMuted;
      }
    });
    setIsMuted(!isMuted);
  };

  return (
    <div className="video-call-container">
      <div className="local-video">
        <video ref={localVideoRef} autoPlay muted></video>
      </div>
      {peers.map((peer) => (
        <div key={peer.id} className="peer-video">
          <video ref={(el) => (remoteVideoRefs.current[peer.id] = el)} autoPlay></video>
        </div>
      ))}
      <button onClick={handleMute}>{isMuted ? "Unmute" : "Mute"}</button>
    </div>
  );
};

export default VideoCall;
