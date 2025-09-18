// Patient report generation system
// Compiles chatbot conversation data into structured medical report

import { PatientData, ChatMessage } from './chatbot';

export interface PatientReport {
  id: string;
  patientName: string;
  generatedAt: Date;
  assessmentSummary: AssessmentSummary;
  symptoms: SymptomAnalysis;
  riskAssessment: RiskAssessment;
  recommendations: string[];
  conversationLog: ChatMessage[];
  vitals: VitalSigns;
  prescription?: MedicalPrescription;
}

export interface MedicalPrescription {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'O';
  doctorName: string;
  doctorLicense: string;
  clinicName: string;
  clinicAddress: string;
  prescriptionDate: Date;
  medications: PrescribedMedication[];
  diagnosis: string;
  instructions: string[];
  followUpDate?: Date;
  emergencyContact?: string;
}

export interface PrescribedMedication {
  genericName: string;
  brandName?: string;
  strength: string;
  dosageForm: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'inhaler';
  quantity: number;
  frequency: string;
  duration: string;
  instructions: string;
  beforeFood?: boolean;
  afterFood?: boolean;
  substitutable: boolean;
}

export interface AssessmentSummary {
  primaryConcern: string;
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFindings: string[];
}

export interface SymptomAnalysis {
  primary: string[];
  secondary: string[];
  associated: string[];
  painLevel: number;
  systemsAffected: string[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  redFlags: string[];
  immediateAction: boolean;
}

export interface VitalSigns {
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  status: 'normal' | 'abnormal' | 'unknown';
}

// Medical knowledge base for assessment
const SYMPTOM_SYSTEMS: { [key: string]: string } = {
  'fever': 'Infectious/Immune',
  'cough': 'Respiratory',
  'shortness of breath': 'Respiratory/Cardiovascular',
  'chest pain': 'Cardiovascular/Respiratory',
  'headache': 'Neurological',
  'dizziness': 'Neurological/Cardiovascular',
  'nausea': 'Gastrointestinal',
  'vomiting': 'Gastrointestinal',
  'abdominal pain': 'Gastrointestinal',
  'back pain': 'Musculoskeletal',
  'joint pain': 'Musculoskeletal',
  'skin rash': 'Dermatological',
  'fatigue': 'General'
};

// Common medications database for prescription generation
const COMMON_MEDICATIONS: { [key: string]: PrescribedMedication[] } = {
  'fever': [
    {
      genericName: 'Paracetamol',
      brandName: 'Crocin',
      strength: '500mg',
      dosageForm: 'tablet',
      quantity: 10,
      frequency: 'TDS (Three times daily)',
      duration: '3-5 days',
      instructions: 'Take with water when fever persists',
      afterFood: true,
      substitutable: true
    }
  ],
  'cough': [
    {
      genericName: 'Dextromethorphan',
      brandName: 'Benadryl',
      strength: '10mg/5ml',
      dosageForm: 'syrup',
      quantity: 100,
      frequency: 'TDS',
      duration: '5-7 days',
      instructions: 'Take 2 teaspoons three times daily',
      afterFood: true,
      substitutable: true
    }
  ],
  'headache': [
    {
      genericName: 'Ibuprofen',
      brandName: 'Brufen',
      strength: '400mg',
      dosageForm: 'tablet',
      quantity: 6,
      frequency: 'BD (Twice daily)',
      duration: '3 days',
      instructions: 'Take only when needed for pain',
      afterFood: true,
      substitutable: true
    }
  ],
  'abdominal pain': [
    {
      genericName: 'Dicyclomine',
      brandName: 'Cyclopam',
      strength: '10mg',
      dosageForm: 'tablet',
      quantity: 10,
      frequency: 'TDS',
      duration: '3-5 days',
      instructions: 'Take for abdominal cramps and pain',
      beforeFood: true,
      substitutable: true
    }
  ]
};

const RED_FLAG_SYMPTOMS = [
  'severe chest pain',
  'difficulty breathing',
  'high fever',
  'severe headache',
  'loss of consciousness',
  'severe abdominal pain',
  'blood in stool',
  'blood in urine',
  'severe allergic reaction'
];

const URGENCY_KEYWORDS = {
  critical: ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding', 'stroke'],
  high: ['severe pain', 'high fever', 'severe headache', 'blood', 'allergic reaction'],
  medium: ['moderate pain', 'persistent symptoms', 'worsening'],
  low: ['mild', 'occasional', 'minor']
};

export class PatientReportGenerator {
  
