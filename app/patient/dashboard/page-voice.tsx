'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { VoiceHealthAssessmentChatbot, VoiceMessage, VoiceState } from '../../lib/voiceChatbot';
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
  FileText,
  Clock,
  CheckCircle,
  Volume2,
  VolumeX,
  Radio,
  Pause,
  RotateCcw
} from 'lucide-react';

// Application phases
type AppPhase = 'voice-setup' | 'voice-assessment' | 'report-generation' | 'waiting-for-doctor' | 'video-call';

export default function VoicePatientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Voice chatbot states
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('voice-setup');
  const [voiceChatbot, setVoiceChatbot] = useState<VoiceHealthAssessmentChatbot | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [progressInfo, setProgressInfo] = useState({ current: 0, total: 9 }); // Track progress separately
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    hasPermission: false,
    currentText: '',
    confidence: 0,
    error: null
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [generatedReport, setGeneratedReport] = useState<PatientReport | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);

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
  }, [user, router]);

  const handleVoiceStateChange = useCallback((newVoiceState: VoiceState) => {
    setVoiceState(newVoiceState);
  }, []);

  const handleMessageUpdate = useCallback((newMessages: VoiceMessage[]) => {
    setMessages(newMessages);
    
    // Update progress when messages change
    if (voiceChatbot) {
      setProgressInfo({
        current: voiceChatbot.getCurrentStep(),
        total: voiceChatbot.getTotalSteps()
      });
    }
  }, [voiceChatbot]);

  const initializeVoiceChatbot = async () => {
    if (!user) return;
    
    try {
      const chatbot = new VoiceHealthAssessmentChatbot(
        user.name,
        handleVoiceStateChange,
        handleMessageUpdate
      );
      
      setVoiceChatbot(chatbot);
      setCurrentPhase('voice-assessment');
      
      // Start conversation after a short delay
      setTimeout(async () => {
        try {
          await chatbot.startConversation();
        } catch (error) {
          console.error('Failed to start conversation:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize voice chatbot:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize voice system. Please check microphone permissions.' 
      }));
    }
  };

  const handleConnectToDoctor = useCallback(async (report: PatientReport) => {
    // Send report to signaling server and start call with first available doctor
    const doctorId = '4'; // Dr. Sarah Wilson as default
    await startCall(doctorId, report);
    setCurrentPhase('video-call');
  }, [startCall]);

  const handleGenerateReport = useCallback(() => {
    if (!voiceChatbot) return;
    
    setCurrentPhase('report-generation');
    
    setTimeout(() => {
      const reportGenerator = new PatientReportGenerator();
      const patientData = voiceChatbot.getPatientData();
      const conversationHistory = voiceChatbot.getConversationHistory();
      const report = reportGenerator.generateReport(patientData, conversationHistory);
      
      setGeneratedReport(report);
      setCurrentPhase('waiting-for-doctor');
      
      // Auto-connect to doctor after report generation
      setTimeout(() => {
        handleConnectToDoctor(report);
      }, 2000);
    }, 3000);
  }, [voiceChatbot, handleConnectToDoctor]);

  // Monitor conversation completion with both state changes and periodic checks
  useEffect(() => {
    console.log('Checking completion status:', {
      hasVoiceChatbot: !!voiceChatbot,
      isComplete: voiceChatbot?.isConversationComplete(),
      currentPhase,
      currentStep: voiceChatbot?.getCurrentStep(),
      totalSteps: voiceChatbot?.getTotalSteps()
    });
    
    if (voiceChatbot && voiceChatbot.isConversationComplete() && currentPhase === 'voice-assessment') {
      console.log('Conversation completed! Triggering report generation...');
      voiceChatbot.cleanup();
      handleGenerateReport();
    }
  }, [voiceChatbot, currentPhase, voiceState, messages, handleGenerateReport]);

  // Backup completion checker - runs every 2 seconds during voice assessment
  useEffect(() => {
    if (currentPhase !== 'voice-assessment' || !voiceChatbot) return;
    
    const completionChecker = setInterval(() => {
      if (voiceChatbot.isConversationComplete()) {
        console.log('Backup completion checker triggered!');
        clearInterval(completionChecker);
        voiceChatbot.cleanup();
        handleGenerateReport();
      }
    }, 2000);
    
    return () => clearInterval(completionChecker);
  }, [currentPhase, voiceChatbot, handleGenerateReport]);

  const handleLogout = () => {
    if (voiceChatbot) {
      voiceChatbot.cleanup();
    }
    logout();
    router.push('/');
  };

  const toggleListening = () => {
    if (!voiceChatbot) return;
    
    if (voiceState.isListening) {
      voiceChatbot.stopListening();
    } else {
      voiceChatbot.startListening();
    }
  };

  const toggleSpeaking = () => {
    if (!voiceChatbot) return;
    
    if (voiceState.isSpeaking) {
      voiceChatbot.stopSpeaking();
    }
  };

  const restartConversation = () => {
    if (voiceChatbot) {
      voiceChatbot.cleanup();
    }
    setMessages([]);
    setCurrentPhase('voice-setup');
    setVoiceState({
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      hasPermission: false,
      currentText: '',
      confidence: 0,
      error: null
    });
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Voice Setup Phase
  if (currentPhase === 'voice-setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Voice Health Assessment</span>
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

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <Radio className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Voice-Powered Health Assessment</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Experience our advanced AI voice assistant that will conduct a comprehensive health assessment 
                through natural conversation. Simply speak your responses, and our AI will understand and 
                guide you through the process.
              </p>
              
              {voiceState.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{voiceState.error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">What to Expect:</h3>
                  <ul className="text-sm text-blue-800 text-left space-y-1">
                    <li>• Natural conversation with AI health assistant</li>
                    <li>• Ultra-low latency voice recognition and responses</li>
                    <li>• Comprehensive symptom and health history collection</li>
                    <li>• Automatic report generation for your doctor</li>
                    <li>• Seamless transition to video consultation</li>
                  </ul>
                </div>
                
                <button
                  onClick={initializeVoiceChatbot}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Start Voice Assessment
                </button>
                
                <p className="text-xs text-gray-500 mt-4">
                  Please ensure you have a good microphone and are in a quiet environment for best results.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Voice Assessment Phase
  if (currentPhase === 'voice-assessment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Voice Health Assessment</span>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Voice Status Indicator */}
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                  {voiceState.isSpeaking ? (
                    <>
                      <Volume2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">AI Speaking</span>
                    </>
                  ) : voiceState.isListening ? (
                    <>
                      <Radio className="h-4 w-4 text-green-600 animate-pulse" />
                      <span className="text-sm text-green-600">Listening</span>
                    </>
                  ) : voiceState.isProcessing ? (
                    <>
                      <Clock className="h-4 w-4 text-yellow-600 animate-spin" />
                      <span className="text-sm text-yellow-600">Processing</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Ready</span>
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

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Voice Control Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Voice Controls</h3>
                
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm text-gray-600">
                      {progressInfo.current} / {progressInfo.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(progressInfo.current / progressInfo.total) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Current Recognition */}
                {voiceState.currentText && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">You&apos;re saying:</p>
                    <p className="text-blue-700 text-sm mt-1">{voiceState.currentText}</p>
                    {voiceState.confidence > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-blue-600">
                          <span>Confidence</span>
                          <span>{Math.round(voiceState.confidence * 100)}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300" 
                            style={{ width: `${voiceState.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {voiceState.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{voiceState.error}</p>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={toggleListening}
                    disabled={voiceState.isSpeaking}
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium ${
                      voiceState.isListening
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {voiceState.isListening ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Listening
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Listening
                      </>
                    )}
                  </button>

                  <button
                    onClick={toggleSpeaking}
                    disabled={!voiceState.isSpeaking}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {voiceState.isSpeaking ? (
                      <>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Stop AI Voice
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        AI Not Speaking
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {showTranscript ? 'Hide' : 'Show'} Transcript
                  </button>

                  <button
                    onClick={restartConversation}
                    className="w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-orange-100 text-orange-700 hover:bg-orange-200"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart Assessment
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Tips:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Speak clearly and naturally</li>
                    <li>• Wait for the AI to finish speaking</li>
                    <li>• You can pause/resume anytime</li>
                    <li>• Be specific about your symptoms</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Conversation Display */}
            <div className="lg:col-span-2">
              {showTranscript && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 bg-green-50 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Voice Conversation</h3>
                  </div>
                  
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-lg px-4 py-3 rounded-lg ${
                          message.isBot 
                            ? 'bg-gray-100 text-gray-900' 
                            : 'bg-green-600 text-white'
                        }`}>
                          <div className="flex items-start space-x-2">
                            {message.isBot ? (
                              <Radio className="h-4 w-4 mt-1 text-gray-600" />
                            ) : (
                              <User className="h-4 w-4 mt-1 text-green-100" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm">{message.text}</p>
                              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                                <span>{message.timestamp.toLocaleTimeString()}</span>
                                {message.confidence && (
                                  <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                                )}
                                {message.audioProcessingTime && (
                                  <span>{Math.round(message.audioProcessingTime)}ms</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!showTranscript && (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <Radio className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Voice Assessment in Progress</h3>
                  <p className="text-gray-600">
                    Listen carefully to the AI questions and respond naturally. 
                    Your conversation is being processed in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Report Generation Phase
  if (currentPhase === 'report-generation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <FileText className="h-12 w-12 text-green-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Voice Assessment</h2>
            <p className="text-gray-600 mb-6">
              Our AI is processing your voice conversation and generating a comprehensive health report 
              with intelligent symptom analysis for your doctor.
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

  // Waiting for Doctor Phase
  if (currentPhase === 'waiting-for-doctor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Voice Assessment Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your intelligent health report has been generated from your voice conversation. 
              Connecting you with an available doctor now...
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

  // Video Call Phase - Reuse existing video interface
  if (currentPhase === 'video-call') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Video Call Interface */}
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