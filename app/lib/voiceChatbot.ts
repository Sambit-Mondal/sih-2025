// Voice-based conversational AI chatbot with ultra-low latency
// Uses Web Speech API for optimal performance without external dependencies

import { PatientData, ConversationState, ChatMessage } from './chatbot';
import { GroqVoiceQuestionGenerator, PatientContext } from './groqVoiceQuestionGenerator';


export interface VoiceSettings {
    language: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    voiceURI: string;
    rate: number;
    pitch: number;
    volume: number;
}

export interface VoiceState {
    isListening: boolean;
    isSpeaking: boolean;
    isProcessing: boolean;
    hasPermission: boolean;
    currentText: string;
    confidence: number;
    error: string | null;
}

export interface VoiceMessage extends ChatMessage {
    confidence?: number;
    duration?: number;
    audioProcessingTime?: number;
}

// Optimized conversation steps for voice interaction
const VOICE_CONVERSATION_STEPS = [
    {
        id: 'greeting',
        question: "Hello! I'm your AI health assistant. I'll ask you a few questions about your health. Let's start - what is your main health concern or symptom today?",
        type: 'voice',
        dataField: 'primarySymptoms',
        followUp: true,
        expectedLength: 'medium' // short, medium, long
    },
    {
        id: 'duration',
        question: "How long have you been experiencing this issue? Please say less than 24 hours, 1 to 3 days, 4 to 7 days, 1 to 2 weeks, 2 to 4 weeks, or more than a month.",
        type: 'voice',
        dataField: 'duration',
        expectedLength: 'short'
    },
    {
        id: 'severity',
        question: "On a scale of severity, would you say your symptoms are mild with minor discomfort, moderate with noticeable impact on daily activities, or severe with significant impact on your daily life?",
        type: 'voice',
        dataField: 'severity',
        expectedLength: 'short'
    },
    {
        id: 'pain_level',
        question: "On a scale from 1 to 10, where 1 means no pain and 10 means severe pain, what number would you give your current pain level?",
        type: 'voice',
        dataField: 'painLevel',
        expectedLength: 'short'
    },
    {
        id: 'additional_symptoms',
        question: "Are you experiencing any additional symptoms along with your main concern? Please describe them or say none if you don't have any.",
        type: 'voice',
        dataField: 'additionalSymptoms',
        followUp: true,
        expectedLength: 'medium'
    },
    {
        id: 'medical_history',
        question: "Do you have any existing medical conditions or significant medical history I should know about? Please describe them or say none if you don't have any.",
        type: 'voice',
        dataField: 'medicalHistory',
        expectedLength: 'medium'
    },
    {
        id: 'medications',
        question: "Are you currently taking any medications or supplements? Please list them or say none if you're not taking any.",
        type: 'voice',
        dataField: 'medications',
        expectedLength: 'medium'
    },
    {
        id: 'allergies',
        question: "Do you have any known allergies to medications, food, or environmental factors? Please describe them or say none if you don't have any.",
        type: 'voice',
        dataField: 'allergies',
        expectedLength: 'medium'
    },
    {
        id: 'vitals',
        question: "If you have recently measured any vital signs like temperature, blood pressure, or heart rate, please share them. Otherwise, just say none available.",
        type: 'voice',
        dataField: 'vitals',
        expectedLength: 'short'
    }
];

// Voice-optimized follow-up questions
const VOICE_SYMPTOM_FOLLOW_UPS: { [key: string]: string } = {
    'fever': 'Do you also have chills or night sweats?',
    'headache': 'Is the headache throbbing or constant? Does light or noise make it worse?',
    'cough': 'Is it a dry cough or are you coughing up phlegm?',
    'stomach': 'Do you also have nausea or vomiting?',
    'chest pain': 'Is the chest pain sharp or dull? Does it get worse when you breathe?',
    'shortness of breath': 'Does the shortness of breath happen at rest or only during activity?',
    'dizziness': 'Do you feel like the room is spinning, or do you feel lightheaded?',
    'back pain': 'Does the back pain spread down to your legs?',
    'joint pain': 'Which joints are affected, and is there any swelling?'
};

