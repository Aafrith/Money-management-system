import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Upload, CheckCircle, X, Camera, RotateCcw } from 'lucide-react';
import { parserService, expenseService, categoryService } from '../../services';
import { useExpenseStore } from '../../store';
import toast from 'react-hot-toast';

const AddReceipt = () => {
  const navigate = useNavigate();
  const { addExpense, triggerRefresh } = useExpenseStore();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [step, setStep] = useState(1);
  const [cameraMode, setCameraMode] = useState(false);
  const [stream, setStream] = useState(null);
  const [categories, setCategories] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setStream(mediaStream);
      setCameraMode(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Unable to access camera. Please use file upload instead.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraMode(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
        setImage(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          stopCamera();
        };
        reader.readAsDataURL(file);
      }, 'image/jpeg', 0.95);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleParse = async () => {
    if (!image) {
      toast.error('Please select an image');
      return;
    }

    setLoading(true);
    try {
      const result = await parserService.parseReceipt(image);
      
      // Transform the YOLO response to ensure all fields are properly formatted
      const transformedData = {
        amount: result.amount || 0,
        merchant: result.merchant || 'Unknown Merchant',
        date: result.date || new Date().toISOString(),
        category: result.category || (categories.length > 0 ? categories[0].name : ''),
        description: result.description || '',
        source: 'receipt',
        items: (result.items || []).map(item => ({
          name: item.product || 'Unknown Item',
          price: item.price || 0
        })),
        tax: result.tax || 0,
        discount: result.discount || 0,
        time: result.time || '',
        confidence: result.confidence || 0.0
      };
      
      setParsedData(transformedData);
      setStep(2);
      
      // Show success message with confidence level
      const confidencePercent = Math.round(transformedData.confidence * 100);
      toast.success(`Receipt parsed successfully! (Confidence: ${confidencePercent}%)`);
    } catch (error) {
      console.error('Receipt parsing error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to parse receipt';
      toast.error(errorMessage);
      
      // If it's a configuration error, show more details
      if (error.response?.status === 503) {
        toast.error('YOLO model not configured. Please contact administrator.', { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare expense data for API
      const expenseData = {
        merchant: parsedData.merchant,
        amount: parseFloat(parsedData.amount),
        category: parsedData.category,
        date: parsedData.date,
        description: parsedData.description || '',
        source: 'receipt'
      };
      
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

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    stopCamera();
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
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Add from Receipt</h1>
            <p className="text-gray-600 dark:text-gray-400">Capture or upload receipt for automatic parsing</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} font-semibold`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} font-semibold`}>
              2
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-16 sm:gap-24 mt-2">
          <span className={`text-sm ${step >= 1 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
            Capture Image
          </span>
          <span className={`text-sm ${step >= 2 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
            Review & Save
          </span>
        </div>
      </div>

      {/* Step 1: Capture/Upload Image */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card space-y-6"
        >
          {/* Camera View */}
          {cameraMode && !imagePreview && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={capturePhoto}
                  className="p-5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-2xl"
                >
                  <Camera className="w-8 h-8" />
                </button>
                <button
                  onClick={stopCamera}
                  className="p-5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-2xl"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* Upload Area or Preview */}
          {!cameraMode && !imagePreview && (
            <div className="space-y-4">
              {/* Camera Button */}
              <button
                onClick={startCamera}
                className="w-full border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-8 text-center hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
              >
                <Camera className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📸 Capture Receipt with Camera
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use your device camera to capture receipt
                </p>
              </button>

              <div className="text-center text-gray-500 dark:text-gray-400 font-medium">OR</div>

              {/* File Upload */}
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all cursor-pointer">
                  <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📁 Upload Receipt Image
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PNG, JPG or JPEG (max. 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {imagePreview && !cameraMode && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Receipt preview"
                className="w-full rounded-xl shadow-lg"
              />
              <button
                onClick={removeImage}
                className="absolute top-4 right-4 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setImagePreview(null); setImage(null); }}
                className="absolute top-4 left-4 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Tips */}
          {!cameraMode && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">📸 Tips for best results:</p>
              <ul className="text-sm text-green-700 dark:text-green-400 space-y-1 list-disc list-inside">
                <li>Ensure the receipt is well-lit and in focus</li>
                <li>Capture the entire receipt including total amount</li>
                <li>Avoid shadows and glare on the receipt</li>
                <li>Place receipt on a flat, contrasting surface</li>
                <li>Hold your device steady while capturing</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/expenses')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleParse}
              disabled={loading || !image}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" />
                  Parse Receipt
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
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 dark:text-green-300">Receipt Parsed Successfully!</p>
              <p className="text-sm text-green-700 dark:text-green-400">Review and edit the details below before saving</p>
            </div>
            {parsedData.confidence !== undefined && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    {Math.round(parsedData.confidence * 100)}%
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">Confidence</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receipt Preview */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Receipt Image</h3>
              <img
                src={imagePreview}
                alt="Receipt"
                className="w-full rounded-lg shadow-md"
              />
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
                  rows="2"
                  placeholder="Add notes..."
                />
              </div>
            </div>
          </div>

          {/* Itemized List */}
          {parsedData.items && parsedData.items.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Itemized Details ({parsedData.items.length} items)</h3>
              <div className="space-y-2">
                {parsedData.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 truncate flex-1">{item.name}</span>
                    <span className="font-semibold text-gray-900 dark:text-white ml-2">
                      ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                    </span>
                  </div>
                ))}
                
                {/* Subtotal */}
                {parsedData.items.length > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg mt-2">
                    <span className="font-medium text-gray-900 dark:text-white">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${parsedData.items.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0).toFixed(2)}
                    </span>
                  </div>
                )}
                
                {/* Tax */}
                {parsedData.tax > 0 && (
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Tax</span>
                    <span className="text-gray-900 dark:text-white">+${parsedData.tax.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Discount */}
                {parsedData.discount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300">Discount</span>
                    <span className="text-gray-900 dark:text-white">-${parsedData.discount.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Total */}
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/30 border-t-2 border-green-600 dark:border-green-500 rounded-lg mt-3">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                    ${typeof parsedData.amount === 'number' ? parsedData.amount.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}

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

export default AddReceipt;
