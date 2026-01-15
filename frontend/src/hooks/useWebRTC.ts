/**
 * WebRTC hook for video/audio calls
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

interface UseWebRTCOptions {
    roomId: string;
    userId: string;
    onRemoteStream?: (stream: MediaStream, userId: string) => void;
    onUserJoined?: (userId: string) => void;
    onUserLeft?: (userId: string) => void;
}

export const useWebRTC = ({
    roomId,
    userId,
    onRemoteStream,
    onUserJoined,
    onUserLeft,
}: UseWebRTCOptions) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [participants, setParticipants] = useState<string[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);

    const configuration: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    const createPeerConnection = useCallback((targetUserId: string) => {
        const pc = new RTCPeerConnection(configuration);

        // Add local stream tracks to peer connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'ice_candidate',
                    to_user: targetUserId,
                    signal: {
                        type: 'ice_candidate',
                        candidate: event.candidate,
                    },
                }));
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track from', targetUserId);
            onRemoteStream?.(event.streams[0], targetUserId);
        };

        peerConnectionsRef.current.set(targetUserId, pc);
        return pc;
    }, [onRemoteStream]);

    const startCall = useCallback(async (audio: boolean = true, video: boolean = true) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setIsAudioEnabled(audio);
            setIsVideoEnabled(video);

            // Connect to signaling server
            const ws = new WebSocket(`${WS_BASE_URL}/ws/webrtc/${roomId}/${userId}`);

            ws.onopen = () => {
                console.log('WebRTC signaling connected');
            };

            ws.onmessage = async (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'user_joined_call') {
                    console.log('User joined call:', message.user_id);
                    setParticipants(message.participants || []);
                    onUserJoined?.(message.user_id);

                    // Create offer for new user
                    if (message.user_id !== userId) {
                        const pc = createPeerConnection(message.user_id);
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);

                        ws.send(JSON.stringify({
                            type: 'offer',
                            to_user: message.user_id,
                            signal: {
                                type: 'offer',
                                sdp: offer,
                            },
                        }));
                    }
                } else if (message.type === 'user_left_call') {
                    console.log('User left call:', message.user_id);
                    setParticipants(message.participants || []);
                    onUserLeft?.(message.user_id);

                    // Close peer connection
                    const pc = peerConnectionsRef.current.get(message.user_id);
                    if (pc) {
                        pc.close();
                        peerConnectionsRef.current.delete(message.user_id);
                    }
                } else if (message.type === 'webrtc_signal') {
                    const { from_user, signal } = message;

                    if (signal.type === 'offer') {
                        const pc = createPeerConnection(from_user);
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        ws.send(JSON.stringify({
                            type: 'answer',
                            to_user: from_user,
                            signal: {
                                type: 'answer',
                                sdp: answer,
                            },
                        }));
                    } else if (signal.type === 'answer') {
                        const pc = peerConnectionsRef.current.get(from_user);
                        if (pc) {
                            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                        }
                    } else if (signal.type === 'ice_candidate') {
                        const pc = peerConnectionsRef.current.get(from_user);
                        if (pc && signal.candidate) {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        }
                    }
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Error starting call:', error);
            throw error;
        }
    }, [roomId, userId, createPeerConnection, onUserJoined, onUserLeft]);

    const endCall = useCallback(() => {
        // Close all peer connections
        peerConnectionsRef.current.forEach((pc) => pc.close());
        peerConnectionsRef.current.clear();

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setLocalStream(null);
        setParticipants([]);
    }, []);

    const toggleAudio = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    }, []);

    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            // Replace video track in all peer connections
            peerConnectionsRef.current.forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(screenTrack);
                }
            });

            // Replace local stream video track
            if (localStreamRef.current) {
                const videoTrack = localStreamRef.current.getVideoTracks()[0];
                videoTrack?.stop();
                localStreamRef.current.removeTrack(videoTrack);
                localStreamRef.current.addTrack(screenTrack);
            }

            setIsScreenSharing(true);

            // Handle screen share stop
            screenTrack.onended = async () => {
                await stopScreenShare();
            };
        } catch (error) {
            console.error('Error starting screen share:', error);
        }
    }, []);

    const stopScreenShare = useCallback(async () => {
        try {
            // Get camera stream again
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const cameraTrack = cameraStream.getVideoTracks()[0];

            // Replace screen track with camera track in all peer connections
            peerConnectionsRef.current.forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(cameraTrack);
                }
            });

            // Replace local stream video track
            if (localStreamRef.current) {
                const screenTrack = localStreamRef.current.getVideoTracks()[0];
                screenTrack?.stop();
                localStreamRef.current.removeTrack(screenTrack);
                localStreamRef.current.addTrack(cameraTrack);
            }

            setIsScreenSharing(false);
        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }, []);

    useEffect(() => {
        return () => {
            endCall();
        };
    }, [endCall]);

    return {
        localStream,
        isAudioEnabled,
        isVideoEnabled,
        isScreenSharing,
        participants,
        startCall,
        endCall,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
    };
};
