import { useEffect, useState } from 'react';

// Import language files
import vi from '../locales/vi.json';
import en from '../locales/en.json';

const locales = {
  vi,
  en,
};

type LocaleKey = keyof typeof locales;
type TranslationKey = string;

export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = useState<LocaleKey>('vi');

  // Load language preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred-language') as LocaleKey;
      if (savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en')) {
        setCurrentLanguage(savedLanguage);
        document.documentElement.setAttribute('lang', savedLanguage);
      }
    }
  }, []);

  // Listen for language change events
  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      const newLang = event.detail.language as LocaleKey;
      if (newLang === 'vi' || newLang === 'en') {
        setCurrentLanguage(newLang);
        document.documentElement.setAttribute('lang', newLang);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  // Translation function
  const t = (key: TranslationKey): string => {
    const keys = key.split('.');
    let value: any = locales[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Vietnamese if key not found
        value = locales.vi;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key if not found even in fallback
          }
        }
        break;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  // Change language function
  const changeLanguage = (lang: LocaleKey) => {
    if (lang === 'vi' || lang === 'en') {
      setCurrentLanguage(lang);
      localStorage.setItem('preferred-language', lang);
      document.documentElement.setAttribute('lang', lang);
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
  };

  return {
    t,
    currentLanguage,
    changeLanguage,
    isVietnamese: currentLanguage === 'vi',
    isEnglish: currentLanguage === 'en',
  };
}

