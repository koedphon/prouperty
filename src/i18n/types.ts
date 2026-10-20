export type Language = 'th' | 'en' | 'zh' | 'ja' | 'hi';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  countryName: string; // The label in Thai as requested: 1 ไทย, 2 อังกฤษ, 3 จีน, 4 ญี่ปุ่น, 5 อินเดีย
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: 'th',
    name: 'ไทย',
    nativeName: 'ไทย',
    countryName: 'ไทย (Thai)',
    flag: '🇹🇭',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    countryName: 'อังกฤษ (English)',
    flag: '🇬🇧',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文 (简体)',
    countryName: 'จีน (Chinese)',
    flag: '🇨🇳',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    countryName: 'ญี่ปุ่น (Japanese)',
    flag: '🇯🇵',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    countryName: 'อินเดีย (Hindi)',
    flag: '🇮🇳',
  },
];
