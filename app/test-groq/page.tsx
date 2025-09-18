'use client';

import { useState } from 'react';
import { directGroqTest } from '../lib/groqDirectTest';

type TestResult = {
  success?: boolean;
  error?: string;
  envInfo?: {
    NEXT_PUBLIC_GROQ_API_KEY: string;
    NEXT_PUBLIC_SOCKET_URL: string;
    nodeEnv: string | undefined;
    allEnvKeys: string[];
  };
} | null;

export default function GroqTestPage() {
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const result = await directGroqTest();
      setTestResult(result);
    } catch (error) {
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    setIsLoading(false);
  };

  const checkEnvVars = () => {
    const envInfo = {
      NEXT_PUBLIC_GROQ_API_KEY: process.env.NEXT_PUBLIC_GROQ_API_KEY ? 'Present' : 'Missing',
      NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'Missing',
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    };
    console.log('Environment Variables:', envInfo);
    setTestResult({ envInfo });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Groq API Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkEnvVars}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Check Environment Variables
        </button>
        
        <button
          onClick={runTest}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Run Groq API Test'}
        </button>
      </div>

      {testResult && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}