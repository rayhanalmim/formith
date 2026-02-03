import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, Direction } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const savedLang = localStorage.getItem('tahweel-lang') as Language;
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      return savedLang;
    }
  }
  return 'ar';
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem('tahweel-lang', language);
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export type { Language, Direction };
