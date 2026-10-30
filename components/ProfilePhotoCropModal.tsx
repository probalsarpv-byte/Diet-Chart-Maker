import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  compressProfilePhotoForFreeTier,
  CompressedPhotoResult,
  DetectedFaceBox,
  detectPrimaryFaceRegion,
  formatByteSize,
  SourceCropRegion,
} from '../services/imageCompressionService';
import { useDeviceSkin } from '../services/deviceSkinService';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Focus,
  Monitor,
  Move,
  RotateCcw,
  Smartphone,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface ProfilePhotoCropModalProps {
  file: File | null;
  lang?: 'bn' | 'en';
  darkMode?: boolean;
  onCancel: () => void;
  onConfirm: (result: CompressedPhotoResult) => void;
}

const ProfilePhotoCropModal: React.FC<ProfilePhotoCropModalProps> = ({
  file,
  lang = 'bn',
  darkMode = false,
  onCancel,
  onConfirm,
}) => {
  const isBn = lang === 'bn';
  const { isMobileSkin, viewportWidth, preference, setPreference } = useDeviceSkin();

  // Dynamic stage size: compact on mobile screens so controls + stage fit in one screen without scrolling
  const stageSize = isMobileSkin
    ? Math.max(200, Math.min(236, viewportWidth - 48))
    : 280;

  const [imgUrl, setImgUrl] = useState<string>('');
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 600, h: 600 });
  const [zoom, setZoom] = useState<number>(1);
  // Pan offsets in stage pixels relative to centered cover position
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [detectedFace, setDetectedFace] = useState<DetectedFaceBox | null>(null);
  const [isAutoCenteredOnFace, setIsAutoCenteredOnFace] = useState<boolean>(false);
  const [isDetectingFace, setIsDetectingFace] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const dragStartRef = useRef<{ pointerX: number; pointerY: number; startPanX: number; startPanY: number }>({
    pointerX: 0,
    pointerY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  // Pinch-to-zoom state for mobile two-finger touch gestures
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  /**
   * Given image natural dimensions (nw, nh) and a detected face box,
   * computes the optimal zoom and clamped pan so the circular crop overlay
   * centers directly on the subject's face with comfortable portrait framing.
   */
  const computeFaceCenteredTransform = useCallback(
    (nw: number, nh: number, face: DetectedFaceBox, currentStageSize: number) => {
      const baseScale = Math.max(currentStageSize / nw, currentStageSize / nh);
      const circleDiameter = currentStageSize - 24;

      const desiredHeadSpanPx = Math.max(face.width, face.height) * 1.85;
      const idealEffectiveScale =
        desiredHeadSpanPx > 24 ? circleDiameter / desiredHeadSpanPx : baseScale * 1.15;

      const rawZoom = idealEffectiveScale / baseScale;
      const targetZoom = Math.min(2.3, Math.max(1.08, Number(rawZoom.toFixed(2))));

      const effectiveScale = baseScale * targetZoom;
      const rw = nw * effectiveScale;
      const rh = nh * effectiveScale;

      const desiredPanX = (nw / 2 - face.centerX) * effectiveScale;
      const desiredPanY = (nh / 2 - face.centerY) * effectiveScale;

      const limitX = Math.max(0, (rw - currentStageSize) / 2);
      const limitY = Math.max(0, (rh - currentStageSize) / 2);

      return {
        zoom: targetZoom,
        pan: {
          x: Math.round(Math.min(limitX, Math.max(-limitX, desiredPanX))),
          y: Math.round(Math.min(limitY, Math.max(-limitY, desiredPanY))),
        },
      };
    },
    []
  );

  // Load image object URL, natural dimensions, and run automatic face detection when file changes
  useEffect(() => {
    if (!file) {
      setImgUrl('');
      setDetectedFace(null);
      setIsAutoCenteredOnFace(false);
      return;
    }

    let cancelled = false;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDetectedFace(null);
    setIsAutoCenteredOnFace(false);
    setIsDetectingFace(true);
    setErrorMsg('');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      if (cancelled) return;
      const nw = img.naturalWidth || img.width || 600;
      const nh = img.naturalHeight || img.height || 600;
      setNaturalSize({ w: nw, h: nh });

      const baseScale = Math.max(stageSize / nw, stageSize / nh);
      const renderedH = nh * baseScale;
      const initialMaxPanY = Math.max(0, (renderedH - stageSize) / 2);
      if (initialMaxPanY > 8) {
        setPan({ x: 0, y: Math.round(initialMaxPanY * 0.25) });
      }

      const face = await detectPrimaryFaceRegion(img);
      if (cancelled) return;
      setIsDetectingFace(false);

      if (face) {
        setDetectedFace(face);
        const centered = computeFaceCenteredTransform(nw, nh, face, stageSize);
        setZoom(centered.zoom);
        setPan(centered.pan);
        setIsAutoCenteredOnFace(true);
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      setIsDetectingFace(false);
      setErrorMsg(
        isBn
          ? 'ছবিটি লোড করা যায়নি। অনুগ্রহ করে একটি বৈধ ইমেজ ফাইল নির্বাচন করুন।'
          : 'Could not load image file. Please select a valid image.'
      );
    };
    img.src = url;

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file, isBn, computeFaceCenteredTransform, stageSize]);

  // Compute rendered image dimensions in stage coordinates at current zoom
  const baseCoverScale = Math.max(stageSize / naturalSize.w, stageSize / naturalSize.h);
  const effectiveScale = baseCoverScale * zoom;
  const renderedWidth = naturalSize.w * effectiveScale;
  const renderedHeight = naturalSize.h * effectiveScale;

  const clampPan = useCallback(
    (x: number, y: number, currentZoom = zoom) => {
      const scale = baseCoverScale * currentZoom;
      const rw = naturalSize.w * scale;
      const rh = naturalSize.h * scale;
      const limitX = Math.max(0, (rw - stageSize) / 2);
      const limitY = Math.max(0, (rh - stageSize) / 2);
      return {
        x: Math.min(limitX, Math.max(-limitX, x)),
        y: Math.min(limitY, Math.max(-limitY, y)),
      };
    },
    [baseCoverScale, naturalSize.w, naturalSize.h, stageSize, zoom]
  );

  // Re-clamp pan whenever zoom changes
  const handleZoomChange = (nextZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, Number(nextZoom.toFixed(2))));
    setZoom(clampedZoom);
    setPan((prev) => clampPan(prev.x, prev.y, clampedZoom));
    setIsAutoCenteredOnFace(false);
  };

  // Nudge pan by delta pixels (ideal for one-handed mobile thumb adjustment)
  const handleNudgePan = (dx: number, dy: number) => {
    setPan((prev) => clampPan(prev.x + dx, prev.y + dy));
    setIsAutoCenteredOnFace(false);
  };

  const handleSnapToDetectedFace = () => {
    if (!detectedFace) return;
    const centered = computeFaceCenteredTransform(naturalSize.w, naturalSize.h, detectedFace, stageSize);
    setZoom(centered.zoom);
    setPan(centered.pan);
    setIsAutoCenteredOnFace(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pinchStartDistRef.current !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setIsAutoCenteredOnFace(false);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || pinchStartDistRef.current !== null) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    setPan(clampPan(dragStartRef.current.startPanX + dx, dragStartRef.current.startPanY + dy));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
    setIsDragging(false);
  };

  // Two-finger Pinch-to-Zoom handlers for mobile touch screens
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = zoom;
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchStartDistRef.current && pinchStartDistRef.current > 10) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDistRef.current;
      handleZoomChange(pinchStartZoomRef.current * ratio);
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  // Convert current stage pan & zoom into exact source crop coordinates (sx, sy, sw, sh)
  const computeSourceCropRegion = (): SourceCropRegion => {
    const imgLeft = (stageSize - renderedWidth) / 2 + pan.x;
    const imgTop = (stageSize - renderedHeight) / 2 + pan.y;

    const sx = Math.max(0, -imgLeft / effectiveScale);
    const sy = Math.max(0, -imgTop / effectiveScale);
    const sw = Math.min(naturalSize.w - sx, stageSize / effectiveScale);
    const sh = Math.min(naturalSize.h - sy, stageSize / effectiveScale);

    return { sx, sy, sw, sh };
  };

  const handleConfirmCropAndCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const cropRegion = computeSourceCropRegion();
      const result = await compressProfilePhotoForFreeTier(file, {
        maxDimension: 320,
        targetMaxBytes: 24 * 1024,
        squareCrop: true,
        cropRegion,
      });
      onConfirm(result);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isBn ? 'ছবি ক্রপ ও অপ্টিমাইজ করতে সমস্যা হয়েছে।' : 'Failed to crop and optimize photo.')
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) return null;

  const imgLeft = (stageSize - renderedWidth) / 2 + pan.x;
  const imgTop = (stageSize - renderedHeight) / 2 + pan.y;

  const stageFaceCenter = detectedFace
    ? {
        x: imgLeft + detectedFace.centerX * effectiveScale,
        y: imgTop + detectedFace.centerY * effectiveScale,
        r: Math.max(
          16,
          Math.min(58, (Math.max(detectedFace.width, detectedFace.height) * effectiveScale) / 2)
        ),
      }
    : null;

  return (
    <div
      className={`fixed inset-0 z-[320] flex ${
        isMobileSkin ? 'items-end justify-center p-0' : 'items-center justify-center p-4'
      } bg-black/80 backdrop-blur-sm animate-in fade-in duration-200`}
    >
      <div
        className={`w-full ${
          isMobileSkin
            ? 'max-w-lg rounded-t-[28px] border-t px-4 pt-3 pb-6 max-h-[94dvh] overflow-y-auto space-y-3.5'
            : 'max-w-md rounded-3xl border p-6 space-y-5'
        } shadow-2xl ${
          darkMode
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Mobile Pull Handle Bar */}
        {isMobileSkin && (
          <div className="w-12 h-1.5 rounded-full bg-slate-400/40 mx-auto mb-1" />
        )}

        {/* Modal Header with Adaptive Skin Switcher */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {isMobileSkin
                  ? isBn
                    ? '📱 মোবাইল টাচ ক্রপ ইন্টারফেস'
                    : '📱 Mobile Touch Crop Skin'
                  : isBn
                  ? '💻 পিসি স্টুডিও ক্রপ ইন্টারফেস'
                  : '💻 PC Studio Crop Skin'}
              </p>
              <button
                type="button"
                onClick={() => setPreference(isMobileSkin ? 'desktop' : 'mobile')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1 border ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title={isBn ? 'ডিভাইস স্কিন পরিবর্তন করুন' : 'Switch Device Skin'}
              >
                {isMobileSkin ? (
                  <>
                    <Monitor className="w-3 h-3 text-teal-500" />
                    <span>{isBn ? 'পিসি মোড' : 'PC Mode'}</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3 h-3 text-teal-500" />
                    <span>{isBn ? 'মোবাইল মোড' : 'Mobile Mode'}</span>
                  </>
                )}
              </button>
              {preference !== 'auto' && (
                <button
                  type="button"
                  onClick={() => setPreference('auto')}
                  className="text-[10px] underline opacity-65 hover:opacity-100"
                >
                  {isBn ? 'অটো' : 'Auto'}
                </button>
              )}
            </div>
            <h3 className={`${isMobileSkin ? 'text-sm' : 'text-base md:text-lg'} font-extrabold mt-0.5`}>
              {isBn
                ? 'বৃত্তের ভেতর আপনার মুখমণ্ডল মাঝখানে আনুন'
                : 'Center Your Face Inside the Circle'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close crop modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Circular Crop Viewport */}
        <div className="flex flex-col items-center space-y-2">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ width: stageSize, height: stageSize, touchAction: 'none' }}
            className={`relative rounded-2xl overflow-hidden select-none border-2 ${
              isDragging
                ? 'cursor-grabbing border-teal-500'
                : 'cursor-grab border-slate-300 dark:border-slate-700'
            } bg-slate-950 shadow-inner`}
          >
            {imgUrl && (
              <img
                src={imgUrl}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${renderedWidth}px`,
                  height: `${renderedHeight}px`,
                  left: `${imgLeft}px`,
                  top: `${imgTop}px`,
                }}
                className="absolute max-w-none pointer-events-none select-none"
              />
            )}

            {/* Circular Crop Mask Overlay */}
            <svg
              viewBox={`0 0 ${stageSize} ${stageSize}`}
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <defs>
                <mask id="profile-circular-crop-mask">
                  <rect width={stageSize} height={stageSize} fill="white" />
                  <circle
                    cx={stageSize / 2}
                    cy={stageSize / 2}
                    r={stageSize / 2 - 12}
                    fill="black"
                  />
                </mask>
              </defs>

              <rect
                width={stageSize}
                height={stageSize}
                fill="rgba(2, 6, 23, 0.62)"
                mask="url(#profile-circular-crop-mask)"
              />

              <circle
                cx={stageSize / 2}
                cy={stageSize / 2}
                r={stageSize / 2 - 12}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="2.5"
              />

              <line
                x1={stageSize / 2}
                y1={20}
                x2={stageSize / 2}
                y2={stageSize - 20}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={20}
                y1={stageSize / 2}
                x2={stageSize - 20}
                y2={stageSize / 2}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {stageFaceCenter && isAutoCenteredOnFace && (
                <circle
                  cx={stageFaceCenter.x}
                  cy={stageFaceCenter.y}
                  r={stageFaceCenter.r}
                  fill="none"
                  stroke="rgba(52, 211, 153, 0.7)"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
              )}
            </svg>

            {/* Top Face Detection Status Indicator */}
            <div className="absolute top-2 inset-x-0 flex justify-center pointer-events-none px-2">
              {isDetectingFace ? (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-950/80 text-teal-300 text-[10px] font-semibold">
                  {isBn ? 'মুখমণ্ডল শনাক্ত হচ্ছে...' : 'Detecting face...'}
                </span>
              ) : detectedFace ? (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-950/80 text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                  <Focus className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {isAutoCenteredOnFace
                      ? isBn
                        ? 'মুখমণ্ডল অটো-সেন্টার করা হয়েছে'
                        : 'Face auto-centered'
                      : isBn
                      ? 'ম্যানুয়াল পজিশন সক্রিয়'
                      : 'Manual position'}
                  </span>
                </span>
              ) : null}
            </div>

            {/* Drag / Pinch Instruction Footer */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none px-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-950/75 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs">
                <Move className="w-3 h-3 text-teal-400 shrink-0" />
                <span className="truncate">
                  {isMobileSkin
                    ? isBn
                      ? 'আঙুল দিয়ে টানুন বা নিচের তীর বাটন চাপুন'
                      : 'Drag with finger or tap arrows below'
                    : isBn
                    ? 'মাউস দিয়ে ড্র্যাগ করে পজিশন ঠিক করুন'
                    : 'Drag photo to fine-tune position'}
                </span>
              </span>
            </div>
          </div>

          {/* Mobile One-Handed Thumb Nudge Bar (Only shown in Mobile Skin for effortless positioning) */}
          {isMobileSkin && (
            <div className="w-full flex items-center justify-between gap-1.5 pt-0.5">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleNudgePan(14, 0)}
                  className={`h-10 px-3 rounded-xl border flex items-center justify-center active:scale-95 ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}
                  aria-label="Move image right"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgePan(0, 14)}
                  className={`h-10 px-3 rounded-xl border flex items-center justify-center active:scale-95 ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}
                  aria-label="Move image down"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgePan(0, -14)}
                  className={`h-10 px-3 rounded-xl border flex items-center justify-center active:scale-95 ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}
                  aria-label="Move image up"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgePan(-14, 0)}
                  className={`h-10 px-3 rounded-xl border flex items-center justify-center active:scale-95 ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
                  }`}
                  aria-label="Move image left"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {detectedFace && (
                <button
                  type="button"
                  onClick={handleSnapToDetectedFace}
                  className={`h-10 px-3 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs ${
                    isAutoCenteredOnFace
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-600 text-white'
                  }`}
                >
                  <Focus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'অটো-ফেস' : 'Auto-Face'}</span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Zoom, Auto-Center Face & Reset Controls */}
        <div
          className={`p-3 rounded-2xl border space-y-2 ${
            darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold opacity-80">
              {isBn ? 'জুম (Zoom):' : 'Zoom:'}{' '}
              <strong className="font-mono text-teal-600 dark:text-teal-400 tabular-nums">
                {Math.round(zoom * 100)}%
              </strong>
            </span>
            <div className="flex items-center gap-1.5">
              {!isMobileSkin && detectedFace && (
                <button
                  type="button"
                  onClick={handleSnapToDetectedFace}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors ${
                    isAutoCenteredOnFace
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-500/15 text-teal-600 dark:text-teal-300 hover:bg-teal-500/25'
                  }`}
                >
                  <Focus className="w-3 h-3" />
                  <span>{isBn ? 'অটো-ফেস সেন্টার' : 'Auto-Center Face'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setIsAutoCenteredOnFace(false);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-700 hover:opacity-90 inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isBn ? 'রিসেট' : 'Reset'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.15)}
              disabled={zoom <= 1}
              className={`${
                isMobileSkin ? 'w-11 h-11' : 'p-1.5'
              } rounded-xl border border-slate-300 dark:border-slate-600 flex items-center justify-center disabled:opacity-40 active:scale-95`}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 h-2 accent-teal-600 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.15)}
              disabled={zoom >= 3}
              className={`${
                isMobileSkin ? 'w-11 h-11' : 'p-1.5'
              } rounded-xl border border-slate-300 dark:border-slate-600 flex items-center justify-center disabled:opacity-40 active:scale-95`}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-red-500 text-center">{errorMsg}</p>
        )}

        {/* Action Buttons: Full-width thumb-friendly stack on Mobile Skin, inline right-aligned on PC Skin */}
        <div
          className={`flex ${
            isMobileSkin ? 'flex-col-reverse gap-2' : 'items-center justify-end gap-2.5'
          } pt-1`}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className={`${
              isMobileSkin ? 'w-full py-3' : 'px-4 py-2.5'
            } rounded-xl text-xs font-bold ${
              darkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'বাতিল করুন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmCropAndCompress}
            disabled={isProcessing}
            className={`${
              isMobileSkin ? 'w-full py-3.5 text-sm' : 'px-5 py-2.5 text-xs'
            } rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold inline-flex items-center justify-center gap-1.5 shadow-md disabled:opacity-60 active:scale-[0.99]`}
          >
            <Check className="w-4 h-4" />
            <span>
              {isProcessing
                ? isBn
                  ? 'ক্রপ ও অপ্টিমাইজ হচ্ছে...'
                  : 'Cropping & Optimizing...'
                : isBn
                ? 'ক্রপ ও ফটো সংরক্ষণ করুন'
                : 'Crop & Save Photo'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoCropModal;
