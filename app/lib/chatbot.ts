// Conversational chatbot system for patient health assessment
// Uses rule-based approach for optimal performance without external APIs

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  options?: string[];
}

export interface PatientData {
  name: string;
  age?: number;
  gender?: string;
  primarySymptoms: string[];
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  additionalSymptoms: string[];
  medicalHistory: string[];
  medications: string[];
  allergies: string[];
  painLevel: number; // 1-10 scale
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  completedAt: Date;
}

export interface ConversationState {
  currentStep: number;
  patientData: Partial<PatientData>;
  conversationHistory: ChatMessage[];
  isComplete: boolean;
}

// Predefined conversation flow
const CONVERSATION_STEPS = [
  {
    id: 'greeting',
    question: "Hello! I'm here to help assess your health concerns before connecting you with a doctor. What is your primary health issue or symptom that brought you here today?",
    type: 'text',
    dataField: 'primarySymptoms',
    followUp: true
  },
  {
    id: 'duration',
    question: "How long have you been experiencing this issue?",
    type: 'options',
    options: ['Less than 24 hours', '1-3 days', '4-7 days', '1-2 weeks', '2-4 weeks', 'More than a month'],
    dataField: 'duration'
  },
  {
    id: 'severity',
    question: "How would you rate the severity of your symptoms?",
    type: 'options',
    options: ['Mild - Minor discomfort', 'Moderate - Noticeable impact on daily activities', 'Severe - Significant impact on daily life'],
    dataField: 'severity'
  },
  {
    id: 'pain_level',
    question: "On a scale of 1-10, how would you rate your pain level? (1 = no pain, 10 = severe pain)",
    type: 'options',
    options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    dataField: 'painLevel'
  },
  {
    id: 'additional_symptoms',
    question: "Are you experiencing any additional symptoms along with your primary concern?",
    type: 'text',
    dataField: 'additionalSymptoms',
    followUp: true
  },
  {
    id: 'medical_history',
    question: "Do you have any existing medical conditions or significant medical history I should know about?",
    type: 'text',
    dataField: 'medicalHistory'
  },
  {
    id: 'medications',
    question: "Are you currently taking any medications or supplements?",
    type: 'text',
    dataField: 'medications'
  },
  {
    id: 'allergies',
    question: "Do you have any known allergies (medications, food, environmental)?",
    type: 'text',
    dataField: 'allergies'
  },
  {
    id: 'vitals',
    question: "If available, please provide any recent vital signs. Do you know your current temperature, blood pressure, or heart rate?",
    type: 'text',
    dataField: 'vitals'
  }
];

// Symptom-based follow-up questions
const SYMPTOM_FOLLOW_UPS: { [key: string]: string[] } = {
  'fever': ['Do you have chills or night sweats?', 'Have you taken your temperature?'],
  'headache': ['Where exactly is the pain located?', 'Is it throbbing or constant?', 'Does light or noise make it worse?'],
  'cough': ['Is it a dry cough or are you bringing up phlegm?', 'Is there any blood in your sputum?'],
  'stomach': ['Do you have nausea or vomiting?', 'When did you last eat normally?'],
  'chest pain': ['Is the pain sharp or dull?', 'Does it worsen with breathing or movement?', 'Do you have shortness of breath?'],
  'shortness of breath': ['Does it occur at rest or with activity?', 'Do you have chest pain?'],
  'dizziness': ['Do you feel like the room is spinning?', 'Does it happen when you stand up?'],
  'back pain': ['Where exactly is the pain located?', 'Does it radiate down your legs?'],
  'joint pain': ['Which joints are affected?', 'Is there any swelling or redness?'],
  'skin': ['Can you describe the appearance?', 'Is it itchy or painful?', 'Where is it located?']
};

export class HealthAssessmentChatbot {
  private state: ConversationState;
  
  constructor(patientName: string) {
    this.state = {
      currentStep: 0,
      patientData: {
        name: patientName,
        primarySymptoms: [],
        additionalSymptoms: [],
        medicalHistory: [],
        medications: [],
        allergies: []
      },
      conversationHistory: [],
      isComplete: false
    };
  }

  public getInitialMessage(): ChatMessage {
    const initialStep = CONVERSATION_STEPS[0];
    const message: ChatMessage = {
      id: `bot_${Date.now()}`,
      text: initialStep.question,
      isBot: true,
      timestamp: new Date(),
      options: initialStep.options
    };
    
    this.state.conversationHistory.push(message);
    return message;
  }