export class VoiceHealthAssessmentChatbot {
    private state: ConversationState;
    private voiceState: VoiceState;
    private recognition: unknown = null; // Web Speech API instance
    private synthesis: SpeechSynthesis;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private voiceSettings: VoiceSettings;
    private responseTimeout: NodeJS.Timeout | null = null;
    private silenceTimeout: NodeJS.Timeout | null = null;
    private processingStartTime: number = 0;
    private onStateChange: (voiceState: VoiceState) => void;
    private onMessageUpdate: (messages: VoiceMessage[]) => void;
    private questionGenerator: GroqVoiceQuestionGenerator;
    private conversationContext: Array<{ question: string; answer: string; step: number }> = [];

    constructor(
        patientName: string,
        onStateChange: (voiceState: VoiceState) => void,
        onMessageUpdate: (messages: VoiceMessage[]) => void
    ) {
        this.onStateChange = onStateChange;
        this.onMessageUpdate = onMessageUpdate;
        this.questionGenerator = GroqVoiceQuestionGenerator.getInstance();

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

        this.voiceState = {
            isListening: false,
            isSpeaking: false,
            isProcessing: false,
            hasPermission: false,
            currentText: '',
            confidence: 0,
            error: null
        };

        // Optimized voice settings for low latency
        this.voiceSettings = {
            language: 'en-US',
            continuous: true,
            interimResults: true,
            maxAlternatives: 1,
            voiceURI: '',
            rate: 1.1, // Slightly faster for efficiency
            pitch: 1.0,
            volume: 0.9
        };

        this.synthesis = window.speechSynthesis;
        this.initializeVoiceSystem();
    }

