'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { PharmacyService, PharmacyPrescription, PharmacyNotification } from '../../lib/pharmacyService';
import { 
  ArrowLeft,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Phone,
  Package,
  Eye,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';

// Extended interface for display purposes
interface ExtendedPharmacyPrescription extends PharmacyPrescription {
  patientAge?: number;
  patientPhone?: string;
  doctorPhone?: string;
  diagnosis?: string;
  instructions?: string;
  estimatedCost?: number;
}

export default function PharmacyPrescriptions() {
  const { user } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<ExtendedPharmacyPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<ExtendedPharmacyPrescription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'ready' | 'completed'>('all');

  useEffect(() => {
    if (!user || user.role !== 'pharmacist') {
      router.push('/login/pharmacy');
      return;
    }

  const handleNewNotification = (notification: PharmacyNotification) => {
      // Only handle pharmacy-targeted notifications here
      if (notification.type === 'new_prescription' || notification.type === 'urgent_prescription') {
        // reload list so the new prescription appears in the queue
        loadPrescriptions();
        // show a toast/modal to the pharmacist asking to Accept / Ignore
        setIncomingNotification(notification);
      }
    };

    // Load prescriptions and subscribe to notifications
    loadPrescriptions();
    const unsubscribe = PharmacyService.subscribeToNotifications(handleNewNotification);
    return () => unsubscribe();
  }, [user, router]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      // Fetch prescriptions from PharmacyService
      const fetchedPrescriptions = await PharmacyService.getPharmacyPrescriptions();
      
      // Convert to extended format with additional display fields
      const extendedPrescriptions: ExtendedPharmacyPrescription[] = fetchedPrescriptions.map(p => ({
        ...p,
        patientAge: 45, // Mock age - in real app would come from patient data
        patientPhone: '+91-9876543210', // Mock phone
        doctorPhone: '+91-9876543211', // Mock doctor phone
        diagnosis: p.notes, // Use notes as diagnosis for display
        instructions: p.notes,
        estimatedCost: p.totalCost || Math.floor(Math.random() * 500) + 100 // Use existing cost or generate mock
      }));
      
      setPrescriptions(extendedPrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrescriptionStatus = async (id: string, status: ExtendedPharmacyPrescription['status']) => {
    try {
      await PharmacyService.updatePrescriptionStatus(id, status);
      setPrescriptions(prev => 
        prev.map(p => p.id === id ? { ...p, status } : p)
      );
      setSelectedPrescription(null);
    } catch (error) {
      console.error('Error updating prescription status:', error);
      alert('Error updating prescription status');
    }
  };

  // Incoming notification state and actions
  const [incomingNotification, setIncomingNotification] = useState<PharmacyNotification | null>(null);

  const acceptIncomingPrescription = async (notification: PharmacyNotification) => {
    // Mark notification read and open the prescription (set to processing)
    if (notification?.prescriptionId) {
      await PharmacyService.markNotificationAsRead(notification.id);
      await updatePrescriptionStatus(notification.prescriptionId, 'processing');
      // find and open prescription
      const found = prescriptions.find(p => p.id === notification.prescriptionId);
      if (found) setSelectedPrescription(found);
    }
    setIncomingNotification(null);
  };

  const ignoreIncomingPrescription = async (notification: PharmacyNotification) => {
    // mark notification read and keep prescription in queue
    if (notification?.id) {
      await PharmacyService.markNotificationAsRead(notification.id);
      // just close the toast, prescription remains in the list
    }
    setIncomingNotification(null);
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesSearch = prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prescription.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ExtendedPharmacyPrescription['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ExtendedPharmacyPrescription['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4" />;
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Incoming notification toast/modal */}
      {incomingNotification && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-white border shadow p-4 rounded-lg w-80">
            <div className="flex items-start">
              <div className="flex-1">
                <div className="text-sm font-semibold">{incomingNotification.title}</div>
                <div className="text-xs text-gray-600 mt-1">{incomingNotification.message}</div>
                <div className="mt-3 flex space-x-2">
                  <button onClick={() => acceptIncomingPrescription(incomingNotification)} className="flex-1 px-3 py-2 bg-green-600 text-white rounded">Accept</button>
                  <button onClick={() => ignoreIncomingPrescription(incomingNotification)} className="flex-1 px-3 py-2 bg-gray-100 rounded">Ignore</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-6 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/pharmacy/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Prescription Management</h1>
                <p className="text-sm text-gray-600">Review and process doctor prescriptions</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600">
                {filteredPrescriptions.length} prescription(s)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by patient name, doctor, or prescription ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'processing' | 'ready' | 'completed')}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prescription List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredPrescriptions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                filteredPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPrescription(prescription)}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{prescription.patientName}</h3>
                            <p className="text-sm text-gray-600">Age: {prescription.patientAge} • ID: {prescription.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
                            {getStatusIcon(prescription.status)}
                            <span className="ml-1 capitalize">{prescription.status}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          Dr: {prescription.doctorName}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {prescription.patientPhone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {prescription.date.toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="h-4 w-4 mr-2" />
                          ₹{prescription.estimatedCost}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-900 mb-2">Medications:</p>
                        <div className="space-y-1">
                          {prescription.medications.slice(0, 2).map((med, index) => (
                            <p key={index} className="text-sm text-gray-600">
                              • {med.name} - {med.dosage} {med.frequency}
                            </p>
                          ))}
                          {prescription.medications.length > 2 && (
                            <p className="text-sm text-gray-500">
                              + {prescription.medications.length - 2} more medications
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Prescription Details Panel */}
            <div className="lg:col-span-1">
              {selectedPrescription ? (
                <div className="bg-white rounded-lg shadow-sm border sticky top-8">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Prescription Details</h3>
                      <button
                        onClick={() => setSelectedPrescription(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Patient Information */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{selectedPrescription.patientName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Age:</span>
                            <span className="font-medium">{selectedPrescription.patientAge}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{selectedPrescription.patientPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Information */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Doctor Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{selectedPrescription.doctorName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{selectedPrescription.doctorPhone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnosis */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Diagnosis</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {selectedPrescription.diagnosis}
                        </p>
                      </div>

                      {/* Medications */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Medications</h4>
                        <div className="space-y-3">
                          {selectedPrescription.medications.map((med, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <h5 className="font-medium text-gray-900 mb-2">{med.name}</h5>
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>Dosage: {med.dosage}</p>
                                <p>Frequency: {med.frequency}</p>
                                <p>Duration: {med.duration}</p>
                                <p>Quantity: {med.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Instructions */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Special Instructions</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {selectedPrescription.instructions}
                        </p>
                      </div>

                      {/* Estimated Cost */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Estimated Cost</h4>
                        <p className="text-2xl font-bold text-green-600">₹{selectedPrescription.estimatedCost}</p>
                      </div>

                      {/* Action Buttons */}
                      {selectedPrescription.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'processing')}
                            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Accept
                          </button>
                          <button
                            onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'completed')}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </button>
                        </div>
                      )}

                      {selectedPrescription.status === 'processing' && (
                        <button
                          onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'ready')}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Mark as Ready
                        </button>
                      )}

                      {selectedPrescription.status === 'ready' && (
                        <button
                          onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'completed')}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-12 text-center sticky top-8">
                  <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Prescription</h3>
                  <p className="text-gray-600">Click on any prescription to view its details and take action.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}