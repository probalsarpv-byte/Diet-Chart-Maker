import { useState, useEffect } from 'react';

export type DeviceSkinPreference = 'auto' | 'mobile' | 'desktop';
export type EffectiveDeviceSkin = 'mobile' | 'desktop';

export interface DeviceSkinState {
  preference: DeviceSkinPreference;
  effectiveSkin: EffectiveDeviceSkin;
  isMobileSkin: boolean;
  isDesktopSkin: boolean;
  isTouchDevice: boolean;
  viewportWidth: number;
  setPreference: (pref: DeviceSkinPreference) => void;
}

const STORAGE_KEY = 'precision_device_skin_pref_v1';
const EVENT_NAME = 'precision-device-skin-change';

function detectViewportAndTouch(): { width: number; isTouch: boolean; isMobileViewport: boolean } {
  if (typeof window === 'undefined') {
    return { width: 1280, isTouch: false, isMobileViewport: false };
  }
  const width = window.innerWidth || document.documentElement.clientWidth || 1280;
  const isTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const isMobileViewport = width < 768;
  return { width, isTouch, isMobileViewport };
}

export function getStoredSkinPreference(): DeviceSkinPreference {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'mobile' || raw === 'desktop' || raw === 'auto') {
      return raw;
    }
  } catch {
    // Ignore storage errors
  }
  return 'auto';
}

export function setStoredSkinPreference(pref: DeviceSkinPreference): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: pref }));
}

/**
 * React hook that dynamically adapts the application's interface & skin
 * based on the user's device (Mobile vs. PC/Desktop), with support for
 * manual skin switching ('auto' | 'mobile' | 'desktop').
 */
export function useDeviceSkin(): DeviceSkinState {
  const [preference, setPreferenceState] = useState<DeviceSkinPreference>(() =>
    getStoredSkinPreference()
  );
  const [env, setEnv] = useState(() => detectViewportAndTouch());

  useEffect(() => {
    const handleResize = () => {
      setEnv(detectViewportAndTouch());
    };
    const handlePrefChange = () => {
      setPreferenceState(getStoredSkinPreference());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener(EVENT_NAME, handlePrefChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener(EVENT_NAME, handlePrefChange);
    };
  }, []);

  const effectiveSkin: EffectiveDeviceSkin =
    preference === 'mobile'
      ? 'mobile'
      : preference === 'desktop'
      ? 'desktop'
      : env.isMobileViewport
      ? 'mobile'
      : 'desktop';

  // Sync a root data-skin attribute on document.documentElement for global adaptive styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-device-skin', effectiveSkin);
    }
  }, [effectiveSkin]);

  return {
    preference,
    effectiveSkin,
    isMobileSkin: effectiveSkin === 'mobile',
    isDesktopSkin: effectiveSkin === 'desktop',
    isTouchDevice: env.isTouch,
    viewportWidth: env.width,
    setPreference: setStoredSkinPreference,
  };
}

export const useDeviceLayout = useDeviceSkin;