    private async initializeVoiceSystem(): Promise<void> {
        try {
            // Check for Web Speech API support
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('Speech recognition not supported in this browser');
            }

            // Check Groq API status and inform user
            this.checkGroqAPIStatus();

            // Initialize Speech Recognition with optimal settings
            const SpeechRecognitionClass = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;
            this.recognition = new (SpeechRecognitionClass as new () => unknown)();

            const recognitionInstance = this.recognition as {
                continuous: boolean;
                interimResults: boolean;
                lang: string;
                maxAlternatives: number;
                start(): void;
                stop(): void;
                onstart: (() => void) | null;
                onresult: ((event: { resultIndex: number; results: { length: number;[index: number]: { isFinal: boolean;[index: number]: { transcript: string; confidence: number } } } }) => void) | null;
                onerror: ((event: { error: string }) => void) | null;
                onend: (() => void) | null;
            };

            // Optimize for ultra-low latency
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = this.voiceSettings.language;
            recognitionInstance.maxAlternatives = 1;

            // Set up event handlers for optimal performance
            this.setupSpeechRecognitionEvents();

            // Get optimal voice for synthesis
            this.setupOptimalVoice();

            // Request microphone permission
            await this.requestMicrophonePermission();

            this.voiceState.hasPermission = true;
            this.updateVoiceState();

        } catch (error) {
            this.voiceState.error = error instanceof Error ? error.message : 'Voice initialization failed';
            this.updateVoiceState();
        }
    }

    private checkGroqAPIStatus(): void {
        const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

        if (!apiKey) {
            console.warn('🤖 Voice Chatbot: No Groq API key found. Using fallback questions.');
            console.warn('💡 To enable AI-generated questions, set NEXT_PUBLIC_GROQ_API_KEY in your .env file');
        } else if (!apiKey.startsWith('gsk_')) {
            console.warn('🤖 Voice Chatbot: Invalid Groq API key format. Using fallback questions.');
            console.warn('💡 API key should start with "gsk_". Check https://console.groq.com/');
        } else {
            console.log('🤖 Voice Chatbot: Groq API configured. AI-generated questions enabled.');
            console.log('ℹ️ Note: API key will be validated when first question is generated');
        }
    }

    private setupSpeechRecognitionEvents(): void {
        if (!this.recognition) return;

        const recognitionInstance = this.recognition as {
            continuous: boolean;
            interimResults: boolean;
            lang: string;
            maxAlternatives: number;
            start(): void;
            stop(): void;
            onstart: (() => void) | null;
            onresult: ((event: { resultIndex: number; results: { length: number;[index: number]: { isFinal: boolean;[index: number]: { transcript: string; confidence: number } } } }) => void) | null;
            onerror: ((event: { error: string }) => void) | null;
            onend: (() => void) | null;
        };

        // Optimized event handlers for minimal latency
        recognitionInstance.onstart = () => {
            this.voiceState.isListening = true;
            this.voiceState.error = null;
            this.updateVoiceState();
        };

        recognitionInstance.onresult = (event: { resultIndex: number; results: { length: number;[index: number]: { isFinal: boolean;[index: number]: { transcript: string; confidence: number } } } }) => {
            this.processingStartTime = performance.now();
            let finalTranscript = '';
            let interimTranscript = '';

            // Process results for real-time feedback
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                const confidence = event.results[i][0].confidence;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    this.voiceState.confidence = confidence;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update current text for real-time display
            this.voiceState.currentText = finalTranscript || interimTranscript;
            this.updateVoiceState();

            // Process final result immediately
            if (finalTranscript.trim()) {
                this.processSpeechResult(finalTranscript.trim());
            }
        };

        recognitionInstance.onerror = (event: { error: string }) => {
            // Handle different types of speech recognition events appropriately
            switch (event.error) {
                case 'no-speech':
                    // This is normal - user just didn't speak within the timeout
                    console.log('👂 Listening for speech... (no speech detected, continuing to listen)');

                    // Provide occasional helpful prompts instead of errors
                    if (Math.random() > 0.7) { // 30% chance to show helpful message
                        this.voiceState.error = 'Take your time - I\'m listening for your response...';
                    } else {
                        this.voiceState.error = null;
                    }

                    this.voiceState.isListening = false;
                    this.updateVoiceState();
                    // Restart listening after a short delay
                    setTimeout(() => this.startListening(), 500);
                    break; case 'audio-capture':
                    console.warn('🎤 Audio capture issue - restarting speech recognition');
                    this.voiceState.error = 'Microphone access issue - retrying...';
                    this.voiceState.isListening = false;
                    this.updateVoiceState();
                    setTimeout(() => this.startListening(), 1000);
                    break;

                case 'not-allowed':
                    console.error('🚫 Microphone permission denied');
                    this.voiceState.error = 'Microphone permission required. Please allow microphone access.';
                    this.voiceState.isListening = false;
                    this.voiceState.hasPermission = false;
                    this.updateVoiceState();
                    break;

                case 'network':
                    console.warn('🌐 Network error in speech recognition - retrying');
                    this.voiceState.error = 'Network issue - retrying...';
                    this.voiceState.isListening = false;
                    this.updateVoiceState();
                    setTimeout(() => this.startListening(), 2000);
                    break;

                default:
                    console.error('Speech recognition error:', event.error);
                    this.voiceState.error = `Speech recognition error: ${event.error}`;
                    this.voiceState.isListening = false;
                    this.updateVoiceState();
                    // Try to restart for unknown errors too
                    setTimeout(() => this.startListening(), 1500);
                    break;
            }
        };

        recognitionInstance.onend = () => {
            this.voiceState.isListening = false;
            this.updateVoiceState();

            // Auto-restart if still in conversation
            if (!this.state.isComplete && !this.voiceState.isSpeaking) {
                setTimeout(() => this.startListening(), 100); // Ultra-short delay
            }
        };
    }

    private setupOptimalVoice(): void {
        // Wait for voices to load and select the best one
        const setupVoice = () => {
            const voices = this.synthesis.getVoices();

            // Prioritize native English voices for better performance
            const preferredVoices = [
                'Microsoft Zira - English (United States)',
                'Google US English',
                'Alex',
                'Samantha'
            ];

            let selectedVoice = voices.find(voice =>
                preferredVoices.some(preferred => voice.name.includes(preferred))
            );

            // Fallback to any English voice
            if (!selectedVoice) {
                selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
            }

            if (selectedVoice) {
                this.voiceSettings.voiceURI = selectedVoice.voiceURI;
            }
        };

        if (this.synthesis.getVoices().length > 0) {
            setupVoice();
        } else {
            this.synthesis.onvoiceschanged = setupVoice;
        }
    }

    private async requestMicrophonePermission(): Promise<void> {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            throw new Error('Microphone permission denied');
        }
    }

    private processSpeechResult(transcript: string): void {
        const processingTime = performance.now() - this.processingStartTime;

        // Stop listening while processing to avoid feedback
        this.stopListening();

        // Create voice message with performance metrics
        const userMessage: VoiceMessage = {
            id: `user_${Date.now()}`,
            text: transcript,
            isBot: false,
            timestamp: new Date(),
            confidence: this.voiceState.confidence,
            audioProcessingTime: processingTime
        };

        this.state.conversationHistory.push(userMessage);
        this.updateMessages();

        // Process the response immediately
        this.processResponse(transcript).catch(error => {
            console.error('Error processing response:', error);
        });
    }

    private async processResponse(userInput: string): Promise<void> {
        this.voiceState.isProcessing = true;
        this.updateVoiceState();

        try {
            // Store the current conversation context
            if (this.conversationContext.length > 0 || this.state.currentStep > 0) {
                const lastQuestion = this.state.conversationHistory[this.state.conversationHistory.length - 2]?.text || "Initial question";
                this.conversationContext.push({
                    question: lastQuestion,
                    answer: userInput,
                    step: this.state.currentStep
                });
            }

            // Update patient data based on response
            this.updatePatientDataFromResponse(userInput);

            // Check if we have enough information (complete all 9 steps or max questions)
            if (this.state.currentStep >= 9 || this.isAssessmentComplete()) {
                this.state.isComplete = true;
                this.state.patientData.completedAt = new Date();
                console.log('Assessment completed. Current step:', this.state.currentStep, 'Total steps:', VOICE_CONVERSATION_STEPS.length);

                this.speakResponse("Thank you for providing all the information. I'm now preparing your health assessment report and connecting you with a doctor. Please wait a moment.", false);

                // Notify UI about completion after speaking ends
                setTimeout(() => {
                    this.voiceState.isProcessing = false;
                    this.updateVoiceState();

                    // Add a completion message to conversation history
                    const completionMessage: VoiceMessage = {
                        id: `system_${Date.now()}`,
                        text: "Assessment complete. Preparing report...",
                        isBot: true,
                        timestamp: new Date()
                    };
                    this.state.conversationHistory.push(completionMessage);
                    this.updateMessages();

                    console.log('Conversation marked as complete. IsComplete:', this.state.isComplete);
                }, 1000);

                return;
            }

            // Generate next question using Groq AI
            const patientContext: PatientContext = {
                name: this.state.patientData.name || 'Patient',
                previousAnswers: this.conversationContext,
                currentStep: this.state.currentStep,
                primarySymptom: this.state.patientData.primarySymptoms?.[0],
                medicalHistory: this.state.patientData.medicalHistory,
                medications: this.state.patientData.medications,
                allergies: this.state.patientData.allergies
            };

            const nextQuestion = await this.questionGenerator.generateNextQuestion(patientContext);

            // Move to next step
            this.state.currentStep++;
            console.log('Progress update:', this.state.currentStep, '/', VOICE_CONVERSATION_STEPS.length);

            // Speak the AI-generated question
            this.speakResponse(nextQuestion.question, true);

        } catch (error) {
            console.error('Error processing response:', error);

            // Fallback to simple next question
            this.state.currentStep++;
            if (this.state.currentStep < 9) {
                this.speakResponse("Could you tell me more about your symptoms or any other health concerns?", true);
            } else {
                this.state.isComplete = true;
                this.speakResponse("Thank you for the information. I'm preparing your health report now.", false);

                // Add completion logic for fallback scenario too
                setTimeout(() => {
                    this.voiceState.isProcessing = false;
                    this.updateVoiceState();
                    console.log('Fallback completion triggered. IsComplete:', this.state.isComplete);
                }, 1000);
            }
        }

        this.voiceState.isProcessing = false;
        this.updateVoiceState();
    }

    private speakResponse(text: string, isMainQuestion: boolean = true): void {
        // Stop any current speech gracefully
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
            // Small delay to let the cancellation process
            setTimeout(() => this.startSpeech(text, isMainQuestion), 50);
        } else {
            this.startSpeech(text, isMainQuestion);
        }
    }

    private startSpeech(text: string, isMainQuestion: boolean = true): void {

        const botMessage: VoiceMessage = {
            id: `bot_${Date.now()}`,
            text,
            isBot: true,
            timestamp: new Date()
        };

        this.state.conversationHistory.push(botMessage);
        this.updateMessages();

        // Create optimized utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.rate = this.voiceSettings.rate;
        this.currentUtterance.pitch = this.voiceSettings.pitch;
        this.currentUtterance.volume = this.voiceSettings.volume;

        // Set voice if available
        const voices = this.synthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.voiceURI === this.voiceSettings.voiceURI);
        if (selectedVoice) {
            this.currentUtterance.voice = selectedVoice;
        }

        this.voiceState.isSpeaking = true;
        this.updateVoiceState();

        this.currentUtterance.onend = () => {
            this.voiceState.isSpeaking = false;
            this.updateVoiceState();

            // Start listening immediately after speaking for main questions
            if (isMainQuestion && !this.state.isComplete) {
                setTimeout(() => this.startListening(), 200); // Minimal delay for better UX
            }
        };

        this.currentUtterance.onerror = (event) => {
            // Handle different types of speech synthesis events appropriately
            switch (event.error) {
                case 'interrupted':
                    // This is normal - new speech started while previous was playing
                    console.log('🗣️ Speech interrupted (normal - new speech started)');
                    this.voiceState.isSpeaking = false;
                    this.voiceState.error = null; // Don't treat as error
                    this.updateVoiceState();
                    break;

                case 'canceled':
                    // User or system canceled speech
                    console.log('🗣️ Speech canceled');
                    this.voiceState.isSpeaking = false;
                    this.voiceState.error = null; // Don't treat as error
                    this.updateVoiceState();
                    break;

                case 'not-allowed':
                    // Audio permissions issue
                    console.error('🔊 Audio output not allowed');
                    this.voiceState.isSpeaking = false;
                    this.voiceState.error = 'Audio output permission required';
                    this.updateVoiceState();
                    break;

                case 'network':
                    // Network related speech synthesis issue
                    console.warn('🌐 Network error in speech synthesis');
                    this.voiceState.isSpeaking = false;
                    this.voiceState.error = 'Network issue with speech - retrying...';
                    this.updateVoiceState();
                    break;

                default:
                    // Other errors - log but don't necessarily show to user
                    console.warn('Speech synthesis issue:', event.error);
                    this.voiceState.isSpeaking = false;
                    // Only show error for truly problematic issues
                    if (event.error !== 'synthesis-unavailable' && event.error !== 'language-unavailable') {
                        this.voiceState.error = `Speech synthesis error: ${event.error}`;
                    } else {
                        this.voiceState.error = null;
                    }
                    this.updateVoiceState();
                    break;
            }
        };

        // Speak with minimal delay
        this.synthesis.speak(this.currentUtterance);
    }

    private getVoiceSymptomFollowUp(symptoms: string): string | null {
        const lowerSymptoms = symptoms.toLowerCase();

        for (const [symptom, followUp] of Object.entries(VOICE_SYMPTOM_FOLLOW_UPS)) {
            if (lowerSymptoms.includes(symptom)) {
                return followUp;
            }
        }

        return null;
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
                if (value.toLowerCase().includes('mild')) data.severity = 'mild';
                else if (value.toLowerCase().includes('moderate')) data.severity = 'moderate';
                else data.severity = 'severe';
                break;
            case 'painLevel':
                const painMatch = value.match(/(\d+)/);
                if (painMatch) data.painLevel = parseInt(painMatch[1]);
                break;
            case 'additionalSymptoms':
                if (!value.toLowerCase().includes('none')) {
                    data.additionalSymptoms = [...(data.additionalSymptoms || []), value];
                }
                break;
            case 'medicalHistory':
                if (!value.toLowerCase().includes('none')) {
                    data.medicalHistory = [...(data.medicalHistory || []), value];
                }
                break;
            case 'medications':
                if (!value.toLowerCase().includes('none')) {
                    data.medications = [...(data.medications || []), value];
                }
                break;
            case 'allergies':
                if (!value.toLowerCase().includes('none')) {
                    data.allergies = [...(data.allergies || []), value];
                }
                break;
            case 'vitals':
                if (!value.toLowerCase().includes('none')) {
                    this.parseVitals(value);
                }
                break;
        }
    }

    private updatePatientDataFromResponse(userInput: string): void {
        const data = this.state.patientData;
        const step = this.state.currentStep;

        // Parse response based on current step
        if (step === 0) {
            // Primary symptom
            data.primarySymptoms = [userInput];
        } else if (step === 1) {
            // Duration or additional details - store in medical history for now
            data.medicalHistory = [...(data.medicalHistory || []), `Duration: ${userInput}`];
        } else if (step === 2) {
            // Severity or pain level
            const painMatch = userInput.match(/(\d+)/);
            if (painMatch) {
                data.painLevel = parseInt(painMatch[1]);
            }
            data.medicalHistory = [...(data.medicalHistory || []), `Severity: ${userInput}`];
        } else if (step === 3) {
            // Additional symptoms
            if (!userInput.toLowerCase().includes('none') && !userInput.toLowerCase().includes('no')) {
                data.additionalSymptoms = [...(data.additionalSymptoms || []), userInput];
            }
        } else if (step === 4 || step === 5) {
            // Medical history
            if (!userInput.toLowerCase().includes('none') && !userInput.toLowerCase().includes('no')) {
                data.medicalHistory = [...(data.medicalHistory || []), userInput];
            }
        } else if (step === 6) {
            // Medications
            if (!userInput.toLowerCase().includes('none') && !userInput.toLowerCase().includes('no')) {
                data.medications = [...(data.medications || []), userInput];
            }
        } else if (step === 7) {
            // Allergies
            if (!userInput.toLowerCase().includes('none') && !userInput.toLowerCase().includes('no')) {
                data.allergies = [...(data.allergies || []), userInput];
            }
        }
    }

    private isAssessmentComplete(): boolean {
        const data = this.state.patientData;
        return Boolean(
            data.primarySymptoms && data.primarySymptoms.length > 0 &&
            this.state.currentStep >= 6 // Minimum questions for basic assessment
        );
    }

    private parseVitals(vitalsText: string): void {
        const data = this.state.patientData;
        const text = vitalsText.toLowerCase();

        // Extract temperature
        const tempMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:degrees|°f|°c|f|c)/);
        if (tempMatch) {
            data.temperature = tempMatch[1] + '°F';
        }

        // Extract blood pressure
        const bpMatch = text.match(/(\d{2,3})\s*(?:over|\/)\s*(\d{2,3})/);
        if (bpMatch) {
            data.bloodPressure = `${bpMatch[1]}/${bpMatch[2]} mmHg`;
        }

        // Extract heart rate
        const hrMatch = text.match(/(\d{2,3})\s*(?:beats|bpm)/);
        if (hrMatch) {
            data.heartRate = hrMatch[1] + ' bpm';
        }
    }

    public startListening(): void {
        if (!this.recognition) {
            console.warn('🎤 Speech recognition not initialized');
            return;
        }

        if (!this.voiceState.hasPermission) {
            console.warn('🚫 Microphone permission not granted');
            return;
        }

        if (this.voiceState.isListening) {
            console.log('👂 Already listening for speech');
            return;
        }

        if (this.voiceState.isSpeaking) {
            console.log('🗣️ Currently speaking, will start listening after speech ends');
            return;
        }

        try {
            console.log('🎤 Starting speech recognition...');
            const recognitionInstance = this.recognition as { start(): void };
            recognitionInstance.start();

            // Clear any previous "no-speech" related messages
            if (this.voiceState.error === null || this.voiceState.error.includes('no speech detected')) {
                this.voiceState.error = null;
                this.updateVoiceState();
            }

        } catch (error) {
            console.error('❌ Failed to start speech recognition:', error);
            this.voiceState.error = 'Failed to start listening. Please try again.';
            this.updateVoiceState();
        }
    } public stopListening(): void {
        if (this.recognition && this.voiceState.isListening) {
            const recognitionInstance = this.recognition as { stop(): void };
            recognitionInstance.stop();
        }
    }

    public async startConversation(): Promise<VoiceMessage> {
        try {
            console.log('Starting voice conversation...');

            // Generate initial question using Groq
            const patientContext: PatientContext = {
                name: this.state.patientData.name || 'Patient',
                previousAnswers: [],
                currentStep: 0
            };

            const initialQuestion = await this.questionGenerator.generateNextQuestion(patientContext);

            // speakResponse already adds the message to conversationHistory, so we don't need to return a new one
            this.speakResponse(initialQuestion.question, true);

            // Return the message that was just added to history
            const lastMessage = this.state.conversationHistory[this.state.conversationHistory.length - 1];
            return lastMessage as VoiceMessage;

        } catch (error) {
            console.error('Error generating initial question:', error);

            // Fallback to default greeting
            const defaultQuestion = "Hello! I'm your AI health assistant. What is your main health concern or symptom today?";
            this.speakResponse(defaultQuestion, true);

            // Return the message that was just added to history
            const lastMessage = this.state.conversationHistory[this.state.conversationHistory.length - 1];
            return lastMessage as VoiceMessage;
        }
    }

    public stopSpeaking(): void {
        this.synthesis.cancel();
        this.voiceState.isSpeaking = false;
        this.updateVoiceState();
    }

    public toggleMute(): void {
        if (this.voiceState.isSpeaking) {
            this.stopSpeaking();
        }

        if (this.voiceState.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    private updateVoiceState(): void {
        this.onStateChange({ ...this.voiceState });
    }

    private updateMessages(): void {
        this.onMessageUpdate([...this.state.conversationHistory] as VoiceMessage[]);
    }

    // Public getters
    public getPatientData(): PatientData {
        return this.state.patientData as PatientData;
    }

    public getConversationHistory(): VoiceMessage[] {
        return this.state.conversationHistory as VoiceMessage[];
    }

    public isConversationComplete(): boolean {
        return this.state.isComplete;
    }

    public getCurrentStep(): number {
        return this.state.currentStep;
    }

    public getTotalSteps(): number {
        return VOICE_CONVERSATION_STEPS.length;
    }

    public getVoiceState(): VoiceState {
        return { ...this.voiceState };
    }

    public cleanup(): void {
        this.stopListening();
        this.stopSpeaking();
        if (this.responseTimeout) clearTimeout(this.responseTimeout);
        if (this.silenceTimeout) clearTimeout(this.silenceTimeout);
    }
}