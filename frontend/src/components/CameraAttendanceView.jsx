import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CheckCircle2, AlertTriangle, UserCheck, RefreshCw, Volume2, VolumeX, ShieldCheck, X, Sparkles, UserPlus } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useToast } from './Toast';

export default function CameraAttendanceView({ sessionId, onAttendanceMarked }) {
  const { addToast } = useToast();
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [lastRecognized, setLastRecognized] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [markedStudents, setMarkedStudents] = useState([]);
  const [stats, setStats] = useState({ facesCount: 0, recognizedCount: 0 });

  // Quick enroll state
  const [currentFrameData, setCurrentFrameData] = useState(null);
  const [quickEnrollOpen, setQuickEnrollOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Play a soft audio chime for attendance marked
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext could be blocked by autoplay policies
    }
  }, [soundEnabled]);

  useEffect(() => {
    startCamera();
    if (sessionId) {
      loadSessionExistingAttendance();
    }
    loadAvailableStudents();

    return () => {
      stopCamera();
    };
  }, [sessionId]);

  const loadSessionExistingAttendance = async () => {
    try {
      const res = await api.get(`/attendance/session/${sessionId}`);
      if (res.data.presentRecords && res.data.presentRecords.length > 0) {
        setMarkedStudents(
          res.data.presentRecords.map((r) => ({
            studentId: r.studentId,
            studentName: r.studentName,
            rollNumber: r.rollNumber,
            time: r.time,
            confidence: r.confidence,
          }))
        );
      }
    } catch (e) {
      console.warn('Could not load session marked records:', e.message);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const res = await api.get('/students');
      const list = res.data || [];
      setAvailableStudents(list);
      if (list.length > 0 && !selectedStudentId) {
        setSelectedStudentId(list[0].id || list[0]._id);
      }
    } catch (e) {
      console.warn('Could not load students for quick enrollment:', e.message);
    }
  };

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
          startRecognitionLoop();
        };
      }
    } catch (err) {
      console.error('Camera startup error:', err);
      setCameraError(
        'Unable to access camera. Please allow webcam permissions in your browser or make sure another program is not using your camera.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const drawBoundingBoxes = (results, videoWidth, videoHeight) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    overlay.width = videoWidth;
    overlay.height = videoHeight;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    results.forEach((res) => {
      const bbox = res.bbox;
      if (!bbox || bbox.length < 4) return;

      const [x, y, w, h] = bbox;
      const isRecognized = res.recognized;
      const color = isRecognized ? '#10b981' : '#f43f5e';

      // Draw box
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, w, h);

      // Draw corners accent
      const len = Math.min(w, h) * 0.2;
      ctx.lineWidth = 5;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(x, y + h - len); ctx.lineTo(x, y + h); ctx.lineTo(x + len, y + h);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(x + w - len, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - len);
      ctx.stroke();

      // Label background
      const label = isRecognized ? `${res.studentName} (${res.confidence}%)` : `Unknown Face`;
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      const textWidth = ctx.measureText(label).width;

      ctx.fillStyle = isRecognized ? 'rgba(6, 78, 59, 0.9)' : 'rgba(136, 19, 55, 0.9)';
      ctx.fillRect(x, Math.max(0, y - 28), textWidth + 16, 26);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 8, Math.max(18, y - 10));
    });
  };

  const processFrame = async () => {
    if (!videoRef.current || !captureCanvasRef.current || isProcessingRef.current || !scanning) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState !== 4) return;

    isProcessingRef.current = true;
    const canvas = captureCanvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const base64Image = canvas.toDataURL('image/jpeg', 0.85);
    setCurrentFrameData(base64Image);

    try {
      const res = await api.post('/face/recognize', {
        image: base64Image,
        sessionId: sessionId || null,
        autoMark: true,
      });

      const results = res.data.results || [];
      setStats({
        facesCount: res.data.facesDetected || 0,
        recognizedCount: results.filter((r) => r.recognized).length,
      });

      // Draw real-time bounding boxes
      drawBoundingBoxes(results, width, height);

      // Handle recognized students
      if (results.length > 0) {
        setLastRecognized(results[0]);

        results.forEach((rec) => {
          if (rec.recognized && rec.markedNow) {
            playChime();
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#38bdf8', '#10b981', '#6366f1'],
            });
            addToast(`✓ Attendance marked for ${rec.studentName}!`, 'success', 3000);

            // Add to marked list
            setMarkedStudents((prev) => {
              if (prev.some((s) => s.studentId === rec.studentId)) return prev;
              return [
                {
                  studentId: rec.studentId,
                  studentName: rec.studentName,
                  rollNumber: rec.rollNumber,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  confidence: rec.confidence,
                },
                ...prev,
              ];
            });

            if (onAttendanceMarked) {
              onAttendanceMarked(rec);
            }
          }
        });
      } else {
        // Clear bounding box if no face
        const overlay = overlayCanvasRef.current;
        if (overlay) {
          const oCtx = overlay.getContext('2d');
          oCtx.clearRect(0, 0, overlay.width, overlay.height);
        }
      }
    } catch (err) {
      console.warn('Recognition frame processing error:', err.message);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const startRecognitionLoop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Scan every 750ms for responsive face detection without overwhelming network
    intervalRef.current = setInterval(() => {
      processFrame();
    }, 750);
  };

  const handleQuickEnroll = async () => {
    if (!selectedStudentId) {
      addToast('Please select a student to register.', 'warning');
      return;
    }
    if (!currentFrameData) {
      addToast('No camera frame captured yet.', 'warning');
      return;
    }

    setEnrolling(true);
    try {
      const res = await api.post('/face/register', {
        studentId: selectedStudentId,
        images: [currentFrameData],
        angle: 'front',
      });
      addToast(res.data.message || 'Face biometrics registered successfully!', 'success');
      setQuickEnrollOpen(false);
      loadAvailableStudents();
    } catch (err) {
      console.error('Quick enrollment error:', err);
      const msg = err.response?.data?.detail || 'Failed to register face biometrics. Please ensure your face is well-lit and clearly visible.';
      addToast(msg, 'error');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Camera Live Feed Column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-950 shadow-2xl">
          {/* Top HUD Bar */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                AI Face Attendance Live
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickEnrollOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-cyan-500/40 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/50 shadow-sm"
                title="Quick Enroll Current Face"
              >
                <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                Enroll Face
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition"
                title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setScanning(!scanning)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                  scanning
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-amber-500/20 border-amber-400 text-amber-300'
                }`}
              >
                {scanning ? 'Scanning Active' : 'Scanning Paused'}
              </button>
            </div>
          </div>

          {/* Camera Frame */}
          <div className="relative aspect-[4/3] w-full bg-black flex items-center justify-center">
            {cameraError ? (
              <div className="p-8 text-center max-w-md">
                <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">Webcam Error</h4>
                <p className="text-xs text-slate-400 mb-5">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Restart Camera
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                <canvas ref={overlayCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
                <canvas ref={captureCanvasRef} className="hidden" />

                {/* Cyber Scanner line overlay */}
                {scanning && <div className="scanner-line pointer-events-none" />}
              </>
            )}
          </div>

          {/* Bottom HUD stats */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-5 py-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>
                Detected Faces: <strong className="text-white">{stats.facesCount}</strong>
              </span>
              <span>
                Recognized: <strong className="text-emerald-400">{stats.recognizedCount}</strong>
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-400/80">
              SFace 128D Embedding Engine
            </div>
          </div>
        </div>
      </div>

      {/* Recognition Status & Marked Students Column */}
      <div className="space-y-4">
        {/* Latest Recognized Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-bold tracking-wider text-slate-200 uppercase">
              Current Recognition State
            </h4>
          </div>

          {lastRecognized ? (
            <div
              className={`rounded-2xl border p-4 transition-all ${
                lastRecognized.recognized
                  ? 'border-emerald-500/40 bg-emerald-950/30'
                  : 'border-rose-500/40 bg-rose-950/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Recognized Identity
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {lastRecognized.studentName}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Roll No: <span className="text-cyan-400">{lastRecognized.rollNumber}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Confidence
                  </span>
                  <div className="text-lg font-extrabold text-emerald-400">
                    {lastRecognized.confidence}%
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-400">Status</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    lastRecognized.recognized
                      ? lastRecognized.alreadyMarked && !lastRecognized.markedNow
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {lastRecognized.recognized ? (
                    lastRecognized.alreadyMarked && !lastRecognized.markedNow ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Already Marked Today
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ✓ Attendance Marked
                      </>
                    )
                  ) : (
                    'Face Not Recognized'
                  )}
                </span>
              </div>

              {/* Quick Enroll Button when Unknown Face */}
              {!lastRecognized.recognized && (
                <div className="mt-3 pt-3 border-t border-rose-500/20">
                  <button
                    onClick={() => setQuickEnrollOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    ⚡ Quick-Enroll This Face to Student
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-slate-500 text-xs">
              <Camera className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              Scanning for registered students...
            </div>
          )}
        </div>

        {/* Live Attendance Marked List */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-xl shadow-xl flex flex-col h-[320px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Present This Session</h4>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              {markedStudents.length} Marked
            </span>
          </div>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {markedStudents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500">
                <p>No students marked yet in this live session.</p>
                <p className="text-[11px] text-slate-600 mt-1">Faces will appear here automatically when recognized.</p>
              </div>
            ) : (
              markedStudents.map((st, idx) => (
                <div
                  key={`${st.studentId}-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-white">{st.studentName}</h5>
                    <p className="text-[11px] font-mono text-cyan-400">{st.rollNumber}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400">{st.time}</span>
                    <div className="text-[10px] text-emerald-400 font-bold">{st.confidence}% Match</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Biometric Enrollment Modal */}
      {quickEnrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Quick Face Enrollment
              </div>
              <button
                onClick={() => setQuickEnrollOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Assign your live camera frame directly as biometric face data to a registered student.
            </p>

            {/* Frame Snapshot Preview */}
            {currentFrameData && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                <img src={currentFrameData} alt="Captured Face" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400">
                  Live Snapshot Frame
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Student:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                {availableStudents.map((s) => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.name} ({s.rollNumber}) - {s.course} {s.hasFaceData ? '✓ Face Enrolled' : '⚠️ No Face'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setQuickEnrollOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickEnroll}
                disabled={enrolling || !currentFrameData}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition disabled:opacity-50 flex items-center gap-2"
              >
                {enrolling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Registering Face...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm & Enroll Face
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