  public processResponse(userInput: string): ChatMessage[] {
    const responses: ChatMessage[] = [];
    
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: userInput,
      isBot: false,
      timestamp: new Date()
    };
    this.state.conversationHistory.push(userMessage);
    responses.push(userMessage);

    // Process the response based on current step
    const currentStep = CONVERSATION_STEPS[this.state.currentStep];
    this.updatePatientData(currentStep.dataField, userInput);

    // Check if we need follow-up questions
    if (currentStep.followUp && this.state.currentStep === 0) {
      const followUps = this.getSymptomFollowUps(userInput);
      for (const followUp of followUps) {
        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}_${Math.random()}`,
          text: followUp,
          isBot: true,
          timestamp: new Date()
        };
        this.state.conversationHistory.push(botMessage);
        responses.push(botMessage);
      }
    }

    // Move to next step
    this.state.currentStep++;
    
    if (this.state.currentStep < CONVERSATION_STEPS.length) {
      const nextStep = CONVERSATION_STEPS[this.state.currentStep];
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}_next`,
        text: nextStep.question,
        isBot: true,
        timestamp: new Date(),
        options: nextStep.options
      };
      this.state.conversationHistory.push(botMessage);
      responses.push(botMessage);
    } else {
      // Conversation complete
      this.state.isComplete = true;
      this.state.patientData.completedAt = new Date();
      
      const completionMessage: ChatMessage = {
        id: `bot_${Date.now()}_complete`,
        text: "Thank you for providing all the information. I'm now preparing your health assessment report and connecting you with a doctor. Please wait a moment...",
        isBot: true,
        timestamp: new Date()
      };
      this.state.conversationHistory.push(completionMessage);
      responses.push(completionMessage);
    }

    return responses;
  }

  private updatePatientData(field: string, value: string): void {
    const data = this.state.patientData;
    
    switch (field) {
      case 'primarySymptoms':
        data.primarySymptoms = [...(data.primarySymptoms || []), value];
        break;
      case 'duration':
        data.duration = value;
        break;
      case 'severity':
        if (value.includes('Mild')) data.severity = 'mild';
        else if (value.includes('Moderate')) data.severity = 'moderate';
        else data.severity = 'severe';
        break;
      case 'painLevel':
        data.painLevel = parseInt(value);
        break;
      case 'additionalSymptoms':
        data.additionalSymptoms = [...(data.additionalSymptoms || []), value];
        break;
      case 'medicalHistory':
        data.medicalHistory = [...(data.medicalHistory || []), value];
        break;
      case 'medications':
        data.medications = [...(data.medications || []), value];
        break;
      case 'allergies':
        data.allergies = [...(data.allergies || []), value];
        break;
      case 'vitals':
        this.parseVitals(value);
        break;
    }
  }

  private parseVitals(vitalsText: string): void {
    const data = this.state.patientData;
    const text = vitalsText.toLowerCase();
    
    // Extract temperature
    const tempMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:°f|°c|f|c|degrees)/);
    if (tempMatch) {
      data.temperature = tempMatch[1] + '°F';
    }
    
    // Extract blood pressure
    const bpMatch = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (bpMatch) {
      data.bloodPressure = `${bpMatch[1]}/${bpMatch[2]} mmHg`;
    }
    
    // Extract heart rate
    const hrMatch = text.match(/(\d{2,3})\s*(?:bpm|beats)/);
    if (hrMatch) {
      data.heartRate = hrMatch[1] + ' bpm';
    }
  }

  private getSymptomFollowUps(symptoms: string): string[] {
    const followUps: string[] = [];
    const lowerSymptoms = symptoms.toLowerCase();
    
    Object.keys(SYMPTOM_FOLLOW_UPS).forEach(symptom => {
      if (lowerSymptoms.includes(symptom)) {
        followUps.push(...SYMPTOM_FOLLOW_UPS[symptom]);
      }
    });
    
    return followUps.slice(0, 2); // Limit to 2 follow-up questions
  }

  public getPatientData(): PatientData {
    return this.state.patientData as PatientData;
  }

  public getConversationHistory(): ChatMessage[] {
    return this.state.conversationHistory;
  }

  public isConversationComplete(): boolean {
    return this.state.isComplete;
  }

  public getCurrentStep(): number {
    return this.state.currentStep;
  }

  public getTotalSteps(): number {
    return CONVERSATION_STEPS.length;
  }
}