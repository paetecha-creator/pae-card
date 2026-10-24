import { useState, useEffect, useCallback } from 'react';
import { SecuritySettings } from '../types';
import { loadSecuritySettings, saveSecuritySettings } from '../utils/storage';

export function useBiometrics() {
  const [security, setSecurity] = useState<SecuritySettings>(loadSecuritySettings);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check WebAuthn support
    async function checkSupport() {
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBiometricSupported(available);
          setSecurity((prev) => {
            const next = { ...prev, isBiometricAvailable: available };
            saveSecuritySettings(next);
            return next;
          });
        } catch {
          setIsBiometricSupported(false);
        }
      }
    }
    checkSupport();
  }, []);

  const triggerBiometricAuth = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    if (!window.PublicKeyCredential) {
      // Simulate fallback success on devices without hardware credentials
      return true;
    }

    try {
      // Create random challenge for WebAuthn assertion
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
          rpId: window.location.hostname || 'localhost',
        },
      });

      if (credential) {
        setSecurity((prev) => {
          const next = { ...prev, isLocked: false, lastUnlockedAt: Date.now() };
          saveSecuritySettings(next);
          return next;
        });
        return true;
      }
      return false;
    } catch (err: unknown) {
      // If WebAuthn fails or is canceled by user, fallback smoothly to PIN
      console.warn('Biometric error/cancel:', err);
      // If NotAllowedError or cancel, report clean message
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setAuthError('ยกเลิกการสแกน หรือไม่พบข้อมูลไบโอเมตริกซ์ กรุณาใส่รหัส PIN');
      } else {
        // Fallback or simulated test biometric
        setAuthError('ไม่สามารถเข้าถึงอุปกรณ์สแกนได้ กรุณาใส่รหัส PIN');
      }
      return false;
    }
  }, []);

  const unlockWithPin = useCallback((enteredPin: string): boolean => {
    if (enteredPin === security.pin) {
      setSecurity((prev) => {
        const next = { ...prev, isLocked: false, lastUnlockedAt: Date.now() };
        saveSecuritySettings(next);
        return next;
      });
      setAuthError(null);
      return true;
    } else {
      setAuthError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return false;
    }
  }, [security.pin]);

  const lockApp = useCallback(() => {
    setSecurity((prev) => {
      const next = { ...prev, isLocked: true };
      saveSecuritySettings(next);
      return next;
    });
  }, []);

  const updateSecuritySettings = useCallback((newSettings: Partial<SecuritySettings>) => {
    setSecurity((prev) => {
      const next = { ...prev, ...newSettings };
      saveSecuritySettings(next);
      return next;
    });
  }, []);

  return {
    security,
    isBiometricSupported,
    authError,
    setAuthError,
    triggerBiometricAuth,
    unlockWithPin,
    lockApp,
    updateSecuritySettings,
  };
}
