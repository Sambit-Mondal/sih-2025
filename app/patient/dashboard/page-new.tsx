'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { HealthAssessmentChatbot, ChatMessage } from '../../lib/chatbot';
import { PatientReportGenerator, PatientReport } from '../../lib/reportGenerator';
import { 
  Heart, 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  VideoIcon, 
  VideoOff, 
  LogOut,
  Wifi,
  WifiOff,
  User,
  Send,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';// Application phases
type AppPhase = 'assessment' | 'report-generation' | 'waiting-for-doctor' | 'video-call';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Chatbot and assessment states
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('assessment');
  const [chatbot, setChatbot] = useState<HealthAssessmentChatbot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [generatedReport, setGeneratedReport] = useState<PatientReport | null>(null);
  const [isTyping, setIsTyping] = useState(false);

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
  } = useWebRTC(user?.id || '', user?.name || '', 'patient');

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      router.push('/login/patient');
      return;
    }

    // Initialize chatbot on component mount
    if (!chatbot && currentPhase === 'assessment') {
      const newChatbot = new HealthAssessmentChatbot(user.name);
      setChatbot(newChatbot);
      const initialMessage = newChatbot.getInitialMessage();
      setMessages([initialMessage]);
    }
  }, [user, router, chatbot, currentPhase]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !chatbot) return;
    
    setIsTyping(true);
    
    // Simulate typing delay for better UX
    setTimeout(() => {
      const responses = chatbot.processResponse(currentMessage.trim());
      setMessages(prev => [...prev, ...responses]);
      setCurrentMessage('');
      setIsTyping(false);
      
      // Check if conversation is complete
      if (chatbot.isConversationComplete()) {
        setTimeout(() => {
          handleGenerateReport(chatbot);
        }, 1000);
      }
    }, 500);
  };

  const handleGenerateReport = (completedChatbot: HealthAssessmentChatbot) => {
    setCurrentPhase('report-generation');
    
    setTimeout(() => {
      const reportGenerator = new PatientReportGenerator();
      const patientData = completedChatbot.getPatientData();
      const conversationHistory = completedChatbot.getConversationHistory();
      const report = reportGenerator.generateReport(patientData, conversationHistory);
      
      setGeneratedReport(report);
      setCurrentPhase('waiting-for-doctor');
      
      // Auto-connect to doctor after report generation
      setTimeout(() => {
        handleConnectToDoctor(report);
      }, 2000);
    }, 3000);
  };

  const handleConnectToDoctor = async (report: PatientReport) => {
    // Send report to signaling server and start call with first available doctor
    const doctorId = '4'; // Dr. Sarah Wilson as default
    await startCall(doctorId, report);
    setCurrentPhase('video-call');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Assessment Phase UI
  if (currentPhase === 'assessment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Health Assessment</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Progress bar */}
            <div className="bg-green-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Health Assessment Chat</h2>
                <span className="text-sm text-gray-600">
                  Step {chatbot?.getCurrentStep() || 0} of {chatbot?.getTotalSteps() || 9}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((chatbot?.getCurrentStep() || 0) / (chatbot?.getTotalSteps() || 9)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isBot 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'bg-green-600 text-white'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    {message.options && (
                      <div className="mt-2 space-y-1">
                        {message.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setCurrentMessage(option);
                              setTimeout(() => handleSendMessage(), 100);
                            }}
                            className="block w-full text-left text-xs p-2 bg-white text-gray-700 rounded border hover:bg-gray-50"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Report Generation Phase UI
  if (currentPhase === 'report-generation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Health Report</h2>
            <p className="text-gray-600 mb-6">
              Please wait while we analyze your symptoms and prepare a comprehensive report for the doctor.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for Doctor Phase UI
  if (currentPhase === 'waiting-for-doctor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Generated Successfully</h2>
            <p className="text-gray-600 mb-6">
              Your health assessment is complete. Connecting you with an available doctor now...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Estimated wait time: Less than 1 minute</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Video Call Phase UI - Use existing video call interface
  if (currentPhase === 'video-call') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Video Consultation</span>
              </div>
              
              <div className="flex items-center space-x-4">
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
                
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Video Call Interface */}
        <main className="flex-1 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-80px)] gap-4 p-4">
            {/* Local Video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  You
                </span>
              </div>
            </div>

            {/* Remote Video */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Doctor
                </span>
              </div>
              
              {!callState.connectionState && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                  <div className="text-white text-center">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Waiting for doctor to join...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${
                  callState.isAudioEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {callState.isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  callState.isVideoEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {callState.isVideoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
              
              <button
                onClick={endCall}
                className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        </main>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Incoming Call</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {incomingCall.fromName} is calling you
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={rejectCall}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={acceptCall}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}