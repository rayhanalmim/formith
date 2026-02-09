import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface TranslationState {
  translatedText: string | null;
  isTranslating: boolean;
  isTranslated: boolean;
  detectedLang: string | null;
  targetLang: string | null;
  error: string | null;
}

/**
 * Hook for translating text between Arabic and English.
 * Caches translations per content to avoid duplicate API calls.
 */
export function useTranslation() {
  const [translations, setTranslations] = useState<Record<string, TranslationState>>({});

  const translate = useCallback(async (id: string, text: string, targetLang?: 'en' | 'ar') => {
    // If already translated, toggle back to original
    if (translations[id]?.isTranslated) {
      setTranslations(prev => ({
        ...prev,
        [id]: { ...prev[id], isTranslated: false },
      }));
      return;
    }

    // If we already have a cached translation, show it
    if (translations[id]?.translatedText) {
      setTranslations(prev => ({
        ...prev,
        [id]: { ...prev[id], isTranslated: true },
      }));
      return;
    }

    // Fetch new translation
    setTranslations(prev => ({
      ...prev,
      [id]: {
        translatedText: null,
        isTranslating: true,
        isTranslated: false,
        detectedLang: null,
        targetLang: null,
        error: null,
      },
    }));

    try {
      const response = await api.translateText(text, targetLang);
      if (response.success && response.data) {
        setTranslations(prev => ({
          ...prev,
          [id]: {
            translatedText: response.data!.translatedText,
            isTranslating: false,
            isTranslated: true,
            detectedLang: response.data!.detectedLang,
            targetLang: response.data!.targetLang,
            error: null,
          },
        }));
      } else {
        throw new Error('Translation failed');
      }
    } catch (error: any) {
      setTranslations(prev => ({
        ...prev,
        [id]: {
          translatedText: null,
          isTranslating: false,
          isTranslated: false,
          detectedLang: null,
          targetLang: null,
          error: error.message || 'Translation failed',
        },
      }));
    }
  }, [translations]);

  const getTranslation = useCallback((id: string): TranslationState => {
    return translations[id] || {
      translatedText: null,
      isTranslating: false,
      isTranslated: false,
      detectedLang: null,
      targetLang: null,
      error: null,
    };
  }, [translations]);

  return { translate, getTranslation };
}
