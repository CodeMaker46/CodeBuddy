import React, { useRef, useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";

const VoiceChat = ({ socket, roomId, userName }) => {
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [callStatus, setCallStatus] = useState('idle');
    const [micPermissionStatus, setMicPermissionStatus] = useState(null);
    const [participants, setParticipants] = useState(new Set());
    
    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const audioElements = useRef({});
    
    const configuration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        if (!socket || !roomId || !userName) return;

        // Set up socket listeners
        const setupSocketListeners = () => {
            socket.on("webrtc-offer", handleWebRTCOffer);
            socket.on("webrtc-answer", handleWebRTCAnswer);
            socket.on("webrtc-ice-candidate", handleICECandidate);
            socket.on("userJoinedCall", handleUserJoined);
            socket.on("userLeftCall", handleUserLeft);
        };

        setupSocketListeners();

        return () => {
            socket.off("webrtc-offer", handleWebRTCOffer);
            socket.off("webrtc-answer", handleWebRTCAnswer);
            socket.off("webrtc-ice-candidate", handleICECandidate);
            socket.off("userJoinedCall", handleUserJoined);
            socket.off("userLeftCall", handleUserLeft);
            cleanupAllConnections();
        };
    }, [socket, roomId, userName]);

    const handleUserJoined = async ({ userName: joinedUser }) => {
        if (joinedUser === userName) return;
        console.log(`User joined: ${joinedUser}`);
        
        setParticipants(prev => new Set([...prev, joinedUser]));

        // If we're already in a call, create a connection with the new participant
        if (isInCall && localStreamRef.current) {
            try {
                const peerConnection = createPeerConnection(joinedUser);
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                socket.emit("webrtc-offer", {
                    roomId,
                    offer,
                    sender: userName,
                    receiver: joinedUser
                });
            } catch (error) {
                console.error("Error creating offer for new participant:", error);
            }
        }
    };

    const handleUserLeft = (data) => {
        const { userName: leftUser } = data;
        console.log(`User left: ${leftUser}`);
        cleanupPeerConnection(leftUser);
        setParticipants(prev => {
            const newParticipants = new Set(prev);
            newParticipants.delete(leftUser);
            return newParticipants;
        });
    };

    const handleWebRTCOffer = async ({ offer, sender }) => {
        try {
            console.log(`Received offer from ${sender}`);
            let peerConnection = peerConnectionsRef.current[sender];
            
            if (peerConnection) {
                await peerConnection.close();
            }
            
            peerConnection = createPeerConnection(sender);
            
            if (!localStreamRef.current) {
                const success = await initLocalStream();
                if (!success) return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            socket.emit("webrtc-answer", {
                roomId,
                answer,
                sender: userName,
                receiver: sender
            });
        } catch (error) {
            console.error("Error handling offer:", error);
        }
    };

    const handleWebRTCAnswer = async ({ answer, sender }) => {
        try {
            console.log(`Received answer from ${sender}`);
            const peerConnection = peerConnectionsRef.current[sender];
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error("Error handling answer:", error);
        }
    };

    const handleICECandidate = async ({ candidate, sender }) => {
        try {
            const peerConnection = peerConnectionsRef.current[sender];
            if (peerConnection) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error("Error handling ICE candidate:", error);
        }
    };

    const createPeerConnection = (peerId) => {
        try {
            console.log(`Creating peer connection for ${peerId}`);
            const peerConnection = new RTCPeerConnection(configuration);
            
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("webrtc-ice-candidate", {
                        roomId,
                        candidate: event.candidate,
                        sender: userName,
                        receiver: peerId
                    });
                }
            };

            peerConnection.ontrack = (event) => {
                console.log(`Received track from ${peerId}`);
                const stream = event.streams[0];
                if (!audioElements.current[peerId]) {
                    const audio = new Audio();
                    audio.autoplay = true;
                    audio.playsInline = true;
                    audio.srcObject = stream;
                    audio.play().catch(error => console.error("Error playing audio:", error));
                    audioElements.current[peerId] = audio;
                }
            };

            // Add local tracks to the connection
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStreamRef.current);
                });
            }

            peerConnectionsRef.current[peerId] = peerConnection;
            return peerConnection;
        } catch (error) {
            console.error("Error creating peer connection:", error);
            return null;
        }
    };

    const initLocalStream = async () => {
        try {
            if (!localStreamRef.current) {
                setMicPermissionStatus('requesting');
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Start with audio track disabled (muted)
                stream.getAudioTracks().forEach(track => {
                    track.enabled = false;
                });
                localStreamRef.current = stream;
                setMicPermissionStatus('granted');
            }
            return true;
        } catch (error) {
            console.error("Error accessing microphone:", error);
            setMicPermissionStatus('denied');
            alert("Microphone access is required for voice chat. Please grant permission and try again.");
            return false;
        }
    };

    const initiateCall = async () => {
        setCallStatus('connecting');
        try {
            // Make sure we start fresh
            cleanupAllConnections();
            
            const success = await initLocalStream();
            if (!success) {
                setCallStatus('idle');
                return;
            }

            // Join the call
            socket.emit("joinCall", { roomId, userName });
            setIsInCall(true);
            setCallStatus('connected');
            
            // Create offers for all existing participants
            const participantsArray = Array.from(participants);
            console.log(`Creating offers for existing participants: ${participantsArray.join(', ')}`);
            
            for (const participant of participantsArray) {
                if (participant !== userName) {
                    const peerConnection = createPeerConnection(participant);
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    
                    socket.emit("webrtc-offer", {
                        roomId,
                        offer,
                        sender: userName,
                        receiver: participant
                    });
                }
            }
            
        } catch (error) {
            console.error("Error starting call:", error);
            setCallStatus('idle');
            alert("Failed to start call. Please try again.");
        }
    };

    const cleanupPeerConnection = (peerId) => {
        console.log(`Cleaning up peer connection for ${peerId}`);
        if (peerConnectionsRef.current[peerId]) {
            peerConnectionsRef.current[peerId].close();
            delete peerConnectionsRef.current[peerId];
        }
        if (audioElements.current[peerId]) {
            audioElements.current[peerId].srcObject = null;
            delete audioElements.current[peerId];
        }
    };

    const cleanupAllConnections = () => {
        Object.keys(peerConnectionsRef.current).forEach(cleanupPeerConnection);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        peerConnectionsRef.current = {};
        audioElements.current = {};
        setMicPermissionStatus(null);
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const endCall = () => {
        socket.emit("leaveCall", { roomId, userName });
        cleanupAllConnections();
        setIsInCall(false);
        setCallStatus('idle');
    };

    return (
        <div className="voice-chat mt-3 rounded-lg">
            {/* <h3 className="text-lg font-bold mb-4">Voice Chat</h3> */}
            <div className="flex gap-2">
                {!isInCall ? (
                    <button
                        onClick={initiateCall}
                        disabled={callStatus === 'connecting' || micPermissionStatus === 'denied'}
                        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center font-semibold shadow-lg"
                    >
                        {callStatus === 'connecting' ? (
                            <>
                                <span className="animate-spin">⌛</span>
                                Connecting...
                            </>
                        ) : (
                            'Voice Call'
                        )}
                    </button>
                ) : (
                    <div className="w-full flex gap-2 flex-col">
                        <button
                            onClick={toggleMute}
                            className="py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2"
                        >
                            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                            {isMuted ? "Unmute" : "Mute"}
                        </button>
                        <button
                            onClick={endCall}
                            className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2"
                        >
                            <PhoneOff size={16} />
                            End Call
                        </button>
                    </div>

                )}
            </div>
            {micPermissionStatus === 'denied' && (
                <p className="mt-2 text-sm text-red-500">
                    Microphone access denied. Please check your browser settings and grant permission to use voice chat.
                </p>
            )}
        </div>
    );
};

export default VoiceChat;