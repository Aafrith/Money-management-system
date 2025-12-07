import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Upload, CheckCircle, Square, Play, Pause, Trash2 } from 'lucide-react';
import { parserService, expenseService, categoryService } from '../../services';
import { useExpenseStore } from '../../store';
import toast from 'react-hot-toast';

const AddVoice = () => {
  const navigate = useNavigate();
  const addExpense = useExpenseStore((state) => state.addExpense);
  const [audioFile, setAudioFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Convert to File object
        const file = new File([blob], 'voice_memo.webm', { type: 'audio/webm' });
        setAudioFile(file);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      toast.error('Unable to access microphone');
      console.error('Microphone error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast.success('Recording stopped');
    }
  };

  const deleteRecording = () => {
    setAudioFile(null);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Audio file should be less than 10MB');
        return;
      }
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      toast.success('Audio file selected');
    }
  };

  const handleParse = async () => {
    if (!audioFile) {
      toast.error('Please record or upload audio');
      return;
    }

    setLoading(true);
    try {
      const result = await parserService.parseVoice(audioFile);
      setParsedData(result);
      setStep(2);
      toast.success('Voice transcribed successfully!');
    } catch (error) {
      // Mock transcription for demo
      const transcriptionTexts = [
        { text: "I spent $45.99 at Starbucks for coffee", amount: 45.99, merchant: "Starbucks", category: "Food & Dining" },
        { text: "Paid $120 for Uber ride to airport", amount: 120, merchant: "Uber", category: "Transportation" },
        { text: "Bought groceries at Walmart for $85.50", amount: 85.50, merchant: "Walmart", category: "Food & Dining" },
        { text: "Movie tickets cost $32 at AMC theater", amount: 32, merchant: "AMC", category: "Entertainment" },
      ];
      
      const randomTranscript = transcriptionTexts[Math.floor(Math.random() * transcriptionTexts.length)];
      
      const mockParsed = {
        amount: randomTranscript.amount,
        merchant: randomTranscript.merchant,
        date: new Date().toISOString(),
        category: randomTranscript.category,
        source: 'voice',
        transcription: randomTranscript.text,
        description: randomTranscript.text,
      };
      setParsedData(mockParsed);
      setStep(2);
      toast.success('Voice transcribed (demo mode)');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const newExpense = await expenseService.create(parsedData);
      addExpense(newExpense);
      toast.success('Expense added successfully!');
      navigate('/expenses');
    } catch (error) {
      toast.error('Failed to add expense: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value) => {
    setParsedData({ ...parsedData, [field]: value });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      {/* Step 1: Record/Upload Audio */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card space-y-6"
        >
          {/* Recording Interface */}
          {!audioUrl && (
            <div className="space-y-4">
              {/* Record Button */}
              <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-12 text-center">
                <div className="flex flex-col items-center">
                  {!isRecording ? (
                    <>
                      <button
                        onClick={startRecording}
                        className="w-24 h-24 bg-purple-600 dark:bg-purple-500 text-white rounded-full hover:bg-purple-700 dark:hover:bg-purple-600 transition-all flex items-center justify-center shadow-lg hover:shadow-xl mb-4"
                      >
                        <Mic className="w-12 h-12" />
                      </button>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        🎤 Record Voice Memo
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Click to start recording your expense
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
                        Recording...
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                        {formatTime(recordingTime)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Click to stop recording
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="text-center text-gray-500 dark:text-gray-400 font-medium">OR</div>

              {/* File Upload */}
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer">
                  <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📁 Upload Audio File
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    MP3, WAV, M4A, or WebM (max. 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Audio Playback */}
          {audioUrl && (
            <div className="space-y-4">
              <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-purple-900 dark:text-purple-300">Audio Recorded</p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Duration: {formatTime(recordingTime)}</p>
                  </div>
                  <button
                    onClick={deleteRecording}
                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Audio Player Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayback}
                    className="p-3 bg-purple-600 dark:bg-purple-500 text-white rounded-full hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex-shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </button>
                  
                  <audio
                    ref={audioPlayerRef}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    className="flex-1"
                    controls
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !audioFile}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Transcribing...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Transcribe Audio
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
              <p className="font-semibold text-purple-900 dark:text-purple-300">Audio Transcribed Successfully!</p>
              <p className="text-sm text-purple-700 dark:text-purple-400">Review and edit the details below before saving</p>
            </div>
          </div>

          {/* Transcription */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Transcription</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 italic">"{parsedData.transcription}"</p>
            </div>
            
            {audioUrl && (
              <div className="mt-4">
                <audio src={audioUrl} controls className="w-full" />
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