  public generateReport(patientData: PatientData, conversationHistory: ChatMessage[]): PatientReport {
    const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const symptoms = this.analyzeSymptoms(patientData);
    const riskAssessment = this.assessRisk(patientData, symptoms);
    const vitals = this.analyzeVitals(patientData);
    const assessmentSummary = this.generateAssessmentSummary(patientData, riskAssessment);
    const recommendations = this.generateRecommendations(riskAssessment, symptoms);
    const prescription = this.generatePrescription(patientData, symptoms, riskAssessment);

    const report: PatientReport = {
      id: reportId,
      patientName: patientData.name,
      generatedAt: new Date(),
      assessmentSummary,
      symptoms,
      riskAssessment,
      recommendations,
      conversationLog: conversationHistory,
      vitals,
      prescription
    };

    return report;
  }

  private analyzeSymptoms(patientData: PatientData): SymptomAnalysis {
    const allSymptoms = [
      ...(patientData.primarySymptoms || []),
      ...(patientData.additionalSymptoms || [])
    ].map(s => s.toLowerCase());

    const systemsAffected = new Set<string>();
    
    allSymptoms.forEach(symptom => {
      Object.keys(SYMPTOM_SYSTEMS).forEach(key => {
        if (symptom.includes(key)) {
          systemsAffected.add(SYMPTOM_SYSTEMS[key]);
        }
      });
    });

    return {
      primary: patientData.primarySymptoms || [],
      secondary: patientData.additionalSymptoms || [],
      associated: this.findAssociatedSymptoms(allSymptoms),
      painLevel: patientData.painLevel || 0,
      systemsAffected: Array.from(systemsAffected)
    };
  }

  private findAssociatedSymptoms(symptoms: string[]): string[] {
    const associated: string[] = [];
    const symptomText = symptoms.join(' ').toLowerCase();
    
    // Common symptom associations
    if (symptomText.includes('fever') && symptomText.includes('cough')) {
      associated.push('Possible respiratory infection');
    }
    if (symptomText.includes('headache') && symptomText.includes('fever')) {
      associated.push('Possible systemic infection');
    }
    if (symptomText.includes('nausea') && symptomText.includes('dizziness')) {
      associated.push('Possible vestibular or metabolic issue');
    }
    
    return associated;
  }

