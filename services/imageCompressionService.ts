/**
 * Smart Free-Tier Image Compression Service ($0 Storage Optimization)
 *
 * Allows Doctors & Nutritionists to upload photos of ANY original size or resolution
 * (e.g., 5MB–15MB DSLR/smartphone portraits) and automatically optimizes them
 * using multi-step progressive canvas downscaling + adaptive WebP/JPEG encoding.
 *
 * Result: Crisp HD portrait clarity at ~12 KB – 25 KB per photo so it fits
 * effortlessly within Firestore Spark Free Tier (1 GiB / 1 MB doc limit) and
 * zero-cost in-memory / local caches without requiring paid Cloud Storage buckets.
 */

export interface CompressedPhotoResult {
  dataUrl: string;
  originalBytes: number;
  compressedBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  format: 'webp' | 'jpeg';
}

export interface SourceCropRegion {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface CompressPhotoOptions {
  /** Target square/max dimension in pixels (default: 320px for crisp Retina 160x160 avatars) */
  maxDimension?: number;
  /** Target maximum payload size in bytes (default: 24,576 bytes = 24 KB) */
  targetMaxBytes?: number;
  /** Whether to smart-crop to a centered portrait square (default: true) */
  squareCrop?: boolean;
  /** Explicit source crop coordinates from the interactive circular crop overlay */
  cropRegion?: SourceCropRegion;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(',');
  if (base64Index === -1) return dataUrl.length;
  const base64Length = dataUrl.length - (base64Index + 1);
  return Math.ceil((base64Length * 3) / 4);
}

export function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export interface DetectedFaceBox {
  /** Top-left X in natural image pixels */
  x: number;
  /** Top-left Y in natural image pixels */
  y: number;
  /** Face width in natural image pixels */
  width: number;
  /** Face height in natural image pixels */
  height: number;
  /** Face center X in natural image pixels */
  centerX: number;
  /** Face center Y in natural image pixels */
  centerY: number;
  /** Confidence score (0..1) */
  confidence: number;
  /** Detection method used */
  method: 'native_api' | 'vision_skin_cluster';
}

/**
 * Loads an image File or Blob into an HTMLImageElement.
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ছবিটি লোড করা যায়নি। অনুগ্রহ করে একটি বৈধ ইমেজ ফাইল (JPG, PNG, WebP) নির্বাচন করুন।'));
    };
    img.src = objectUrl;
  });
}

/**
 * Detects the primary human face in an uploaded portrait photo so the circular
 * crop overlay can automatically center on the subject's face before manual adjustment.
 *
 * Strategy:
 * 1. Uses the browser's hardware-accelerated Shape Detection `FaceDetector` API when available.
 * 2. Falls back to a fast 96x96 canvas YCbCr skin-tone chrominance + horizontal eye/brow
 *    edge-contrast cluster detector that works across all browsers with zero external cost.
 */
export async function detectPrimaryFaceRegion(
  img: HTMLImageElement
): Promise<DetectedFaceBox | null> {
  const natW = img.naturalWidth || img.width || 600;
  const natH = img.naturalHeight || img.height || 600;
  if (natW < 16 || natH < 16) return null;

  // 1. Try Native Browser FaceDetector API (Chromium / Android / Edge)
  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      const detector = new (window as any).FaceDetector({
        fastMode: true,
        maxDetectedFaces: 3,
      });
      const faces = await detector.detect(img);
      if (Array.isArray(faces) && faces.length > 0) {
        // Pick the largest detected face
        const primary = faces
          .map((f: any) => f.boundingBox as DOMRectReadOnly)
          .sort((a: DOMRectReadOnly, b: DOMRectReadOnly) => b.width * b.height - a.width * a.height)[0];

        if (primary && primary.width > 0 && primary.height > 0) {
          return {
            x: primary.x,
            y: primary.y,
            width: primary.width,
            height: primary.height,
            centerX: primary.x + primary.width / 2,
            centerY: primary.y + primary.height / 2,
            confidence: 0.96,
            method: 'native_api',
          };
        }
      }
    } catch {
      // Fall through to universal canvas vision detector
    }
  }

  // 2. Universal Canvas YCbCr Skin-Tone + Facial Contrast Detector
  try {
    const gridW = 96;
    const gridH = 96;
    const canvas = document.createElement('canvas');
    canvas.width = gridW;
    canvas.height = gridH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, gridW, gridH);
    const { data } = ctx.getImageData(0, 0, gridW, gridH);

    const weights = new Float32Array(gridW * gridH);
    let totalWeight = 0;
    let skinPixelCount = 0;

    for (let y = 1; y < gridH - 1; y++) {
      // Portrait prior: faces in profile photos typically sit in the upper-middle 12%..78% vertically
      const normY = y / gridH;
      const verticalPrior =
        normY >= 0.1 && normY <= 0.78
          ? Math.exp(-Math.pow((normY - 0.38) / 0.28, 2))
          : 0.15;

      for (let x = 1; x < gridW - 1; x++) {
        const normX = x / gridW;
        const horizontalPrior = Math.exp(-Math.pow((normX - 0.5) / 0.36, 2));

        const idx = (y * gridW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 80) continue;

        // ITU-R BT.601 YCbCr conversion for human skin chrominance across diverse skin tones
        const yLum = 0.299 * r + 0.587 * g + 0.114 * b;
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        const isSkinChrominance =
          yLum > 35 &&
          yLum < 242 &&
          cb >= 75 &&
          cb <= 132 &&
          cr >= 130 &&
          cr <= 178 &&
          r > g * 0.92 &&
          r > b * 1.05;

        if (!isSkinChrominance) continue;

        // Measure local vertical luminance gradient (horizontal features like eyes, brows, mouth)
        const idxAbove = ((y - 1) * gridW + x) * 4;
        const idxBelow = ((y + 1) * gridW + x) * 4;
        const lumAbove = 0.299 * data[idxAbove] + 0.587 * data[idxAbove + 1] + 0.114 * data[idxAbove + 2];
        const lumBelow = 0.299 * data[idxBelow] + 0.587 * data[idxBelow + 1] + 0.114 * data[idxBelow + 2];
        const horizontalFeatureContrast = Math.min(1, Math.abs(lumAbove - lumBelow) / 48);

        // Chroma closeness to core human skin cluster center (Cb ~ 105, Cr ~ 150)
        const chromaDist = Math.hypot((cb - 105) / 26, (cr - 150) / 24);
        const skinScore = Math.max(0.15, 1 - chromaDist * 0.65);

        const w = skinScore * (1 + horizontalFeatureContrast * 1.35) * verticalPrior * horizontalPrior;
        weights[y * gridW + x] = w;
        totalWeight += w;
        skinPixelCount++;
      }
    }

    // Require a meaningful cluster of skin/facial pixels
    if (skinPixelCount < 28 || totalWeight <= 0.5) {
      return null;
    }

    // Compute weighted centroid (cx, cy) on the 96x96 grid
    let sumX = 0;
    let sumY = 0;
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const w = weights[y * gridW + x];
        if (w > 0) {
          sumX += x * w;
          sumY += y * w;
        }
      }
    }
    const meanX = sumX / totalWeight;
    const meanY = sumY / totalWeight;

    // Second pass: refine centroid within a local window around (meanX, meanY) to reject hands/neck
    const searchRadius = gridW * 0.34;
    let localWeight = 0;
    let localX = 0;
    let localY = 0;
    let varX = 0;
    let varY = 0;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const w = weights[y * gridW + x];
        if (w <= 0) continue;
        const dist = Math.hypot(x - meanX, y - meanY);
        if (dist <= searchRadius) {
          localWeight += w;
          localX += x * w;
          localY += y * w;
        }
      }
    }

    const finalGridX = localWeight > 0 ? localX / localWeight : meanX;
    const finalGridY = localWeight > 0 ? localY / localWeight : meanY;

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const w = weights[y * gridW + x];
        if (w <= 0) continue;
        const dist = Math.hypot(x - finalGridX, y - finalGridY);
        if (dist <= searchRadius) {
          varX += w * (x - finalGridX) * (x - finalGridX);
          varY += w * (y - finalGridY) * (y - finalGridY);
        }
      }
    }

    const denom = Math.max(localWeight, totalWeight);
    const stdX = Math.max(gridW * 0.09, Math.min(gridW * 0.28, Math.sqrt(varX / denom)));
    const stdY = Math.max(gridH * 0.11, Math.min(gridH * 0.32, Math.sqrt(varY / denom)));

    // Map grid coordinates back to natural image pixels
    const centerX = (finalGridX / gridW) * natW;
    // Slight upward shift toward eye-bridge level so neck warmth doesn't pull the face center down
    const centerY = Math.max(natH * 0.14, ((finalGridY - stdY * 0.12) / gridH) * natH);
    const faceW = Math.min(natW * 0.85, (stdX * 3.1 / gridW) * natW);
    const faceH = Math.min(natH * 0.85, (stdY * 3.3 / gridH) * natH);

    const x = Math.max(0, centerX - faceW / 2);
    const y = Math.max(0, centerY - faceH / 2);

    return {
      x,
      y,
      width: faceW,
      height: faceH,
      centerX,
      centerY,
      confidence: Math.min(0.92, Math.max(0.55, skinPixelCount / (gridW * gridH * 0.22))),
      method: 'vision_skin_cluster',
    };
  } catch {
    return null;
  }
}

