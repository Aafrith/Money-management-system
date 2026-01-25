import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Upload, CheckCircle, Square, Play, Pause, Trash2, X } from 'lucide-react';
import { parserService, expenseService, categoryService } from '../../services';
import { useExpenseStore } from '../../store';
import toast from 'react-hot-toast';

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

// Polyfill for speech recognition
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  console.warn('Speech Recognition API not available in this browser');
}

const AddVoice = () => {
  const navigate = useNavigate();
  const { addExpense, triggerRefresh } = useExpenseStore();
  
  const [transcribedText, setTranscribedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [browserSupported, setBrowserSupported] = useState(true);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    initializeSpeechRecognition();
    
    return () => {
      // Cleanup on unmount
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    try {
      // Check browser support
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        console.error('Speech Recognition not supported');
        setBrowserSupported(false);
        toast.error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      // Create recognition instance
      const recognition = new SpeechRecognitionAPI();
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Handle results (real-time transcription)
      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        // Update interim results (real-time)
        if (interim) {
          setInterimTranscript(interim);
        }

        // Update final transcript
        if (final) {
          setTranscribedText(prev => (prev + final).trim());
          setInterimTranscript('');
        }
      };

      // Handle errors
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        const errorMessages = {
          'no-speech': 'No speech detected. Please try again.',
          'audio-capture': 'Microphone not accessible. Please check permissions.',
          'not-allowed': 'Microphone permission denied. Please allow microphone access.',
          'network': 'Network error. Please check your connection.',
          'aborted': 'Speech recognition aborted.',
          'service-not-allowed': 'Speech recognition service not allowed.'
        };
        
        const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
        toast.error(message);
      };

      // Handle end event
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setInterimTranscript('');
      };

      // Handle start event
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionRef.current = recognition;
      console.log('Speech recognition initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setBrowserSupported(false);
      toast.error('Failed to initialize speech recognition: ' + error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const startRecording = () => {
    if (!browserSupported || !recognitionRef.current) {
      toast.error('Speech recognition not available. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      // Reset previous transcripts
      setTranscribedText('');
      setInterimTranscript('');
      
      // Start recognition
      recognitionRef.current.start();
      toast.success('🎤 Listening... Start speaking');
      
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      
      // Handle already started error
      if (error.message.includes('already started')) {
        toast.error('Speech recognition already running');
      } else {
        toast.error('Failed to start: ' + error.message);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        toast.success('Recording stopped');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  const clearTranscript = () => {
    setTranscribedText('');
    setInterimTranscript('');
    toast.info('Transcript cleared');
  };

  const handleParse = async () => {
    const fullText = transcribedText.trim();
    
    if (!fullText) {
      toast.error('Please speak something first');
      return;
    }

    // Stop listening before parsing
    if (isListening) {
      stopRecording();
    }

    setLoading(true);
    try {
      console.log('Parsing text:', fullText);
      
      // Send transcribed text to backend for Gradio LLM parsing
      const result = await parserService.parseVoiceText(fullText);
      
      console.log('Parse result:', result);
      setParsedData(result);
      setStep(2);
      toast.success('Voice parsed successfully!');
      
    } catch (error) {
      console.error('Voice parsing error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
      toast.error('Failed to parse: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Ensure source is set to 'voice' when saving
      const expenseData = { ...parsedData, source: 'voice' };
      const newExpense = await expenseService.create(expenseData);
      addExpense(newExpense);
      triggerRefresh(); // Explicitly trigger refresh
      toast.success('Expense added successfully!');
      // Small delay to ensure store is updated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      // Navigate to dashboard to see updated stats
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to add expense: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  if (!browserSupported) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4 text-lg font-semibold">
              ⚠️ Speech Recognition Not Supported
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your browser doesn't support speech recognition.
              <br />
              Please use <strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Safari</strong> for voice input.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Current browser: {navigator.userAgent.split(' ').pop()}
            </div>
            <button onClick={() => navigate('/expenses')} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Mic className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Add from Voice</h1>
            <p className="text-gray-600 dark:text-gray-400">Record or upload voice memo for transcription</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-purple-600 dark:bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} font-semibold`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-purple-600 dark:bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-purple-600 dark:bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} font-semibold`}>
              2
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-16 sm:gap-24 mt-2">
          <span className={`text-sm ${step >= 1 ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
            Record/Upload
          </span>
          <span className={`text-sm ${step >= 2 ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
            Review & Save
          </span>
        </div>
      </div>

      {/* Step 1: Voice Input */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card space-y-6"
        >
          {/* Recording Interface */}
          <div className="space-y-4">
            {/* Record Button */}
            <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-12 text-center">
              <div className="flex flex-col items-center">
                {!isListening ? (
                  <>
                    <button
                      onClick={startRecording}
                      className="w-24 h-24 bg-purple-600 dark:bg-purple-500 text-white rounded-full hover:bg-purple-700 dark:hover:bg-purple-600 transition-all flex items-center justify-center shadow-lg hover:shadow-xl mb-4"
                    >
                      <Mic className="w-12 h-12" />
                    </button>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      🎤 Start Voice Input
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click to start speaking your expense
                    </p>
                  </>
                ) : (
                  <>
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 bg-red-600 dark:bg-red-500 rounded-full animate-pulse opacity-75"></div>
                      <button
                        onClick={stopRecording}
                        className="relative w-24 h-24 bg-red-600 dark:bg-red-500 text-white rounded-full hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center justify-center shadow-lg"
                      >
                        <Square className="w-10 h-10 fill-current" />
                      </button>
                    </div>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                      🎙️ Listening...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Speak clearly. Click to stop.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Transcribed Text Display */}
            {(transcribedText || interimTranscript) && (
              <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                      📝 Transcribed Text {isListening && '🔴'}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      <span className="font-medium">{transcribedText}</span>
                      {interimTranscript && (
                        <span className="text-purple-500 dark:text-purple-400 italic"> {interimTranscript}</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={clearTranscript}
                    className="ml-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    title="Clear transcript"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  {isListening ? '🔴 Still listening... (speak clearly)' : '✓ Capture complete'}
                </p>
              </div>
            )}
          </div>

          {/* Sample Inputs */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">💡 Sample voice inputs:</p>
            <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1 list-disc list-inside">
              <li>"I spent $45.99 at Starbucks for coffee and breakfast"</li>
              <li>"Paid $120 for Uber ride to the airport"</li>
              <li>"Bought groceries at Whole Foods for $85.50"</li>
              <li>"Movie tickets cost $32 at AMC theater"</li>
              <li>"Gas station fill up was $65 at Shell"</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/expenses')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleParse}
              disabled={loading || !transcribedText.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Parsing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Parse Expense
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Review & Edit */}
      {step === 2 && parsedData && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Success Message */}
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-300">Voice Parsed Successfully!</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">Review and edit the details below before saving</p>
            </div>
          </div>

          {/* Transcription */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What You Said</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 italic">"{parsedData.description || transcribedText}"</p>
            </div>
            
            {/* Confidence Score */}
            {parsedData.confidence && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Parsing Confidence</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {(parsedData.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${parsedData.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Parsed Data Form */}
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Merchant
              </label>
              <input
                type="text"
                value={parsedData.merchant}
                onChange={(e) => handleEdit('merchant', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={parsedData.amount}
                onChange={(e) => handleEdit('amount', parseFloat(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={parsedData.category}
                onChange={(e) => handleEdit('category', e.target.value)}
                className="input-field"
              >
                {categories.length === 0 ? (
                  <option value="">Loading categories...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={parsedData.date.split('T')[0]}
                onChange={(e) => handleEdit('date', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={parsedData.description || ''}
                onChange={(e) => handleEdit('description', e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Add notes..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep(1)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Save Expense
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AddVoice;