  private assessRisk(patientData: PatientData, symptoms: SymptomAnalysis): RiskAssessment {
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const factors: string[] = [];
    const redFlags: string[] = [];
    let immediateAction = false;

    const allSymptoms = symptoms.primary.concat(symptoms.secondary).join(' ').toLowerCase();
    
    // Check for red flags
    RED_FLAG_SYMPTOMS.forEach(redFlag => {
      if (allSymptoms.includes(redFlag.toLowerCase())) {
        redFlags.push(redFlag);
        riskLevel = 'critical';
        immediateAction = true;
      }
    });

    // Check urgency keywords
    Object.entries(URGENCY_KEYWORDS).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (allSymptoms.includes(keyword.toLowerCase())) {
          if (level === 'critical' && riskLevel !== 'critical') riskLevel = 'critical';
          else if (level === 'high' && !['critical'].includes(riskLevel)) riskLevel = 'high';
          else if (level === 'medium' && !['critical', 'high'].includes(riskLevel)) riskLevel = 'medium';
          
          factors.push(`Keyword: ${keyword}`);
        }
      });
    });

    // Pain level assessment
    if (patientData.painLevel >= 8) {
      factors.push('Severe pain level (8+/10)');
      if (riskLevel === 'low') riskLevel = 'high';
    } else if (patientData.painLevel >= 6) {
      factors.push('Moderate-high pain level (6-7/10)');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Duration assessment
    if (patientData.duration?.includes('Less than 24 hours') && symptoms.primary.length > 0) {
      factors.push('Acute onset symptoms');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // Severity assessment
    if (patientData.severity === 'severe') {
      factors.push('Patient-reported severe symptoms');
      if (riskLevel === 'low') riskLevel = 'high';
    }

    // Medical history factors
    if (patientData.medicalHistory && patientData.medicalHistory.length > 0) {
      factors.push('Existing medical conditions');
    }

    return {
      level: riskLevel,
      factors,
      redFlags,
      immediateAction
    };
  }

  private analyzeVitals(patientData: PatientData): VitalSigns {
    const vitals: VitalSigns = {
      temperature: patientData.temperature,
      bloodPressure: patientData.bloodPressure,
      heartRate: patientData.heartRate,
      status: 'unknown'
    };

    // Basic vital signs assessment
    let abnormalCount = 0;
    
    if (patientData.temperature) {
      const temp = parseFloat(patientData.temperature);
      if (temp > 100.4 || temp < 95) abnormalCount++;
    }
    
    if (patientData.bloodPressure) {
      const bpMatch = patientData.bloodPressure.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        const systolic = parseInt(bpMatch[1]);
        const diastolic = parseInt(bpMatch[2]);
        if (systolic > 140 || systolic < 90 || diastolic > 90 || diastolic < 60) {
          abnormalCount++;
        }
      }
    }
    
    if (patientData.heartRate) {
      const hr = parseInt(patientData.heartRate);
      if (hr > 100 || hr < 60) abnormalCount++;
    }

    if (abnormalCount > 0) {
      vitals.status = 'abnormal';
    } else if (patientData.temperature || patientData.bloodPressure || patientData.heartRate) {
      vitals.status = 'normal';
    }

    return vitals;
  }

  private generateAssessmentSummary(patientData: PatientData, riskAssessment: RiskAssessment): AssessmentSummary {
    const primaryConcern = patientData.primarySymptoms?.[0] || 'General health concern';
    const keyFindings: string[] = [];

    // Add key findings based on analysis
    if (riskAssessment.redFlags.length > 0) {
      keyFindings.push(`Red flag symptoms identified: ${riskAssessment.redFlags.join(', ')}`);
    }
    
    if (patientData.painLevel >= 7) {
      keyFindings.push(`High pain level reported (${patientData.painLevel}/10)`);
    }
    
    if (patientData.severity === 'severe') {
      keyFindings.push('Patient reports severe symptom impact');
    }
    
    if (patientData.medicalHistory && patientData.medicalHistory.length > 0) {
      keyFindings.push(`Medical history: ${patientData.medicalHistory.join(', ')}`);
    }

    return {
      primaryConcern,
      duration: patientData.duration || 'Not specified',
      severity: patientData.severity || 'mild',
      urgencyLevel: riskAssessment.level,
      keyFindings
    };
  }

  private generateRecommendations(riskAssessment: RiskAssessment, symptoms: SymptomAnalysis): string[] {
    const recommendations: string[] = [];

    switch (riskAssessment.level) {
      case 'critical':
        recommendations.push('🚨 IMMEDIATE MEDICAL ATTENTION REQUIRED');
        recommendations.push('Consider emergency room visit or call emergency services');
        break;
      case 'high':
        recommendations.push('⚠️ Urgent medical consultation needed');
        recommendations.push('Schedule appointment within 24-48 hours');
        break;
      case 'medium':
        recommendations.push('📅 Medical consultation recommended');
        recommendations.push('Schedule appointment within 1 week');
        break;
      case 'low':
        recommendations.push('💡 Routine medical consultation advised');
        recommendations.push('Monitor symptoms and schedule routine appointment');
        break;
    }

    // System-specific recommendations
    if (symptoms.systemsAffected.includes('Respiratory')) {
      recommendations.push('Monitor breathing, avoid irritants, stay hydrated');
    }
    
    if (symptoms.systemsAffected.includes('Cardiovascular')) {
      recommendations.push('Monitor vital signs, avoid strenuous activity');
    }
    
    if (symptoms.painLevel >= 6) {
      recommendations.push('Pain management discussion needed with healthcare provider');
    }

    return recommendations;
  }

  private generatePrescription(patientData: PatientData, symptoms: SymptomAnalysis, riskAssessment: RiskAssessment): MedicalPrescription | undefined {
    // Only generate prescription for low to medium risk cases
    // High/critical cases should be referred to medical professionals
    if (riskAssessment.level === 'high' || riskAssessment.level === 'critical') {
      return undefined;
    }

    const prescriptionId = `RX_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const medications: PrescribedMedication[] = [];
    
    // Generate medications based on primary symptoms
    symptoms.primary.forEach(symptom => {
      const symptomKey = symptom.toLowerCase();
      Object.keys(COMMON_MEDICATIONS).forEach(key => {
        if (symptomKey.includes(key) && COMMON_MEDICATIONS[key]) {
          medications.push(...COMMON_MEDICATIONS[key]);
        }
      });
    });

    // Remove duplicates and limit to 3 medications for safety
    const uniqueMedications = medications
      .filter((med, index, self) => 
        index === self.findIndex(m => m.genericName === med.genericName)
      )
      .slice(0, 3);

    if (uniqueMedications.length === 0) {
      return undefined;
    }

    // Generate diagnosis from primary concern
    const diagnosis = `${symptoms.primary.join(', ')} - Symptomatic treatment prescribed based on patient history and examination.`;

    const prescription: MedicalPrescription = {
      id: prescriptionId,
      patientName: patientData.name,
      patientAge: patientData.age || 30,
      patientGender: (patientData.gender as 'M' | 'F' | 'O') || 'O',
      doctorName: 'Dr. AI Assistant',
      doctorLicense: 'AI-ASSIST-2024',
      clinicName: 'Nivaaz+ Telemedicine',
      clinicAddress: 'Virtual Health Platform',
      prescriptionDate: new Date(),
      medications: uniqueMedications,
      diagnosis,
      instructions: [
        'Take medications as prescribed',
        'Complete the full course of treatment',
        'Consult a doctor if symptoms worsen',
        'Return for follow-up if symptoms persist beyond prescribed duration',
        'Keep prescription for future reference'
      ],
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      emergencyContact: '911 or local emergency services'
    };

    return prescription;
  }

  public generatePrescriptionDocument(prescription: MedicalPrescription): string {
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
╔════════════════════════════════════════════════════════════════════════════════╗
║                              MEDICAL PRESCRIPTION                              ║
╚════════════════════════════════════════════════════════════════════════════════╝

${prescription.clinicName.toUpperCase()}
${prescription.clinicAddress}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRESCRIPTION ID: ${prescription.id}
DATE: ${formatDate(prescription.prescriptionDate)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATIENT INFORMATION:
   Name: ${prescription.patientName}
   Age: ${prescription.patientAge} years
   Gender: ${prescription.patientGender === 'M' ? 'Male' : prescription.patientGender === 'F' ? 'Female' : 'Other'}

DOCTOR INFORMATION:
   Name: ${prescription.doctorName}
   License: ${prescription.doctorLicense}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIAGNOSIS:
${prescription.diagnosis}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRESCRIBED MEDICATIONS:

${prescription.medications.map((med, index) => `
${index + 1}. ${med.brandName ? `${med.brandName} (${med.genericName})` : med.genericName}
   ├─ Strength: ${med.strength}
   ├─ Form: ${med.dosageForm.charAt(0).toUpperCase() + med.dosageForm.slice(1)}
   ├─ Quantity: ${med.quantity}
   ├─ Frequency: ${med.frequency}
   ├─ Duration: ${med.duration}
   ├─ Instructions: ${med.instructions}
   ├─ Timing: ${med.beforeFood ? 'Before food' : med.afterFood ? 'After food' : 'With or without food'}
   └─ Substitution: ${med.substitutable ? 'Allowed' : 'Not allowed'}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GENERAL INSTRUCTIONS:
${prescription.instructions.map(instruction => `• ${instruction}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOLLOW-UP:
${prescription.followUpDate ? `Recommended follow-up date: ${formatDate(prescription.followUpDate)}` : 'Follow-up as needed'}

EMERGENCY CONTACT: ${prescription.emergencyContact || 'Contact your healthcare provider'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                               Doctor's Signature
                              ${prescription.doctorName}
                              License: ${prescription.doctorLicense}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT NOTES:
• This prescription is generated by an AI system for symptomatic relief
• For serious conditions, please consult a qualified medical professional
• Keep this prescription for your medical records
• Report any adverse reactions to your healthcare provider immediately

Generated on: ${new Date().toISOString()}
    `.trim();
  }

  public generateReportSummary(report: PatientReport): string {
    const prescriptionSection = report.prescription ? `

PRESCRIPTION GENERATED:
Prescription ID: ${report.prescription.id}
Medications Prescribed: ${report.prescription.medications.length}
${report.prescription.medications.map(med => `• ${med.genericName} ${med.strength} - ${med.frequency} for ${med.duration}`).join('\n')}
Follow-up Date: ${report.prescription.followUpDate?.toLocaleDateString() || 'As needed'}
` : '\nNO PRESCRIPTION - Refer to qualified medical professional for treatment';

    return `
PATIENT HEALTH ASSESSMENT REPORT
================================

Patient: ${report.patientName}
Generated: ${report.generatedAt.toLocaleString()}
Report ID: ${report.id}

PRIMARY CONCERN: ${report.assessmentSummary.primaryConcern}
Duration: ${report.assessmentSummary.duration}
Severity: ${report.assessmentSummary.severity}
Urgency Level: ${report.assessmentSummary.urgencyLevel.toUpperCase()}

SYMPTOMS ANALYSIS:
- Primary: ${report.symptoms.primary.join(', ')}
- Additional: ${report.symptoms.secondary.join(', ')}
- Pain Level: ${report.symptoms.painLevel}/10
- Systems Affected: ${report.symptoms.systemsAffected.join(', ')}

VITAL SIGNS:
${report.vitals.temperature ? `- Temperature: ${report.vitals.temperature}` : ''}
${report.vitals.bloodPressure ? `- Blood Pressure: ${report.vitals.bloodPressure}` : ''}
${report.vitals.heartRate ? `- Heart Rate: ${report.vitals.heartRate}` : ''}
- Status: ${report.vitals.status.toUpperCase()}

RISK ASSESSMENT: ${report.riskAssessment.level.toUpperCase()}
${report.riskAssessment.redFlags.length > 0 ? `Red Flags: ${report.riskAssessment.redFlags.join(', ')}` : ''}

RECOMMENDATIONS:
${report.recommendations.map(rec => `• ${rec}`).join('\n')}
${prescriptionSection}
    `.trim();
  }
}