/**
 * Multi-step progressive downscaling preserves facial sharpness and avoids
 * jagged aliasing artifacts when shrinking large 4000px+ camera photos down to avatar size.
 */
function renderHighClarityCanvas(
  img: HTMLImageElement,
  targetSize: number,
  squareCrop: boolean,
  cropRegion?: SourceCropRegion
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const srcW = img.naturalWidth || img.width || 600;
  const srcH = img.naturalHeight || img.height || 600;

  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;

  if (cropRegion && cropRegion.sw > 0 && cropRegion.sh > 0) {
    sw = Math.min(srcW, Math.max(16, Math.round(cropRegion.sw)));
    sh = Math.min(srcH, Math.max(16, Math.round(cropRegion.sh)));
    sx = Math.min(Math.max(0, Math.round(cropRegion.sx)), Math.max(0, srcW - sw));
    sy = Math.min(Math.max(0, Math.round(cropRegion.sy)), Math.max(0, srcH - sh));
  } else if (squareCrop) {
    const minSide = Math.min(srcW, srcH);
    sx = Math.floor((srcW - minSide) / 2);
    // Slightly bias vertical crop toward the upper-center (portraits/headshots)
    sy = Math.floor((srcH - minSide) * 0.35);
    sw = minSide;
    sh = minSide;
  }

  const aspect = sw / sh;
  const finalW = aspect >= 1 ? targetSize : Math.round(targetSize * aspect);
  const finalH = aspect >= 1 ? Math.round(targetSize / aspect) : targetSize;

  // Step-down halving for ultra-high-resolution photos (> 2x targetSize)
  let curCanvas = document.createElement('canvas');
  let curW = sw;
  let curH = sh;

  // First draw the cropped region at at most 2x final size or initial size
  const initialMax = Math.max(finalW * 2, Math.min(Math.max(sw, sh), 1280));
  if (Math.max(sw, sh) > initialMax) {
    const scale = initialMax / Math.max(sw, sh);
    curW = Math.max(finalW, Math.round(sw * scale));
    curH = Math.max(finalH, Math.round(sh * scale));
  }

  curCanvas.width = curW;
  curCanvas.height = curH;
  const curCtx = curCanvas.getContext('2d');
  if (curCtx) {
    curCtx.imageSmoothingEnabled = true;
    curCtx.imageSmoothingQuality = 'high';
    curCtx.drawImage(img, sx, sy, sw, sh, 0, 0, curW, curH);
  }

  // Progressively halve until close to final dimensions
  while (curW * 0.5 > finalW && curH * 0.5 > finalH) {
    const nextW = Math.max(finalW, Math.floor(curW * 0.5));
    const nextH = Math.max(finalH, Math.floor(curH * 0.5));
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext('2d');
    if (stepCtx) {
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, nextW, nextH);
    }
    curCanvas = stepCanvas;
    curW = nextW;
    curH = nextH;
  }

  // Final pass to exact target dimensions with subtle contrast/clarity preservation
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = finalW;
  finalCanvas.height = finalH;
  const finalCtx = finalCanvas.getContext('2d');
  if (finalCtx) {
    // Fill white background in case of transparent PNGs
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalW, finalH);
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(curCanvas, 0, 0, curW, curH, 0, 0, finalW, finalH);
  }

  return { canvas: finalCanvas, width: finalW, height: finalH };
}

