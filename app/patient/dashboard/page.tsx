'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { 
  Heart, 
  Video, 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  VideoIcon, 
  VideoOff, 
  LogOut,
  Wifi,
  WifiOff,
  AlertCircle,
  User
} from 'lucide-react';

// Mock doctors data
const doctors = [
  { id: '4', name: 'Dr. Sarah Wilson', specialization: 'Cardiology', status: 'online' },
  { id: '5', name: 'Dr. Robert Brown', specialization: 'General Medicine', status: 'online' },
  { id: '6', name: 'Dr. Emily Davis', specialization: 'Pediatrics', status: 'busy' },
];

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const {
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
  } = useWebRTC(user?.id || '', 'patient');

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      router.push('/login/patient');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleStartCall = async (doctorId: string) => {
    await startCall(doctorId);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Patient Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {callState.isConnected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">Disconnected</span>
                  </>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {callState.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="text-sm">{callState.error}</p>
            </div>
          </div>
        )}

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Incoming Call</h3>
                <p className="text-gray-600 mb-6">{incomingCall.fromName}</p>
                <div className="flex space-x-4">
                  <button
                    onClick={rejectCall}
                    className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    Decline
                  </button>
                  <button
                    onClick={acceptCall}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Call Interface */}
        {callState.isInCall && (
          <div className="fixed inset-0 bg-black z-40">
            <div className="relative h-full">
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Call Controls */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="flex items-center space-x-4 bg-white bg-opacity-20 backdrop-blur-md rounded-full px-6 py-4">
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition-colors ${
                      callState.isAudioEnabled 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {callState.isAudioEnabled ? (
                      <Mic className="h-6 w-6 text-white" />
                    ) : (
                      <MicOff className="h-6 w-6 text-white" />
                    )}
                  </button>
                  
                  <button
                    onClick={endCall}
                    className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                  >
                    <PhoneOff className="h-6 w-6 text-white" />
                  </button>
                  
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      callState.isVideoEnabled 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {callState.isVideoEnabled ? (
                      <VideoIcon className="h-6 w-6 text-white" />
                    ) : (
                      <VideoOff className="h-6 w-6 text-white" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
                <span className="text-sm">
                  {callState.connectionState === 'new' && '🚀 Starting call...'}
                  {callState.connectionState === 'connecting' && '🔄 Connecting...'}
                  {callState.connectionState === 'connected' && '✅ Connected'}
                  {callState.connectionState === 'disconnected' && '⚠️ Connection lost'}
                  {callState.connectionState === 'failed' && '❌ Connection failed'}
                  {!callState.connectionState && '🔄 Initializing...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!callState.isInCall && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600">
                Connect with your healthcare providers through secure video consultations.
              </p>
            </div>

            {/* Available Doctors */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Available Doctors</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                        <p className="text-gray-600">{doctor.specialization}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doctor.status === 'online' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doctor.status}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleStartCall(doctor.id)}
                      disabled={!callState.isConnected || doctor.status !== 'online'}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Start Video Call
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Instructions */}
            {!callState.isConnected && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Server Connection Required</p>
                    <p className="text-sm mt-1">
                      To make video calls, you need to start the signaling server. 
                      This will be handled automatically in production.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}