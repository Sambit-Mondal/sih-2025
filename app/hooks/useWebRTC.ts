'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

export interface CallState {
  isConnected: boolean;
  isInCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  connectionState: RTCPeerConnectionState | null;
  error: string | null;
}

export interface IncomingCall {
  from: string;
  fromName: string;
  callId: string;
}

export const useWebRTC = (userId: string, userRole: 'patient' | 'doctor') => {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isInCall: false,
    localStream: null,
    remoteStream: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    connectionState: null,
    error: null,
  });

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // STUN servers configuration
  const iceServers: RTCIceServer[] = useMemo(() => [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ], []);

  // Cleanup function
  const cleanupCall = useCallback(() => {
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setCallState(prev => ({
      ...prev,
      isInCall: false,
      localStream: null,
      remoteStream: null,
      connectionState: null,
    }));
    setIncomingCall(null);
  }, [callState.localStream]);

  // Get user media
  const getUserMedia = useCallback(async (constraints: MediaStreamConstraints = { video: true, audio: true }) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCallState(prev => ({ ...prev, localStream: stream }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setCallState(prev => ({ ...prev, error: 'Failed to access camera/microphone' }));
      throw error;
    }
  }, []);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection({ iceServers });
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      const remoteStream = event.streams[0];
      setCallState(prev => ({ ...prev, remoteStream }));
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      setCallState(prev => ({ ...prev, connectionState: peerConnection.connectionState }));
      
      if (peerConnection.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, isInCall: true, error: null }));
      } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        setCallState(prev => ({ ...prev, error: 'Connection failed' }));
        cleanupCall();
      }
    };

    return peerConnection;
  }, [cleanupCall, iceServers]);

  const createOffer = useCallback(async () => {
    try {
      const peerConnection = initializePeerConnection();
      const stream = await getUserMedia();
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      if (socketRef.current) {
        socketRef.current.emit('offer', offer);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setCallState(prev => ({ ...prev, error: 'Failed to create call offer' }));
    }
  }, [initializePeerConnection, getUserMedia]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    try {
      const peerConnection = initializePeerConnection();
      const stream = await getUserMedia();
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      if (socketRef.current) {
        socketRef.current.emit('answer', answer);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      setCallState(prev => ({ ...prev, error: 'Failed to handle call offer' }));
    }
  }, [initializePeerConnection, getUserMedia]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      setCallState(prev => ({ ...prev, error: 'Failed to handle call answer' }));
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to signaling server');
      socket.emit('join', { userId, role: userRole });
      setCallState(prev => ({ ...prev, isConnected: true, error: null }));
    });

    socket.on('disconnect', () => {
      setCallState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('connect_error', () => {
      setCallState(prev => ({ ...prev, error: 'Failed to connect to server' }));
    });

    socket.on('incoming-call', (data: IncomingCall) => {
      setIncomingCall(data);
    });

    socket.on('call-accepted', async () => {
      await createOffer();
    });

    socket.on('call-rejected', () => {
      setCallState(prev => ({ ...prev, error: 'Call was rejected' }));
      cleanupCall();
    });

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-ended', cleanupCall);

    return () => {
      socket.disconnect();
    };
  }, [userId, userRole, createOffer, handleOffer, handleAnswer, handleIceCandidate, cleanupCall]);

  const startCall = useCallback(async (doctorId: string) => {
    try {
      if (!socketRef.current) {
        throw new Error('Not connected to server');
      }
      
      setCallState(prev => ({ ...prev, error: null }));
      
      // Immediately set the call as in progress and start video interface
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true, 
        connectionState: 'new',
        error: null 
      }));
      
      // Initialize media streams when starting call
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCallState(prev => ({ 
        ...prev, 
        localStream: stream,
        isAudioEnabled: true,
        isVideoEnabled: true
      }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      const callId = `call_${userId}_${doctorId}_${Date.now()}`;
      
      socketRef.current.emit('start-call', {
        to: doctorId,
        from: userId,
        callId,
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: 'Failed to access camera/microphone or start call',
        isInCall: false 
      }));
    }
  }, [userId, localVideoRef]);

  const acceptCall = useCallback(async () => {
    try {
      if (!incomingCall || !socketRef.current) {
        return;
      }
      
      // Immediately set the call as in progress and start video interface
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true, 
        connectionState: 'new',
        error: null 
      }));
      
      // Initialize media streams when accepting call
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCallState(prev => ({ 
        ...prev, 
        localStream: stream,
        isAudioEnabled: true,
        isVideoEnabled: true
      }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      socketRef.current.emit('accept-call', {
        callId: incomingCall.callId,
        to: incomingCall.from,
      });
      
      setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallState(prev => ({ 
        ...prev, 
        error: 'Failed to access camera/microphone or accept call',
        isInCall: false 
      }));
    }
  }, [incomingCall, localVideoRef]);

  const rejectCall = useCallback(() => {
    if (!incomingCall || !socketRef.current) {
      return;
    }
    
    socketRef.current.emit('reject-call', {
      callId: incomingCall.callId,
      to: incomingCall.from,
    });
    
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('end-call');
    }
    cleanupCall();
  }, [cleanupCall]);

  const toggleAudio = useCallback(() => {
    if (callState.localStream) {
      const audioTracks = callState.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !callState.isAudioEnabled;
      });
      setCallState(prev => ({ ...prev, isAudioEnabled: !prev.isAudioEnabled }));
    }
  }, [callState.localStream, callState.isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    if (callState.localStream) {
      const videoTracks = callState.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !callState.isVideoEnabled;
      });
      setCallState(prev => ({ ...prev, isVideoEnabled: !prev.isVideoEnabled }));
    }
  }, [callState.localStream, callState.isVideoEnabled]);

  return {
    callState,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
};