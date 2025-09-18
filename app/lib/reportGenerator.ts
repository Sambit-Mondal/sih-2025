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

    const report: PatientReport = {
      id: reportId,
      patientName: patientData.name,
      generatedAt: new Date(),
      assessmentSummary,
      symptoms,
      riskAssessment,
      recommendations,
      conversationLog: conversationHistory,
      vitals
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

  public generateReportSummary(report: PatientReport): string {
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
    `.trim();
  }
}