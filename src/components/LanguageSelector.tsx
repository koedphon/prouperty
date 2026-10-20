import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Language } from '../i18n/types';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLangMeta, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white active:scale-95 border border-[#E4DDD2] hover:border-[#C86A39]/60 text-[#24211D] text-xs font-medium transition-all shadow-2xs cursor-pointer min-h-[36px]"
        title={t('languageSelectorTitle')}
      >
        <span className="text-base leading-none shrink-0" role="img" aria-label={currentLangMeta.name}>
          {currentLangMeta.flag}
        </span>
        <span className="font-medium hidden sm:inline text-xs text-[#3E3A34]">
          {currentLangMeta.nativeName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8A847C] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#C86A39]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu with 5 Languages */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-64 rounded-2xl bg-white/98 backdrop-blur-md border border-[#EAE3D9] shadow-luxe-lg py-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-3.5 py-2 border-b border-[#F4EFEB] flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#8A847C] uppercase">
              {t('languageSelectorTitle')}
            </span>
            <span className="text-[10px] text-[#C86A39] font-medium bg-[#FBF7F4] px-2 py-0.5 rounded-full border border-[#EAE3D9]">
              5 Languages
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {supportedLanguages.map((lang, index) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 sm:py-2 text-xs rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-[0.98] ${
                    isSelected
                      ? 'bg-[#FBF7F4] text-[#C86A39] font-semibold border border-[#EAE3D9]'
                      : 'text-[#24211D] hover:bg-[#F4EFEB] active:bg-[#F4EFEB]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl sm:text-lg leading-none shrink-0" role="img" aria-label={lang.name}>
                      {lang.flag}
                    </span>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#8A847C] font-mono">
                          {index + 1}.
                        </span>
                        <span className="font-semibold text-xs sm:text-xs text-[#24211D]">
                          {lang.nativeName}
                        </span>
                      </div>
                      <span className="text-[11px] sm:text-[10px] text-[#8A847C] block">
                        {lang.countryName}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#C86A39] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
