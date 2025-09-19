'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { PatientReport } from '../lib/reportGenerator';

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
  patientReport?: PatientReport | null;
}

export const useWebRTC = (userId: string, userName: string, userRole: 'patient' | 'doctor') => {
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
  const [currentCallParticipant, setCurrentCallParticipant] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // ICE candidate queue to handle candidates received before remote description is set
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // STUN/TURN servers configuration for cross-network connectivity
  const iceServers: RTCIceServer[] = useMemo(() => {
    const servers: RTCIceServer[] = [
      // Google STUN servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      // Additional reliable STUN servers
      { urls: 'stun:stun.ekiga.net' },
      { urls: 'stun:stun.ideasip.com' },
      { urls: 'stun:stun.rixtelecom.se' },
      { urls: 'stun:stun.schlund.de' },
      { urls: 'stun:stunserver.org' },
      { urls: 'stun:stun.softjoys.com' },
      { urls: 'stun:stun.voiparound.com' },
      { urls: 'stun:stun.voipbuster.com' },
      // Free TURN servers (limited bandwidth but helps with connectivity)
      {
        urls: 'turn:numb.viagenie.ca',
        username: 'webrtc@live.com',
        credential: 'muazkh'
      },
      {
        urls: 'turn:192.158.29.39:3478?transport=udp',
        username: '28224511:1379330808',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA='
      },
      {
        urls: 'turn:192.158.29.39:3478?transport=tcp',
        username: '28224511:1379330808',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA='
      },
      // Twilio STUN servers (reliable)
      { urls: 'stun:global.stun.twilio.com:3478' },
    ];

    // Add custom STUN/TURN servers from environment variables if provided
    if (process.env.NEXT_PUBLIC_CUSTOM_STUN_SERVER) {
      servers.unshift({ urls: process.env.NEXT_PUBLIC_CUSTOM_STUN_SERVER });
      console.log('🧊 Added custom STUN server:', process.env.NEXT_PUBLIC_CUSTOM_STUN_SERVER);
    }

    if (process.env.NEXT_PUBLIC_CUSTOM_TURN_SERVER && 
        process.env.NEXT_PUBLIC_TURN_USERNAME && 
        process.env.NEXT_PUBLIC_TURN_CREDENTIAL) {
      servers.unshift({
        urls: process.env.NEXT_PUBLIC_CUSTOM_TURN_SERVER,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
      });
      console.log('🧊 Added custom TURN server:', process.env.NEXT_PUBLIC_CUSTOM_TURN_SERVER);
    }

    console.log('🧊 Using ICE servers:', servers.map(s => s.urls));
    return servers;
  }, []);

  // Cleanup function - moved outside useEffect to avoid dependency issues
  const cleanupCall = useCallback(() => {
    console.log('🧹 Cleaning up call resources');
    
    setCallState(prev => {
      // Stop local media tracks
      if (prev.localStream) {
        console.log('🔇 Stopping local media tracks');
        prev.localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped local ${track.kind} track`);
        });
      }
      
      // Stop remote media tracks
      if (prev.remoteStream) {
        console.log('🔇 Stopping remote media tracks');
        prev.remoteStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped remote ${track.kind} track`);
        });
      }
      
      return {
        ...prev,
        isInCall: false,
        localStream: null,
        remoteStream: null,
        connectionState: null,
        isAudioEnabled: true,
        isVideoEnabled: true,
      };
    });

    if (peerConnectionRef.current) {
      console.log('🔌 Closing peer connection');
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      console.log('📹 Cleared local video element');
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
      console.log('📹 Cleared remote video element');
    }

    // Clear ICE candidate queue
    iceCandidateQueueRef.current = [];

    setIncomingCall(null);
    setCurrentCallParticipant(null);
    
    console.log('✅ Call cleanup completed');
  }, []); // No dependencies to prevent useEffect recreation

  // Helper function to process queued ICE candidates
  const processQueuedIceCandidates = useCallback(async () => {
    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
      console.log(`🧊 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`);
      
      for (const candidate of iceCandidateQueueRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(candidate);
          console.log('✅ Added queued ICE candidate');
        } catch (error) {
          console.error('❌ Failed to add queued ICE candidate:', error);
        }
      }
      
      // Clear the queue after processing
      iceCandidateQueueRef.current = [];
    }
  }, []);

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

    // Enhanced RTCPeerConnection configuration for better cross-network connectivity
    const configuration: RTCConfiguration = {
      iceServers,
      // ICE transport policy to try all methods (relay, srflx, host)
      iceTransportPolicy: 'all',
      // Bundle policy to bundle all media streams
      bundlePolicy: 'max-bundle',
      // RTCP mux policy to multiplex RTCP
      rtcpMuxPolicy: 'require',
      // ICE candidate pool size for better connectivity
      iceCandidatePoolSize: 10,
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Enhanced ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('🧊 Sending local ICE candidate:', {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          port: event.candidate.port
        });
        socketRef.current.emit('ice-candidate', event.candidate);
      } else if (!event.candidate) {
        console.log('🧊 ICE gathering complete');
      }
    };

    // ICE gathering state monitoring
    peerConnection.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', peerConnection.iceGatheringState);
    };

    // ICE connection state monitoring
    peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'connected' || 
          peerConnection.iceConnectionState === 'completed') {
        console.log('✅ ICE connection established successfully');
        setCallState(prev => ({ ...prev, error: null }));
      } else if (peerConnection.iceConnectionState === 'failed') {
        console.log('❌ ICE connection failed - attempting restart');
        // Attempt ICE restart
        peerConnection.restartIce();
        setCallState(prev => ({ 
          ...prev, 
          error: 'Connection failed, attempting to reconnect...' 
        }));
      } else if (peerConnection.iceConnectionState === 'disconnected') {
        console.log('⚠️ ICE connection disconnected');
        setCallState(prev => ({ 
          ...prev, 
          error: 'Connection temporarily lost...' 
        }));
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote stream');
      const remoteStream = event.streams[0];
      setCallState(prev => ({ ...prev, remoteStream }));
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', peerConnection.connectionState);
      setCallState(prev => ({ ...prev, connectionState: peerConnection.connectionState }));
      
      if (peerConnection.connectionState === 'connected') {
        console.log('✅ WebRTC connection established successfully');
        setCallState(prev => ({ ...prev, isInCall: true, error: null }));
      } else if (peerConnection.connectionState === 'failed') {
        console.log('❌ WebRTC connection failed permanently');
        setCallState(prev => ({ 
          ...prev, 
          error: 'Connection failed. This may be due to firewall restrictions or network configuration.' 
        }));
        // Only cleanup on permanent failure, not temporary disconnections
        setTimeout(() => cleanupCall(), 3000); // Give a few seconds for potential recovery
      } else if (peerConnection.connectionState === 'disconnected') {
        console.log('⚠️ WebRTC connection disconnected - attempting to maintain call');
        // Don't immediately cleanup on disconnection - might be temporary
        setCallState(prev => ({ 
          ...prev, 
          error: 'Connection temporarily lost, attempting to reconnect...' 
        }));
        
        // Only cleanup if still disconnected after a reasonable timeout
        setTimeout(() => {
          if (peerConnection.connectionState === 'disconnected') {
            console.log('❌ WebRTC connection remained disconnected, cleaning up');
            setCallState(prev => ({ ...prev, error: 'Connection lost' }));
            cleanupCall();
          }
        }, 15000); // Increased timeout for cross-network scenarios
      } else if (peerConnection.connectionState === 'connecting') {
        console.log('🔄 WebRTC connection in progress...');
        setCallState(prev => ({ 
          ...prev, 
          error: 'Connecting across networks... This may take a moment.' 
        }));
      }
    };

    // Data channel for additional connectivity testing
    const dataChannel = peerConnection.createDataChannel('connectivity-test', {
      ordered: true
    });
    
    dataChannel.onopen = () => {
      console.log('📡 Data channel opened - connection is stable');
    };

    dataChannel.onerror = (error) => {
      console.log('📡 Data channel error:', error);
    };

    return peerConnection;
  }, [cleanupCall, iceServers]);

  useEffect(() => {
    console.log(`🔌 Setting up stable socket for ${userRole} ${userId}`);
    
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['polling', 'websocket'], // Allow both but prefer websocket
      autoConnect: true,
      timeout: 30000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      forceNew: false,
      upgrade: true, // Allow upgrades for better performance
    });

    socketRef.current = socket;

    // Create stable internal handlers to avoid dependency issues
    const internalCleanupCall = () => {
      console.log('🧹 Cleaning up call resources (internal)');
      
      setCallState(prev => {
        // Stop local media tracks
        if (prev.localStream) {
          console.log('🔇 Stopping local media tracks');
          prev.localStream.getTracks().forEach(track => {
            track.stop();
            console.log(`Stopped local ${track.kind} track`);
          });
        }
        
        // Stop remote media tracks
        if (prev.remoteStream) {
          console.log('🔇 Stopping remote media tracks');
          prev.remoteStream.getTracks().forEach(track => {
            track.stop();
            console.log(`Stopped remote ${track.kind} track`);
          });
        }
        
        return {
          ...prev,
          isInCall: false,
          localStream: null,
          remoteStream: null,
          connectionState: null,
          isAudioEnabled: true,
          isVideoEnabled: true,
        };
      });

      if (peerConnectionRef.current) {
        console.log('🔌 Closing peer connection');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Clear video elements
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        console.log('📹 Cleared local video element');
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
        console.log('📹 Cleared remote video element');
      }

      // Clear ICE candidate queue
      iceCandidateQueueRef.current = [];

      setIncomingCall(null);
      setCurrentCallParticipant(null);
      console.log('✅ Call cleanup completed');
    };

    const internalCreateOffer = async () => {
      try {
        const peerConnection = initializePeerConnection();
        const stream = await getUserMedia();
        
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        // Enhanced offer options for better cross-network connectivity
        const offerOptions: RTCOfferOptions = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
          iceRestart: false // Don't restart ICE unless needed
        };

        const offer = await peerConnection.createOffer(offerOptions);
        
        // Enhance SDP for better connectivity
        const enhancedOffer = {
          ...offer,
          sdp: offer.sdp
        };
        
        await peerConnection.setLocalDescription(enhancedOffer);
        console.log('✅ Created and set local offer description');
        
        if (socketRef.current) {
          socketRef.current.emit('offer', enhancedOffer);
          console.log('📤 Sent offer to remote peer');
        }
      } catch (error) {
        console.error('❌ Error creating offer:', error);
        setCallState(prev => ({ ...prev, error: 'Failed to create call offer' }));
      }
    };

    const internalHandleOffer = async (offer: RTCSessionDescriptionInit) => {
      try {
        const peerConnection = initializePeerConnection();
        const stream = await getUserMedia();
        
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });

        console.log('📥 Setting remote description from offer');
        await peerConnection.setRemoteDescription(offer);
        console.log('✅ Remote description set from offer');
        
        // Process any queued ICE candidates now that remote description is set
        await processQueuedIceCandidates();
        
        // Enhanced answer options for better cross-network connectivity
        const answerOptions: RTCAnswerOptions = {};
        
        const answer = await peerConnection.createAnswer(answerOptions);
        
        console.log('✅ Created answer description');
        await peerConnection.setLocalDescription(answer);
        console.log('✅ Set local answer description');
        
        if (socketRef.current) {
          socketRef.current.emit('answer', answer);
          console.log('📤 Sent answer to remote peer');
        }
      } catch (error) {
        console.error('❌ Error handling offer:', error);
        setCallState(prev => ({ ...prev, error: 'Failed to handle call offer' }));
      }
    };

    const internalHandleAnswer = async (answer: RTCSessionDescriptionInit) => {
      try {
        if (peerConnectionRef.current) {
          console.log('📥 Setting remote description from answer');
          await peerConnectionRef.current.setRemoteDescription(answer);
          console.log('✅ Remote description set from answer');
          
          // Process any queued ICE candidates now that remote description is set
          await processQueuedIceCandidates();
          console.log('✅ Processed queued ICE candidates after answer');
        } else {
          console.error('❌ No peer connection available to set answer');
        }
      } catch (error) {
        console.error('❌ Error handling answer:', error);
        setCallState(prev => ({ ...prev, error: 'Failed to handle call answer' }));
      }
    };

    const internalHandleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      try {
        if (peerConnectionRef.current) {
          // Check if remote description is set
          if (peerConnectionRef.current.remoteDescription) {
            console.log('🧊 Adding ICE candidate immediately (remote description set)');
            await peerConnectionRef.current.addIceCandidate(candidate);
          } else {
            console.log('🧊 Queueing ICE candidate (remote description not set)');
            iceCandidateQueueRef.current.push(candidate);
          }
        } else {
          console.log('🧊 Queueing ICE candidate (no peer connection)');
          iceCandidateQueueRef.current.push(candidate);
        }
      } catch (error) {
        console.error('❌ Error handling ICE candidate:', error);
      }
    };

    socket.on('connect', () => {
      console.log(`✅ ${userRole} ${userId} connected (${socket.io.engine.transport.name})`);
      socket.emit('join', { userId, userName, role: userRole });
      setCallState(prev => ({ ...prev, isConnected: true, error: null }));
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 ${userRole} ${userId} disconnected: ${reason}`);
      setCallState(prev => ({ ...prev, isConnected: false }));
      
      // Don't clean up call state on disconnect - allow reconnection
      if (reason === 'io client disconnect') {
        // User intentionally disconnected
        internalCleanupCall();
      }
    });

    socket.on('connect_error', (error) => {
      console.error(`❌ ${userRole} ${userId} connection error:`, error);
      setCallState(prev => ({ ...prev, error: 'Failed to connect to server' }));
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 ${userRole} ${userId} reconnected after ${attemptNumber} attempts`);
      // Re-join with user info after reconnection
      socket.emit('join', { userId, userName, role: userRole });
    });

    socket.on('incoming-call', (data: IncomingCall) => {
      console.log('📞 Incoming call received:', data);
      setIncomingCall(data);
      setCurrentCallParticipant(data.fromName); // Store the caller's name
    });

    socket.on('call-accepted', async () => {
      console.log('📞 Call accepted by doctor, initiating WebRTC offer');
      try {
        await internalCreateOffer();
        console.log('✅ WebRTC offer created and sent');
      } catch (error) {
        console.error('❌ Failed to create offer after call acceptance:', error);
        setCallState(prev => ({ 
          ...prev, 
          error: 'Failed to establish video connection'
        }));
      }
    });

    socket.on('call-rejected', () => {
      console.log('❌ Call was rejected by doctor');
      setCallState(prev => ({ ...prev, error: 'Call was rejected' }));
      internalCleanupCall();
    });

    socket.on('offer', async (offer) => {
      console.log('📨 Received WebRTC offer');
      try {
        await internalHandleOffer(offer);
        console.log('✅ WebRTC offer processed successfully');
      } catch (error) {
        console.error('❌ Failed to handle WebRTC offer:', error);
        setCallState(prev => ({ 
          ...prev, 
          error: 'Failed to process video connection'
        }));
      }
    });
    
    socket.on('answer', async (answer) => {
      console.log('📨 Received WebRTC answer');
      try {
        await internalHandleAnswer(answer);
        console.log('✅ WebRTC answer processed successfully');
      } catch (error) {
        console.error('❌ Failed to handle WebRTC answer:', error);
        setCallState(prev => ({ 
          ...prev, 
          error: 'Failed to complete video connection'
        }));
      }
    });
    
    socket.on('ice-candidate', async (candidate) => {
      console.log('🧊 Received ICE candidate');
      try {
        await internalHandleIceCandidate(candidate);
      } catch (error) {
        console.error('❌ Failed to handle ICE candidate:', error);
      }
    });
    
    socket.on('call-ended', () => {
      console.log('📞 Call ended by remote user');
      internalCleanupCall();
    });

    return () => {
      console.log(`🔌 Cleaning up socket for ${userRole} ${userId}`);
      socket.disconnect();
    };
  }, [userId, userName, userRole, getUserMedia, initializePeerConnection, processQueuedIceCandidates]); // Added required dependencies

  const startCall = useCallback(async (doctorId: string, patientReport?: PatientReport) => {
    try {
      if (!socketRef.current) {
        throw new Error('Not connected to server');
      }
      
      console.log(`🚀 Starting call to doctor ${doctorId}`);
      if (patientReport) {
        console.log(`📋 Including patient report: ${patientReport.assessmentSummary.primaryConcern}`);
      }
      setCallState(prev => ({ ...prev, error: null }));
      
      // Check current socket connection status directly
      if (!socketRef.current.connected) {
        console.log('⏳ Waiting for socket connection...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          
          if (socketRef.current?.connected) {
            clearTimeout(timeout);
            resolve(true);
            return;
          }
          
          const checkConnection = () => {
            if (socketRef.current?.connected) {
              clearTimeout(timeout);
              resolve(true);
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }
      
      // Initialize media streams BEFORE showing video interface
      console.log('🎥 Requesting media permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      console.log('✅ Media stream obtained successfully');
      
      // Set up video interface with media stream
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true, 
        localStream: stream,
        connectionState: 'new',
        isAudioEnabled: true,
        isVideoEnabled: true,
        error: null 
      }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📹 Local video element set up');
      }
      
      const callId = `call_${userId}_${doctorId}_${Date.now()}`;
      console.log(`📞 Emitting start-call event with callId: ${callId}`);
      
      // Final check that socket is still connected before emitting
      if (socketRef.current?.connected) {
        socketRef.current.emit('start-call', {
          to: doctorId,
          from: userId,
          callId,
          patientReport: patientReport || null
        });
        console.log(`✅ Call request sent successfully`);
      } else {
        throw new Error('Lost connection while starting call');
      }
      
    } catch (error) {
      console.error('❌ Error starting call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCallState(prev => ({ 
        ...prev, 
        error: `Failed to start call: ${errorMessage}`,
        isInCall: false 
      }));
      
      // Cleanup any partial setup
      setCallState(prev => {
        if (prev.localStream) {
          prev.localStream.getTracks().forEach(track => track.stop());
        }
        return { ...prev, localStream: null };
      });
    }
  }, [userId, localVideoRef]);

  const acceptCall = useCallback(async () => {
    try {
      if (!incomingCall || !socketRef.current) {
        console.log('❌ Cannot accept call - no incoming call or socket');
        return;
      }
      
      console.log(`📞 Accepting call from ${incomingCall.from}`);
      
      // Initialize media streams BEFORE showing video interface
      console.log('🎥 Requesting media permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      console.log('✅ Media stream obtained successfully');
      
      // Set up video interface with media stream
      setCallState(prev => ({ 
        ...prev, 
        isInCall: true, 
        localStream: stream,
        connectionState: 'new',
        isAudioEnabled: true,
        isVideoEnabled: true,
        error: null 
      }));
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('📹 Local video element set up');
      }
      
      console.log(`✅ Sending accept-call response`);
      socketRef.current.emit('accept-call', {
        callId: incomingCall.callId,
        to: incomingCall.from,
      });
      
      setIncomingCall(null);
      console.log('🎉 Call accepted successfully');
      
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCallState(prev => ({ 
        ...prev, 
        error: `Failed to accept call: ${errorMessage}`,
        isInCall: false 
      }));
      
      // Send rejection if we failed to accept
      if (incomingCall && socketRef.current) {
        socketRef.current.emit('reject-call', {
          callId: incomingCall.callId,
          to: incomingCall.from,
        });
        setIncomingCall(null);
      }
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
    console.log('📞 Ending call - initiating cleanup');
    
    // Notify the other participant that we're ending the call
    if (socketRef.current && socketRef.current.connected) {
      console.log('📡 Notifying remote participant about call end');
      socketRef.current.emit('end-call');
    }
    
    // Perform local cleanup immediately
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

  // Network connectivity test function
  const testConnectivity = useCallback(async (): Promise<{
    stunServers: { url: string; working: boolean }[];
    turnServers: { url: string; working: boolean }[];
    mediaAccess: { audio: boolean; video: boolean };
  }> => {
    console.log('🔍 Testing network connectivity...');
    
    const results = {
      stunServers: [] as { url: string; working: boolean }[],
      turnServers: [] as { url: string; working: boolean }[],
      mediaAccess: { audio: false, video: false }
    };

    // Test media access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      results.mediaAccess.audio = stream.getAudioTracks().length > 0;
      results.mediaAccess.video = stream.getVideoTracks().length > 0;
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Media access test passed');
    } catch (error) {
      console.log('❌ Media access test failed:', error);
    }

    // Test STUN servers
    for (const server of iceServers.filter(s => {
      const urls = Array.isArray(s.urls) ? s.urls[0] : s.urls;
      return urls.startsWith('stun:');
    })) {
      try {
        const testPc = new RTCPeerConnection({ iceServers: [server] });
        const testResult = await new Promise<boolean>((resolve) => {
          let resolved = false;
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
          }, 5000);

          testPc.onicecandidate = (event) => {
            if (event.candidate && event.candidate.type === 'srflx' && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(true);
            }
          };

          // Create a dummy offer to trigger ICE gathering
          testPc.createOffer().then(offer => testPc.setLocalDescription(offer));
        });

        const serverUrl = Array.isArray(server.urls) ? server.urls[0] : server.urls;
        results.stunServers.push({ url: serverUrl, working: testResult });
        testPc.close();
      } catch {
        const serverUrl = Array.isArray(server.urls) ? server.urls[0] : server.urls;
        results.stunServers.push({ url: serverUrl, working: false });
      }
    }

    // Test TURN servers (basic connectivity test)
    for (const server of iceServers.filter(s => {
      const urls = Array.isArray(s.urls) ? s.urls[0] : s.urls;
      return urls.startsWith('turn:');
    })) {
      try {
        const testPc = new RTCPeerConnection({ iceServers: [server] });
        const testResult = await new Promise<boolean>((resolve) => {
          let resolved = false;
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
          }, 8000);

          testPc.onicecandidate = (event) => {
            if (event.candidate && event.candidate.type === 'relay' && !resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(true);
            }
          };

          // Create a dummy offer to trigger ICE gathering
          testPc.createOffer().then(offer => testPc.setLocalDescription(offer));
        });

        const serverUrl = Array.isArray(server.urls) ? server.urls[0] : server.urls;
        results.turnServers.push({ url: serverUrl, working: testResult });
        testPc.close();
      } catch {
        const serverUrl = Array.isArray(server.urls) ? server.urls[0] : server.urls;
        results.turnServers.push({ url: serverUrl, working: false });
      }
    }

    console.log('🔍 Connectivity test results:', results);
    return results;
  }, [iceServers]);

  return {
    callState,
    incomingCall,
    currentCallParticipant,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    testConnectivity, // Added connectivity testing function
  };
};