/**
 * Compresses any uploaded image file into a crisp, lightweight WebP (or JPEG fallback)
 * data URL suitable for $0 Free-Tier database persistence.
 */
export async function compressProfilePhotoForFreeTier(
  file: File,
  options: CompressPhotoOptions = {}
): Promise<CompressedPhotoResult> {
  const maxDimension = options.maxDimension ?? 320;
  const targetMaxBytes = options.targetMaxBytes ?? 24 * 1024; // ~24 KB target
  const squareCrop = options.squareCrop ?? true;
  const cropRegion = options.cropRegion;

  const originalBytes = file.size || 0;
  const img = await loadImageFromFile(file);

  // Try progressive dimension & quality steps until under targetMaxBytes while keeping high visual clarity
  const dimensionCandidates = [maxDimension, Math.round(maxDimension * 0.85), 240];
  const qualityCandidates = [0.86, 0.8, 0.74, 0.68];

  let bestDataUrl = '';
  let bestBytes = Infinity;
  let bestW = maxDimension;
  let bestH = maxDimension;
  let bestFormat: 'webp' | 'jpeg' = 'webp';

  for (const dim of dimensionCandidates) {
    const { canvas, width, height } = renderHighClarityCanvas(img, dim, squareCrop, cropRegion);

    for (const q of qualityCandidates) {
      // Prefer WebP for superior sharpness-to-byte ratio
      let candidateUrl = canvas.toDataURL('image/webp', q);
      let format: 'webp' | 'jpeg' = 'webp';

      // Fallback to JPEG if browser doesn't support WebP encoding (returns image/png)
      if (!candidateUrl.startsWith('data:image/webp')) {
        candidateUrl = canvas.toDataURL('image/jpeg', q);
        format = 'jpeg';
      }

      const bytes = estimateDataUrlBytes(candidateUrl);
      if (bytes < bestBytes) {
        bestDataUrl = candidateUrl;
        bestBytes = bytes;
        bestW = width;
        bestH = height;
        bestFormat = format;
      }

      if (bytes <= targetMaxBytes) {
        const savingsPercent =
          originalBytes > bytes
            ? Math.min(99.9, Number((((originalBytes - bytes) / originalBytes) * 100).toFixed(1)))
            : 0;
        return {
          dataUrl: candidateUrl,
          originalBytes,
          compressedBytes: bytes,
          savingsPercent,
          width,
          height,
          format,
        };
      }
    }
  }

  const savingsPercent =
    originalBytes > bestBytes
      ? Math.min(99.9, Number((((originalBytes - bestBytes) / originalBytes) * 100).toFixed(1)))
      : 0;

  return {
    dataUrl: bestDataUrl,
    originalBytes,
    compressedBytes: bestBytes,
    savingsPercent,
    width: bestW,
    height: bestH,
    format: bestFormat,
  };
}
