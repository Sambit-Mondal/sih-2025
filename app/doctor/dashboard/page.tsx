'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { 
  Shield, 
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
  User,
  Clock,
  Calendar,
  Users
} from 'lucide-react';

// Mock patient data and appointments
const recentPatients = [
  { id: '1', name: 'John Doe', lastVisit: '2 days ago', condition: 'Routine Checkup' },
  { id: '2', name: 'Jane Smith', lastVisit: '1 week ago', condition: 'Hypertension Follow-up' },
  { id: '3', name: 'Mike Johnson', lastVisit: '3 days ago', condition: 'Diabetes Management' },
];

const upcomingAppointments = [
  { time: '10:00 AM', patient: 'Alice Brown', type: 'Consultation' },
  { time: '11:30 AM', patient: 'Bob Wilson', type: 'Follow-up' },
  { time: '2:00 PM', patient: 'Carol Davis', type: 'Initial Assessment' },
];

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const {
    callState,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTC(user?.id || '', 'doctor');

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      router.push('/login/doctor');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Doctor Dashboard</span>
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
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Incoming Patient Call</h3>
                <p className="text-gray-600 mb-2">From: {incomingCall.fromName}</p>
                <p className="text-sm text-gray-500 mb-6">Patient requesting consultation</p>
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
                    Accept Call
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
              {/* Remote Video (Patient) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Doctor - Picture-in-Picture) */}
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
              
              {/* Connection Status & Patient Info */}
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
                  <span className="text-sm">
                    Status: {
                      callState.connectionState === 'new' ? 'Starting call...' :
                      callState.connectionState === 'connecting' ? 'Connecting...' :
                      callState.connectionState === 'connected' ? 'Connected' :
                      callState.connectionState === 'disconnected' ? 'Disconnected' :
                      callState.connectionState === 'failed' ? 'Connection failed' :
                      'Connecting...'
                    }
                  </span>
                </div>
                <div className="bg-blue-600 bg-opacity-90 text-white px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium">
                    Patient: {incomingCall?.fromName || 'Unknown'}
                  </span>
                </div>
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
                Good day, {user.name}!
              </h1>
              <p className="text-gray-600">
                Ready to provide excellent healthcare through secure video consultations.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Patients Today</h3>
                    <p className="text-2xl font-bold text-blue-600">12</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Video className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Video Calls</h3>
                    <p className="text-2xl font-bold text-green-600">8</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Avg. Session</h3>
                    <p className="text-2xl font-bold text-purple-600">25min</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Today's Appointments */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Today&apos;s Appointments</h2>
                  <Calendar className="h-6 w-6 text-gray-500" />
                </div>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient}</p>
                          <p className="text-sm text-gray-600">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{appointment.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Patients */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Recent Patients</h2>
                  <Users className="h-6 w-6 text-gray-500" />
                </div>
                <div className="space-y-4">
                  {recentPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.condition}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{patient.lastVisit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Call Waiting Status */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {callState.isConnected ? 'Ready for Patient Calls' : 'Connecting to Server...'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {callState.isConnected 
                    ? 'You&apos;ll receive notifications when patients initiate video calls.' 
                    : 'Establishing connection to receive incoming calls...'}
                </p>
                
                {!callState.isConnected && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                    <div className="flex items-start justify-center">
                      <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Server Connection Required</p>
                        <p className="text-sm mt-1">
                          To receive video calls, you need to start the signaling server. 
                          This will be handled automatically in production.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}