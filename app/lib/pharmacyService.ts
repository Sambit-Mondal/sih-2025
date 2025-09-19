// Pharmacy integration service for handling prescriptions from doctors
export interface PharmacyPrescription {
  id: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  date: Date;
  medications: PharmacyMedication[];
  notes: string;
  status: 'pending' | 'processing' | 'ready' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalCost?: number;
  estimatedReadyTime?: Date;
}

export interface PharmacyMedication {
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  price?: number;
  available?: boolean;
  substitutes?: string[];
}

export interface PharmacyNotification {
  id: string;
  type: 'new_prescription' | 'prescription_update' | 'low_stock' | 'urgent_prescription';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  prescriptionId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Mock pharmacy data
const mockPrescriptions: PharmacyPrescription[] = [
  {
    id: 'RX001',
    patientName: 'John Smith',
    doctorName: 'Sarah Johnson',
    doctorId: 'DOC001',
    date: new Date(),
    medications: [
      {
        name: 'Amoxicillin 500mg',
        dosage: '500mg',
        frequency: '3 times daily',
        duration: '7 days',
        instructions: 'Take with food',
        quantity: 21,
        price: 15.99,
        available: true
      }
    ],
    notes: 'Patient has mild penicillin allergy - monitor for reactions',
    status: 'pending',
    priority: 'medium',
    totalCost: 15.99
  }
];

const mockNotifications: PharmacyNotification[] = [];

// Simulated real-time notification system
const notificationCallbacks: ((notification: PharmacyNotification) => void)[] = [];

export class PharmacyService {
  // Subscribe to real-time notifications
  static subscribeToNotifications(callback: (notification: PharmacyNotification) => void): () => void {
    notificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = notificationCallbacks.indexOf(callback);
      if (index > -1) {
        notificationCallbacks.splice(index, 1);
      }
    };
  }

  // Send prescription from doctor to pharmacy
  static async sendPrescriptionToPharmacy(prescription: {
    patientName: string;
    doctorName: string;
    doctorId: string;
    medications: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    notes: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<{success: boolean; prescriptionId?: string; message: string}> {
    
    try {
      // Generate unique prescription ID
      const prescriptionId = `RX${Date.now()}`;
      
      // Convert doctor prescription format to pharmacy format
      const pharmacyPrescription: PharmacyPrescription = {
        id: prescriptionId,
        patientName: prescription.patientName,
        doctorName: prescription.doctorName,
        doctorId: prescription.doctorId,
        date: new Date(),
        medications: prescription.medications.map(med => ({
          name: med.medication,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions,
          quantity: this.calculateQuantity(med.frequency, med.duration),
          available: true // Will be checked against inventory
        })),
        notes: prescription.notes,
        status: 'pending',
        priority: prescription.priority || 'medium'
      };

      // Add to mock database
      mockPrescriptions.push(pharmacyPrescription);

      // Create notification for pharmacy
      const notification: PharmacyNotification = {
        id: `NOT${Date.now()}`,
        type: prescription.priority === 'urgent' ? 'urgent_prescription' : 'new_prescription',
        title: prescription.priority === 'urgent' 
          ? '🚨 Urgent Prescription Received' 
          : '📋 New Prescription Received',
        message: `New prescription from ${prescription.doctorName} for ${prescription.patientName}`,
        timestamp: new Date(),
        read: false,
        prescriptionId,
        priority: prescription.priority || 'medium'
      };

      // Add to notifications
      mockNotifications.unshift(notification);

      // Notify all subscribers
      notificationCallbacks.forEach(callback => callback(notification));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        prescriptionId,
        message: `Prescription sent successfully to pharmacy. Reference ID: ${prescriptionId}`
      };

    } catch (error) {
      console.error('Error sending prescription to pharmacy:', error);
      return {
        success: false,
        message: 'Failed to send prescription to pharmacy. Please try again.'
      };
    }
  }

  // Get all prescriptions for pharmacy dashboard
  static async getPharmacyPrescriptions(status?: string): Promise<PharmacyPrescription[]> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
    
    if (status) {
      return mockPrescriptions.filter(p => p.status === status);
    }
    
    return [...mockPrescriptions].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Get notifications for pharmacy
  static async getPharmacyNotifications(unreadOnly = false): Promise<PharmacyNotification[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (unreadOnly) {
      return mockNotifications.filter(n => !n.read);
    }
    
    return [...mockNotifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Update prescription status
  static async updatePrescriptionStatus(
    prescriptionId: string, 
    status: PharmacyPrescription['status'],
    estimatedReadyTime?: Date
  ): Promise<boolean> {
    const prescription = mockPrescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
      prescription.status = status;
      if (estimatedReadyTime) {
        prescription.estimatedReadyTime = estimatedReadyTime;
      }
      
      // Create status update notification if needed
      if (status === 'ready') {
        const notification: PharmacyNotification = {
          id: `NOT${Date.now()}`,
          type: 'prescription_update',
          title: '✅ Prescription Ready for Pickup',
          message: `Prescription ${prescriptionId} for ${prescription.patientName} is ready`,
          timestamp: new Date(),
          read: false,
          prescriptionId,
          priority: 'medium'
        };
        
        mockNotifications.unshift(notification);
        notificationCallbacks.forEach(callback => callback(notification));
      }
      
      return true;
    }
    return false;
  }

  // Helper method to calculate medication quantity based on frequency and duration
  private static calculateQuantity(frequency: string, duration: string): number {
    // Basic calculation - in real app would be more sophisticated
    const frequencyNum = this.extractNumber(frequency) || 1;
    const durationNum = this.extractNumber(duration) || 1;
    
    // Assume duration is in days
    return frequencyNum * durationNum;
  }

  private static extractNumber(text: string): number {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  }

  // Get prescription analytics
  static async getPrescriptionAnalytics(): Promise<{
    totalPrescriptions: number;
    pendingPrescriptions: number;
    completedToday: number;
    urgentPrescriptions: number;
    averageProcessingTime: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return {
      totalPrescriptions: mockPrescriptions.length,
      pendingPrescriptions: mockPrescriptions.filter(p => p.status === 'pending').length,
      completedToday: mockPrescriptions.filter(p => 
        p.status === 'completed' && p.date >= todayStart
      ).length,
      urgentPrescriptions: mockPrescriptions.filter(p => p.priority === 'urgent').length,
      averageProcessingTime: 45 // minutes - mock data
    };
  }
}

// Export mock data for testing
export { mockPrescriptions, mockNotifications };