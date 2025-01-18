import React, { useRef, useEffect, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";

const VoiceChat = ({ socket, roomId, userName }) => {
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [callStatus, setCallStatus] = useState('idle');
    const [micPermissionStatus, setMicPermissionStatus] = useState(null);
    const [participants, setParticipants] = useState(new Set());
    const [rtcConfiguration, setRTCConfiguration] = useState(null);
    
    const localStreamRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const audioElements = useRef({});

    // Fetch TURN credentials
    useEffect(() => {
        async function fetchTURNCredentials() {
            try {
                const response = await fetch("https://codebuddy.metered.live/api/v1/turn/credentials?apiKey=c954472fb097b2d8edf631497ed4b4730c12");
                const iceServers = await response.json();
                
                setRTCConfiguration({
                    iceServers: [
                        ...iceServers,
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ],
                    iceTransportPolicy: 'all',
                    iceCandidatePoolSize: 10
                });
            } catch (error) {
                console.error('Error fetching TURN credentials:', error);
                setRTCConfiguration({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                });
            }
        }

        fetchTURNCredentials();
    }, []);

    useEffect(() => {
        if (!socket || !roomId || !userName || !rtcConfiguration) return;

        // Request current participants when joining
        socket.emit('requestParticipants', { roomId });

        socket.on("currentParticipants", ({ participants: currentParticipants }) => {
            setParticipants(new Set(currentParticipants.filter(p => p !== userName)));
        });

        socket.on("webrtc-offer", handleWebRTCOffer);
        socket.on("webrtc-answer", handleWebRTCAnswer);
        socket.on("webrtc-ice-candidate", handleICECandidate);
        socket.on("userJoinedCall", handleUserJoined);
        socket.on("userLeftCall", handleUserLeft);

        return () => {
            socket.off("currentParticipants");
            socket.off("webrtc-offer", handleWebRTCOffer);
            socket.off("webrtc-answer", handleWebRTCAnswer);
            socket.off("webrtc-ice-candidate", handleICECandidate);
            socket.off("userJoinedCall", handleUserJoined);
            socket.off("userLeftCall", handleUserLeft);
            cleanupAllConnections();
        };
    }, [socket, roomId, userName, rtcConfiguration]);

    const createPeerConnection = async (peerId) => {
        if (!rtcConfiguration) return null;

        // Clean up existing connection if any
        if (peerConnectionsRef.current[peerId]) {
            cleanupPeerConnection(peerId);
        }

        try {
            const peerConnection = new RTCPeerConnection(rtcConfiguration);
            
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

            peerConnection.onconnectionstatechange = () => {
                console.log(`Connection state for ${peerId}:`, peerConnection.connectionState);
                if (peerConnection.connectionState === 'failed') {
                    cleanupPeerConnection(peerId);
                    // Attempt to reconnect
                    setTimeout(() => {
                        if (isInCall) initiateConnectionWithPeer(peerId);
                    }, 1000);
                }
            };

            peerConnection.ontrack = (event) => {
                const stream = event.streams[0];
                if (!audioElements.current[peerId]) {
                    const audio = new Audio();
                    audio.autoplay = true;
                    audio.playsInline = true;
                    audio.srcObject = stream;
                    
                    const playAudio = async () => {
                        try {
                            await audio.play();
                        } catch (error) {
                            console.error("Error playing audio:", error);
                            document.addEventListener('click', () => {
                                audio.play().catch(console.error);
                            }, { once: true });
                        }
                    };
                    
                    playAudio();
                    audioElements.current[peerId] = audio;
                }
            };

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

    const initiateConnectionWithPeer = async (peerId) => {
        const peerConnection = await createPeerConnection(peerId);
        if (peerConnection) {
            try {
                const offer = await peerConnection.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: false
                });
                await peerConnection.setLocalDescription(offer);
                
                socket.emit("webrtc-offer", {
                    roomId,
                    offer,
                    sender: userName,
                    receiver: peerId
                });
            } catch (error) {
                console.error("Error creating offer for peer", peerId, error);
                cleanupPeerConnection(peerId);
            }
        }
    };

    const handleUserJoined = async ({ userName: joinedUser }) => {
        if (joinedUser === userName) return;
        
        setParticipants(prev => new Set([...prev, joinedUser]));

        if (isInCall && localStreamRef.current) {
            await initiateConnectionWithPeer(joinedUser);
        }
    };

    const handleUserLeft = ({ userName: leftUser }) => {
        cleanupPeerConnection(leftUser);
        setParticipants(prev => {
            const newParticipants = new Set(prev);
            newParticipants.delete(leftUser);
            return newParticipants;
        });
    };

    const handleWebRTCOffer = async ({ offer, sender }) => {
        try {
            if (!localStreamRef.current) {
                const success = await initLocalStream();
                if (!success) return;
            }

            const peerConnection = await createPeerConnection(sender);
            if (!peerConnection) return;

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
            console.error("Error handling offer from", sender, error);
            cleanupPeerConnection(sender);
        }
    };

    const handleWebRTCAnswer = async ({ answer, sender }) => {
        try {
            const peerConnection = peerConnectionsRef.current[sender];
            if (peerConnection && peerConnection.signalingState !== 'closed') {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            }
        } catch (error) {
            console.error("Error handling answer from", sender, error);
            cleanupPeerConnection(sender);
        }
    };

    const handleICECandidate = async ({ candidate, sender }) => {
        try {
            const peerConnection = peerConnectionsRef.current[sender];
            if (peerConnection && peerConnection.signalingState !== 'closed') {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (error) {
            console.error("Error handling ICE candidate from", sender, error);
        }
    };

    const initLocalStream = async () => {
        try {
            if (!localStreamRef.current) {
                setMicPermissionStatus('requesting');
                
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                
                stream.getAudioTracks().forEach(track => {
                    track.enabled = !isMuted;
                });
                
                localStreamRef.current = stream;
                setMicPermissionStatus('granted');
                return true;
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
            cleanupAllConnections();
            
            const success = await initLocalStream();
            if (!success) {
                setCallStatus('idle');
                return;
            }

            socket.emit("joinCall", { roomId, userName });
            setIsInCall(true);
            setCallStatus('connected');
            
            // Initiate connections with all existing participants
            const participantsArray = Array.from(participants);
            for (const participant of participantsArray) {
                await initiateConnectionWithPeer(participant);
            }
        } catch (error) {
            console.error("Error starting call:", error);
            setCallStatus('idle');
            alert("Failed to start call. Please try again.");
        }
    };

    const cleanupPeerConnection = (peerId) => {
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
                audioTrack.enabled = isMuted;
                setIsMuted(!isMuted);
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
            <div className="flex gap-2">
                {!isInCall ? (
                    <button
                        onClick={initiateCall}
                        disabled={callStatus === 'connecting' || micPermissionStatus === 'denied' || !rtcConfiguration}
                        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {!rtcConfiguration ? 'Loading...' : 
                         callStatus === 'connecting' ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⌛</span>
                                Connecting...
                            </span>
                        ) : (
                            'Join Voice Call'
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
            {participants.size > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                    Connected users: {Array.from(participants).join(', ')}
                </div>
            )}
            {micPermissionStatus === 'denied' && (
                <p className="mt-2 text-sm text-red-500">
                    Microphone access denied. Please check your browser settings and grant permission to use voice chat.
                </p>
            )}
        </div>
    );
};

export default VoiceChat;