'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useWebRTC } from '../../hooks/useWebRTC';
import { PatientReport } from '../../lib/reportGenerator';
import { 
  Shield,
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
  Clock,
  Users,
  FileText,
  Edit3,
  Save,
  Printer,
  Activity,
  Heart,
  Thermometer,
  TrendingUp,
  Brain
} from 'lucide-react';

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  date: Date;
  items: PrescriptionItem[];
  notes: string;
}

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
  
  // UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'prescription'>('overview');
  const [currentPatientReport, setCurrentPatientReport] = useState<PatientReport | null>(null);
  const [prescription, setPrescription] = useState<Prescription>({
    id: '',
    patientName: '',
    doctorName: user?.name || '',
    date: new Date(),
    items: [],
    notes: ''
  });
  const [newMedication, setNewMedication] = useState<PrescriptionItem>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  
  const {
    callState,
    incomingCall,
    currentCallParticipant,
    localVideoRef,
    remoteVideoRef,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTC(user?.id || '', user?.name || '', 'doctor');

  useEffect(() => {
    if (!user || user.role !== 'doctor') {
      router.push('/login/doctor');
      return;
    }
  }, [user, router]);

  // Handle incoming call with patient report
  useEffect(() => {
    if (incomingCall && incomingCall.patientReport) {
      setCurrentPatientReport(incomingCall.patientReport);
      
      // Auto-populate prescription from AI chatbot report
      const report = incomingCall.patientReport;
      const prescriptionItems: PrescriptionItem[] = [];
      
      // If the AI generated a prescription, use those medications
      if (report.prescription && report.prescription.medications) {
        prescriptionItems.push(...report.prescription.medications.map(med => ({
          medication: `${med.brandName || med.genericName} ${med.strength}`,
          dosage: med.dosageForm.charAt(0).toUpperCase() + med.dosageForm.slice(1),
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions
        })));
      }
      
      // Create comprehensive prescription notes from AI diagnosis
      let prescriptionNotes = '';
      
      // Add primary diagnosis
      if (report.assessmentSummary) {
        prescriptionNotes += `DIAGNOSIS: ${report.assessmentSummary.primaryConcern}\n`;
        prescriptionNotes += `Duration: ${report.assessmentSummary.duration}\n`;
        prescriptionNotes += `Severity: ${report.assessmentSummary.severity}\n`;
        prescriptionNotes += `Urgency: ${report.assessmentSummary.urgencyLevel}\n\n`;
      }
      
      // Add detailed symptoms analysis
      if (report.symptoms) {
        prescriptionNotes += `SYMPTOMS ANALYSIS:\n`;
        if (report.symptoms.primary?.length > 0) {
          prescriptionNotes += `Primary Symptoms: ${report.symptoms.primary.join(', ')}\n`;
        }
        if (report.symptoms.secondary?.length > 0) {
          prescriptionNotes += `Additional Symptoms: ${report.symptoms.secondary.join(', ')}\n`;
        }
        if (report.symptoms.painLevel) {
          prescriptionNotes += `Pain Level: ${report.symptoms.painLevel}/10\n`;
        }
        if (report.symptoms.systemsAffected?.length > 0) {
          prescriptionNotes += `Systems Affected: ${report.symptoms.systemsAffected.join(', ')}\n`;
        }
        prescriptionNotes += '\n';
      }
      
      // Add vital signs
      if (report.vitals) {
        prescriptionNotes += `VITAL SIGNS:\n`;
        if (report.vitals.temperature) prescriptionNotes += `Temperature: ${report.vitals.temperature}\n`;
        if (report.vitals.bloodPressure) prescriptionNotes += `Blood Pressure: ${report.vitals.bloodPressure}\n`;
        if (report.vitals.heartRate) prescriptionNotes += `Heart Rate: ${report.vitals.heartRate}\n`;
        prescriptionNotes += `Vital Status: ${report.vitals.status}\n\n`;
      }
      
      // Add risk assessment
      if (report.riskAssessment) {
        prescriptionNotes += `RISK ASSESSMENT: ${report.riskAssessment.level.toUpperCase()}\n`;
        if (report.riskAssessment.factors?.length > 0) {
          prescriptionNotes += `Risk Factors: ${report.riskAssessment.factors.join(', ')}\n`;
        }
        if (report.riskAssessment.redFlags?.length > 0) {
          prescriptionNotes += `Red Flags: ${report.riskAssessment.redFlags.join(', ')}\n`;
        }
        prescriptionNotes += '\n';
      }
      
      // Add AI recommendations
      if (report.recommendations?.length > 0) {
        prescriptionNotes += `AI RECOMMENDATIONS:\n`;
        report.recommendations.forEach((rec, index) => {
          prescriptionNotes += `${index + 1}. ${rec}\n`;
        });
        prescriptionNotes += '\n';
      }
      
      // Add prescription instructions if available
      if (report.prescription && report.prescription.instructions?.length > 0) {
        prescriptionNotes += `PRESCRIPTION INSTRUCTIONS:\n`;
        report.prescription.instructions.forEach((instruction, index) => {
          prescriptionNotes += `${index + 1}. ${instruction}\n`;
        });
      }
      
      setPrescription(prev => ({
        ...prev,
        id: `PRESC_${Date.now()}`,
        patientName: report.patientName || '',
        date: new Date(),
        items: prescriptionItems,
        notes: prescriptionNotes
      }));
    }
  }, [incomingCall]);

  const handleAcceptCall = () => {
    acceptCall();
    setActiveTab('report'); // Switch to report view when call starts
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const addMedication = () => {
    if (newMedication.medication && newMedication.dosage) {
      setPrescription(prev => ({
        ...prev,
        items: [...prev.items, { ...newMedication }]
      }));
      setNewMedication({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const removeMedication = (index: number) => {
    setPrescription(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const savePrescription = async () => {
    if (!user) {
      alert('User not authenticated. Please log in again.');
      return;
    }
    
    try {
      // Import the pharmacy service
      const { PharmacyService } = await import('../../lib/pharmacyService');
      
      // Show loading state
      const loadingAlert = document.createElement('div');
      loadingAlert.innerHTML = 'Sending prescription to pharmacy...';
      loadingAlert.className = 'fixed top-4 right-4 bg-blue-500 text-white p-3 rounded shadow-lg z-50';
      document.body.appendChild(loadingAlert);
      
      // Send to pharmacy
      const result = await PharmacyService.sendPrescriptionToPharmacy({
        patientName: prescription.patientName,
        doctorName: prescription.doctorName,
        doctorId: user.id || 'DOC001',
        medications: prescription.items,
        notes: prescription.notes,
        priority: prescription.items.some(item => 
          item.instructions.toLowerCase().includes('urgent') ||
          item.instructions.toLowerCase().includes('emergency')
        ) ? 'urgent' : 'medium'
      });
      
      // Remove loading alert
      document.body.removeChild(loadingAlert);
      
      if (result.success) {
        // Show success message with prescription ID
        const successDiv = document.createElement('div');
        successDiv.innerHTML = `
          <div class="bg-green-500 text-white p-4 rounded-lg shadow-lg">
            <h3 class="font-bold">✅ Prescription Sent Successfully!</h3>
            <p class="mt-2">${result.message}</p>
            <p class="text-sm mt-1 opacity-90">The pharmacy will be notified immediately.</p>
          </div>
        `;
        successDiv.className = 'fixed top-4 right-4 z-50';
        document.body.appendChild(successDiv);
        
        // Auto-remove success message after 5 seconds
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 5000);
        
        // Reset prescription form for next patient
        setPrescription({
          id: '',
          patientName: '',
          doctorName: user.name || '',
          date: new Date(),
          items: [],
          notes: ''
        });
        
      } else {
        alert(`Failed to send prescription: ${result.message}`);
      }
      
    } catch (error) {
      console.error('Error sending prescription to pharmacy:', error);
      alert('Failed to send prescription to pharmacy. Please try again.');
    }
  };

  const printPrescription = () => {
    // In a real app, this would generate a PDF
    const prescriptionText = `
PRESCRIPTION
===========

Patient: ${prescription.patientName}
Doctor: ${prescription.doctorName}
Date: ${prescription.date.toLocaleDateString()}

MEDICATIONS:
${prescription.items.map((item, index) => `
${index + 1}. ${item.medication}
   Dosage: ${item.dosage}
   Frequency: ${item.frequency}
   Duration: ${item.duration}
   Instructions: ${item.instructions}
`).join('')}

Additional Notes:
${prescription.notes}

Doctor's Signature: ___________________
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre>${prescriptionText}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!callState.connectionState ? (
          // Dashboard Overview when not in call
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Welcome Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, Dr. {user.name}!</h2>
                <p className="text-gray-600">Ready to help your patients today.</p>
              </div>

              {/* Recent Patients */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Patients</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentPatients.map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-500">{patient.condition}</p>
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
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Upcoming Appointments */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Today@apos;s Schedule</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment, index) => (
                      <div key={index} className="flex items-start">
                        <Clock className="h-4 w-4 text-gray-400 mt-1" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{appointment.time}</p>
                          <p className="text-sm text-gray-500">{appointment.patient}</p>
                          <p className="text-xs text-gray-400">{appointment.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Today&apos;s Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Patients Seen</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Video Calls</span>
                    <span className="text-sm font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Prescriptions</span>
                    <span className="text-sm font-medium">15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Video Call Interface
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
            {/* Video Call Area */}
            <div className="xl:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Remote Video (Patient) */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentCallParticipant || 'Patient'}
                    </span>
                  </div>
                </div>

                {/* Local Video (Doctor) */}
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
              </div>

              {/* Call Controls */}
              <div className="flex justify-center mt-4">
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
            </div>

            {/* Side Panel */}
            <div className="xl:col-span-2 bg-white rounded-lg shadow overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="h-4 w-4 inline mr-2" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'report'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Patient Report
                  </button>
                  <button
                    onClick={() => setActiveTab('prescription')}
                    className={`px-4 py-2 text-sm font-medium ${
                      activeTab === 'prescription'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Edit3 className="h-4 w-4 inline mr-2" />
                    Prescription
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 h-[calc(100%-4rem)] overflow-y-auto">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Patient Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p><strong>Name:</strong> {currentCallParticipant || 'Unknown'}</p>
                      <p><strong>Call Started:</strong> {new Date().toLocaleTimeString()}</p>
                      <p><strong>Connection:</strong> {callState.connectionState || 'Establishing...'}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'report' && currentPatientReport && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Health Assessment Report</h3>
                    
                    {/* Patient Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Patient Summary</h4>
                      <p><strong>Name:</strong> {currentPatientReport.patientName}</p>
                      <p><strong>Primary Concern:</strong> {currentPatientReport.assessmentSummary.primaryConcern}</p>
                      <p><strong>Duration:</strong> {currentPatientReport.assessmentSummary.duration}</p>
                      <p><strong>Severity:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          currentPatientReport.assessmentSummary.severity === 'severe' 
                            ? 'bg-red-100 text-red-800'
                            : currentPatientReport.assessmentSummary.severity === 'moderate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {currentPatientReport.assessmentSummary.severity}
                        </span>
                      </p>
                    </div>

                    {/* Symptoms */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Symptoms Analysis</h4>
                      <div className="space-y-2">
                        <p><strong>Primary Symptoms:</strong> {currentPatientReport.symptoms.primary.join(', ')}</p>
                        <p><strong>Additional Symptoms:</strong> {currentPatientReport.symptoms.secondary.join(', ')}</p>
                        <p><strong>Pain Level:</strong> {currentPatientReport.symptoms.painLevel}/10</p>
                        <p><strong>Systems Affected:</strong> {currentPatientReport.symptoms.systemsAffected.join(', ')}</p>
                      </div>
                    </div>

                    {/* Vital Signs */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Vital Signs
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {currentPatientReport.vitals.temperature && (
                          <div className="flex items-center">
                            <Thermometer className="h-4 w-4 mr-2 text-red-500" />
                            <span className="text-sm">{currentPatientReport.vitals.temperature}</span>
                          </div>
                        )}
                        {currentPatientReport.vitals.heartRate && (
                          <div className="flex items-center">
                            <Heart className="h-4 w-4 mr-2 text-pink-500" />
                            <span className="text-sm">{currentPatientReport.vitals.heartRate}</span>
                          </div>
                        )}
                        {currentPatientReport.vitals.bloodPressure && (
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">{currentPatientReport.vitals.bloodPressure}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm mt-2">
                        <strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          currentPatientReport.vitals.status === 'abnormal'
                            ? 'bg-red-100 text-red-800'
                            : currentPatientReport.vitals.status === 'normal'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {currentPatientReport.vitals.status}
                        </span>
                      </p>
                    </div>

                    {/* Risk Assessment */}
                    <div className={`rounded-lg p-4 ${
                      currentPatientReport.riskAssessment.level === 'critical'
                        ? 'bg-red-50 border border-red-200'
                        : currentPatientReport.riskAssessment.level === 'high'
                        ? 'bg-orange-50 border border-orange-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <h4 className="font-semibold mb-2">Risk Assessment</h4>
                      <p><strong>Level:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          currentPatientReport.riskAssessment.level === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : currentPatientReport.riskAssessment.level === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {currentPatientReport.riskAssessment.level.toUpperCase()}
                        </span>
                      </p>
                      {currentPatientReport.riskAssessment.redFlags.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-700 font-medium">⚠️ Red Flags:</p>
                          <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                            {currentPatientReport.riskAssessment.redFlags.map((flag, index) => (
                              <li key={index}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {currentPatientReport.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'prescription' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Digital Prescription</h3>
                      <div className="space-x-2">
                        {currentPatientReport && currentPatientReport.prescription && (
                          <button
                            onClick={() => {
                              const report = currentPatientReport;
                              const prescriptionItems: PrescriptionItem[] = [];
                              
                              // Populate from AI prescription
                              if (report.prescription && report.prescription.medications) {
                                prescriptionItems.push(...report.prescription.medications.map(med => ({
                                  medication: `${med.brandName || med.genericName} ${med.strength}`,
                                  dosage: med.dosageForm.charAt(0).toUpperCase() + med.dosageForm.slice(1),
                                  frequency: med.frequency,
                                  duration: med.duration,
                                  instructions: med.instructions
                                })));
                              }
                              
                              // Update prescription with AI data
                              setPrescription(prev => ({
                                ...prev,
                                items: prescriptionItems
                              }));
                            }}
                            className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            <Brain className="h-4 w-4 mr-1" />
                            Use AI Prescription
                          </button>
                        )}
                        <button
                          onClick={savePrescription}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Send to Pharmacy
                        </button>
                        <button
                          onClick={printPrescription}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </button>
                      </div>
                    </div>

                    {/* Prescription Header */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Patient:</strong> {prescription.patientName}</p>
                          <p><strong>Date:</strong> {prescription.date.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Doctor:</strong> {prescription.doctorName}</p>
                          <p><strong>Prescription ID:</strong> {prescription.id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Add New Medication */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Add Medication</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Medication name"
                          value={newMedication.medication}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, medication: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={newMedication.frequency}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Duration"
                            value={newMedication.duration}
                            onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <textarea
                          placeholder="Special instructions"
                          value={newMedication.instructions}
                          onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={addMedication}
                          disabled={!newMedication.medication || !newMedication.dosage}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Medication
                        </button>
                      </div>
                    </div>

                    {/* Prescribed Medications */}
                    {prescription.items.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Prescribed Medications</h4>
                        {prescription.items.map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium">{item.medication}</p>
                                <p className="text-sm text-gray-600">{item.dosage} - {item.frequency}</p>
                                <p className="text-sm text-gray-600">Duration: {item.duration}</p>
                                {item.instructions && (
                                  <p className="text-sm text-gray-500 mt-1">{item.instructions}</p>
                                )}
                              </div>
                              <button
                                onClick={() => removeMedication(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Additional Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={prescription.notes}
                        onChange={(e) => setPrescription(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes, follow-up instructions, etc."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <Phone className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Incoming Patient Call</h3>
              <p className="text-sm text-gray-600 mb-2">
                {incomingCall.fromName} is requesting a consultation
              </p>
              {incomingCall.patientReport && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-left">
                  <p className="text-sm text-blue-900">
                    <strong>Primary Concern:</strong> {incomingCall.patientReport.assessmentSummary.primaryConcern}
                  </p>
                  <p className="text-sm text-blue-900">
                    <strong>Urgency:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                      incomingCall.patientReport.assessmentSummary.urgencyLevel === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : incomingCall.patientReport.assessmentSummary.urgencyLevel === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {incomingCall.patientReport.assessmentSummary.urgencyLevel}
                    </span>
                  </p>
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={rejectCall}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptCall}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Accept Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}