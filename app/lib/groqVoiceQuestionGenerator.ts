// Groq-powered intelligent question generator for voice health assessment
// Generates contextual, dynamic questions based on patient responses

import Groq from "groq-sdk";

export interface PatientContext {
  name: string;
  previousAnswers: Array<{ question: string; answer: string; step: number }>;
  currentStep: number;
  primarySymptom?: string;
  symptomDetails?: string;
  medicalHistory?: string[];
  medications?: string[];
  allergies?: string[];
}

export interface GeneratedQuestion {
  question: string;
  type: 'initial' | 'follow-up' | 'clarification' | 'medical-history' | 'final';
  context: string;
  expectedAnswerType: 'symptoms' | 'duration' | 'severity' | 'medical-info' | 'medications' | 'allergies' | 'vitals';
}

export class GroqVoiceQuestionGenerator {
  private static instance: GroqVoiceQuestionGenerator;
  private conversationContext: string = '';

  private constructor() {}

  public static getInstance(): GroqVoiceQuestionGenerator {
    if (!GroqVoiceQuestionGenerator.instance) {
      GroqVoiceQuestionGenerator.instance = new GroqVoiceQuestionGenerator();
    }
    return GroqVoiceQuestionGenerator.instance;
  }

  public async generateNextQuestion(context: PatientContext): Promise<GeneratedQuestion> {
    try {
      // Create Groq client with proper API key
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      
      if (!apiKey) {
        console.error('No Groq API key found in environment variables');
        console.warn('Falling back to default questions due to missing API key');
        return this.getFallbackQuestion(context);
      }
      
      if (!apiKey.startsWith('gsk_')) {
        console.error('Invalid Groq API key format - should start with gsk_');
        console.warn('Falling back to default questions due to invalid API key format');
        return this.getFallbackQuestion(context);
      }
      
      const groq = new Groq({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      
      // Debug logging
      console.log('Generating question with context:', { step: context.currentStep, previousAnswers: context.previousAnswers.length });
      console.log('API Key length:', apiKey.length, 'starts with gsk_:', apiKey.startsWith('gsk_'));
      
      const prompt = this.buildPrompt(context);
      console.log('Generated prompt:', prompt.substring(0, 200) + '...');
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert medical AI assistant conducting a voice-based health assessment. 
            Your role is to generate the next most relevant question for a comprehensive health evaluation.
            
            CRITICAL REQUIREMENTS:
            1. Generate questions that are NATURAL for voice conversation
            2. Avoid repeating previously asked questions
            3. Ask ONE specific question at a time
            4. Use simple, clear language suitable for voice recognition
            5. Build upon previous answers to ask relevant follow-up questions
            6. Focus on medical necessity and patient safety
            7. Generate questions that help diagnose and assess urgency
            
            RESPONSE FORMAT: Return ONLY a JSON object with this structure:
            {
              "question": "Your generated question here",
              "type": "initial|follow-up|clarification|medical-history|final",
              "context": "Brief explanation of why this question is important",
              "expectedAnswerType": "symptoms|duration|severity|medical-info|medications|allergies|vitals"
            }`
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 200,
        top_p: 0.8
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Groq API');
      }

      // Parse the JSON response
      const cleanedResponse = response.trim().replace(/```json\n?|\n?```/g, '');
      const questionData = JSON.parse(cleanedResponse);

      return {
        question: questionData.question,
        type: questionData.type || 'follow-up',
        context: questionData.context || 'General health assessment',
        expectedAnswerType: questionData.expectedAnswerType || 'symptoms'
      };

    } catch (error) {
      console.error('Error generating question with Groq API:', error);
      
      // Handle specific API errors with helpful messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Invalid API Key')) {
          console.error('❌ Groq API Key is invalid or expired');
          console.warn('🔑 Please check your API key at https://console.groq.com/');
          console.warn('📝 Update NEXT_PUBLIC_GROQ_API_KEY in your .env file');
          console.warn('🔄 Falling back to default questions for now...');
        } else if (error.message.includes('429')) {
          console.warn('🔥 Groq API rate limit exceeded, falling back to default questions');
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          console.warn('🌐 Network error connecting to Groq API, falling back to default questions');
        } else {
          console.warn('⚠️ Unexpected Groq API error, falling back to default questions');
          console.error('Error details:', error.message);
        }
      }
      
      // Always fall back to contextual questions instead of breaking the voice flow
      return this.getFallbackQuestion(context);
    }
  }

  private buildPrompt(context: PatientContext): string {
    const { name, previousAnswers, currentStep, primarySymptom } = context;
    
    let prompt = `Patient Name: ${name}\nCurrent Assessment Step: ${currentStep}\n\n`;
    
    if (previousAnswers.length === 0) {
      prompt += `This is the initial question. Generate a warm, professional greeting that asks about the patient's main health concern or symptom.`;
    } else {
      prompt += `CONVERSATION HISTORY:\n`;
      previousAnswers.forEach((qa, index) => {
        prompt += `${index + 1}. Q: "${qa.question}"\n   A: "${qa.answer}"\n\n`;
      });
      
      prompt += `TASK: Based on the conversation above, generate the NEXT MOST IMPORTANT question to:\n`;
      
      if (currentStep <= 2) {
        prompt += `- Gather more specific details about their primary symptom: "${primarySymptom}"\n- Ask about duration, severity, triggers, or symptom characteristics\n- Avoid repeating questions already asked`;
      } else if (currentStep <= 4) {
        prompt += `- Explore related symptoms or complications\n- Ask about pain levels, functional impact, or associated symptoms\n- Focus on symptom progression and patterns`;
      } else if (currentStep <= 6) {
        prompt += `- Gather relevant medical history\n- Ask about previous similar episodes, chronic conditions, or recent changes\n- Focus on medical context that could affect diagnosis`;
      } else if (currentStep <= 8) {
        prompt += `- Collect medication and allergy information\n- Ask about current medications, recent medication changes, or known allergies\n- Focus on drug interactions and contraindications`;
      } else {
        prompt += `- Gather any remaining critical information\n- Ask about vital signs, recent test results, or immediate concerns\n- Prepare to conclude the assessment`;
      }
    }
    
    prompt += `\n\nThe question must be:\n- Clear and conversational for voice interaction\n- Focused on ONE specific aspect\n- Medically relevant and necessary\n- Easy to understand and respond to verbally`;
    
    return prompt;
  }

  private getFallbackQuestion(context: PatientContext): GeneratedQuestion {
    const { previousAnswers } = context;
    
    // Prevent infinite loops by checking what's been asked
    const askedQuestions = previousAnswers.map(qa => qa.question.toLowerCase());
    
    const fallbackQuestions = [
      {
        question: "Hello! I'm your AI health assistant. What is your main health concern or symptom today?",
        type: 'initial' as const,
        context: 'Initial symptom assessment',
        expectedAnswerType: 'symptoms' as const
      },
      {
        question: "How long have you been experiencing this symptom?",
        type: 'follow-up' as const,
        context: 'Duration assessment',
        expectedAnswerType: 'duration' as const
      },
      {
        question: "Can you describe the severity of your symptoms on a scale from mild to severe?",
        type: 'follow-up' as const,
        context: 'Severity assessment',
        expectedAnswerType: 'severity' as const
      },
      {
        question: "Are you experiencing any other symptoms along with your main concern?",
        type: 'follow-up' as const,
        context: 'Additional symptoms',
        expectedAnswerType: 'symptoms' as const
      },
      {
        question: "Do you have any existing medical conditions I should know about?",
        type: 'medical-history' as const,
        context: 'Medical history',
        expectedAnswerType: 'medical-info' as const
      },
      {
        question: "Are you currently taking any medications?",
        type: 'medical-history' as const,
        context: 'Current medications',
        expectedAnswerType: 'medications' as const
      },
      {
        question: "Do you have any known allergies to medications or other substances?",
        type: 'medical-history' as const,
        context: 'Allergy information',
        expectedAnswerType: 'allergies' as const
      },
      {
        question: "Is there anything else about your current symptoms or health that you think I should know?",
        type: 'final' as const,
        context: 'Final assessment',
        expectedAnswerType: 'symptoms' as const
      }
    ];
    
    // Find a question that hasn't been asked yet
    for (const q of fallbackQuestions) {
      if (!askedQuestions.some(asked => asked.includes(q.question.toLowerCase().substring(0, 20)))) {
        return q;
      }
    }
    
    // If all questions asked, return completion
    return {
      question: "Thank you for all the information. I'm now preparing your health report.",
      type: 'final',
      context: 'Assessment completion',
      expectedAnswerType: 'symptoms'
    };
  }

  public generateFollowUpQuestion(symptom: string, previousResponse: string): Promise<GeneratedQuestion> {
    const context: PatientContext = {
      name: 'Patient',
      previousAnswers: [
        { question: 'What is your main symptom?', answer: symptom, step: 0 },
        { question: 'Tell me more about it', answer: previousResponse, step: 1 }
      ],
      currentStep: 2,
      primarySymptom: symptom
    };
    
    return this.generateNextQuestion(context);
  }
}

export default GroqVoiceQuestionGenerator;