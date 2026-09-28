import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, X, Shield, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

const ANGLES = [
  { id: 'front', label: 'Front Pose', instruction: 'Look directly into the camera straight ahead' },
  { id: 'left', label: 'Slight Left', instruction: 'Turn your head slightly towards your left side' },
  { id: 'right', label: 'Slight Right', instruction: 'Turn your head slightly towards your right side' },
  { id: 'up', label: 'Slight Up', instruction: 'Tilt your chin slightly upwards' },
  { id: 'down', label: 'Slight Down', instruction: 'Tilt your head slightly downwards' },
];

export default function FaceCaptureModal({ student, onClose, onSuccess }) {
  const { addToast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState({});
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error('Camera access denied or error:', err);
      setCameraError(
        'Unable to access camera. Please check browser camera permissions or ensure another application is not using it.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureCurrentAngle = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const angleId = ANGLES[currentStep].id;

    setCapturedImages((prev) => ({
      ...prev,
      [angleId]: dataUrl,
    }));

    addToast(`Captured ${ANGLES[currentStep].label}!`, 'info', 2000);

    // Advance to next angle if available
    if (currentStep < ANGLES.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const retakeAngle = (index) => {
    setCurrentStep(index);
  };

  const handleSaveEmbeddings = async () => {
    const imagesList = Object.values(capturedImages);
    if (imagesList.length === 0) {
      addToast('Please capture at least one face angle image.', 'warning');
      return;
    }

    const sid = student?.id || student?._id;
    if (!sid) {
      addToast('Error: Student ID not found.', 'error');
      return;
    }

    setUploading(true);
    try {
      const res = await api.post('/face/register', {
        studentId: sid,
        images: imagesList,
        angle: 'multi',
      });

      addToast(res.data.message || 'Face biometrics registered successfully!', 'success');
      stopCamera();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Face registration error:', err);
      const msg = err.response?.data?.detail || 'Failed to register face biometrics. Please ensure your face is well-lit and clearly visible.';
      addToast(msg, 'error', 6000);
    } finally {
      setUploading(false);
    }
  };

  const currentAngle = ANGLES[currentStep];
  const capturedCount = Object.keys(capturedImages).length;
  const isComplete = capturedCount === ANGLES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Biometric Face Enrollment</h3>
              <p className="text-xs text-slate-400">
                Registering for <span className="text-cyan-400 font-semibold">{student?.name}</span> ({student?.rollNumber})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {/* Angle Progress Bar */}
          <div className="flex items-center justify-between gap-2">
            {ANGLES.map((angle, idx) => {
              const isCaptured = !!capturedImages[angle.id];
              const isCurrent = idx === currentStep;
              return (
                <button
                  key={angle.id}
                  onClick={() => retakeAngle(idx)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center text-xs font-semibold transition-all border ${
                    isCaptured
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-800/40 border-slate-700 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isCaptured && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    <span>{angle.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Angle Instruction Banner */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-2.5 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Step {currentStep + 1} of {ANGLES.length}: {currentAngle.label}
            </span>
            <p className="text-sm font-medium text-slate-200 mt-0.5">{currentAngle.instruction}</p>
          </div>

          {/* Camera Viewport Container */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-slate-700 bg-black shadow-inner flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white mb-1">Camera Inaccessible</h4>
                <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* HUD Overlay with Face Oval Guide */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  {/* Face Guide Oval */}
                  <div className="relative w-56 h-72 border-2 border-dashed border-cyan-400/80 rounded-[50%] shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    {/* Scanner line animation */}
                    <div className="scanner-line" />
                    
                    {/* Corner marks */}
                    <div className="absolute top-2 left-6 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
                    <div className="absolute top-2 right-6 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
                    <div className="absolute bottom-2 left-6 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
                    <div className="absolute bottom-2 right-6 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />
                  </div>
                  
                  <div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[11px] font-mono text-cyan-300">
                    ALIGN FACE INSIDE OVAL
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Captured Thumbnails Gallery */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {ANGLES.map((angle, idx) => {
              const img = capturedImages[angle.id];
              return (
                <div
                  key={angle.id}
                  onClick={() => retakeAngle(idx)}
                  className={`relative h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border transition ${
                    idx === currentStep
                      ? 'border-cyan-400 ring-2 ring-cyan-500/50'
                      : img
                      ? 'border-emerald-500/50'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  {img ? (
                    <img src={img} alt={angle.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                      Empty
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-center text-[9px] font-bold text-slate-300 py-0.5">
                    {angle.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/50 px-6 py-4">
          <div className="text-xs text-slate-400">
            {capturedCount} of {ANGLES.length} angle poses captured
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={captureCurrentAngle}
              disabled={!cameraActive}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-600/30 transition active:scale-95"
            >
              <Camera className="w-4 h-4" />
              Capture {currentAngle.label}
            </button>

            <button
              onClick={handleSaveEmbeddings}
              disabled={capturedCount === 0 || uploading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Embeddings...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Embeddings ({capturedCount})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
