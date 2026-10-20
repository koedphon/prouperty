import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Language, LanguageInfo, SUPPORTED_LANGUAGES } from './types';
import { TRANSLATIONS } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  currentLangMeta: LanguageInfo;
  supportedLanguages: LanguageInfo[];
}

const STORAGE_KEY = 'propstudio_lang_v1';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language;
      if (saved && ['th', 'en', 'zh', 'ja', 'hi'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore storage access error
    }
    return 'th'; // Default to Thai
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage access error
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const langDict = TRANSLATIONS[language];
      if (langDict && langDict[key] !== undefined) {
        return langDict[key];
      }
      // fallback to English or Thai
      const enDict = TRANSLATIONS.en;
      if (enDict && enDict[key] !== undefined) {
        return enDict[key];
      }
      const thDict = TRANSLATIONS.th;
      if (thDict && thDict[key] !== undefined) {
        return thDict[key];
      }
      return fallback !== undefined ? fallback : key;
    };
  }, [language]);

  const currentLangMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    currentLangMeta,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
