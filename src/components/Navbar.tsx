import React from 'react';
import { User } from 'firebase/auth';
import { Home, Compass, FileSpreadsheet, LogOut, Camera, TableProperties, Sparkles, ExternalLink, Wrench, Users, Zap, Crown } from 'lucide-react';
import { UserSpreadsheetMeta } from '../services/googleSheets';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { TeamData } from '../types/team';
import { isUnlimitedVipUser } from '../utils/vip';

interface NavbarProps {
  user: User | null;
  spreadsheetMeta: UserSpreadsheetMeta | null;
  activeTab: 'home' | 'scan' | 'portfolio' | 'market' | 'contractors';
  portfolioCount: number;
  isLoggingIn: boolean;
  onTabChange: (tab: 'home' | 'scan' | 'portfolio' | 'market' | 'contractors') => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenTutorial?: () => void;
  team?: TeamData | null;
  onOpenTeam?: () => void;
  onOpenRevenueCenter?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  spreadsheetMeta,
  activeTab,
  portfolioCount,
  isLoggingIn,
  onTabChange,
  onLogin,
  onLogout,
  onOpenTutorial,
  team,
  onOpenTeam,
  onOpenRevenueCenter,
}) => {
  const { t } = useLanguage();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3D9] transition-all">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 gap-2 sm:gap-3">
            
            {/* Logo & Brand matching InteriorStudio aesthetic */}
            <button
              type="button"
              onClick={() => onTabChange('home')}
              className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-left cursor-pointer group focus:outline-hidden"
              title={t('backToHomeTitle', 'กลับหน้าหลัก (PropStudio)')}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#C86A39] group-hover:bg-[#B55B2C] flex items-center justify-center text-white shadow-2xs transition-all group-hover:scale-105">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              
              <div>
                <span className="font-editorial text-lg sm:text-2xl font-bold text-[#24211D] tracking-tight group-hover:text-[#C86A39] transition-colors leading-none block">
                  {t('brandName', 'PropStudio')}
                </span>
                <span className="text-[10px] text-[#8A847C] font-sans hidden 2xl:inline tracking-wider uppercase mt-0.5">
                  {t('brandTagline', 'Architectural Investment')}
                </span>
              </div>
            </button>

            {/* Desktop Segmented Filter Navigation Bar (ฟิลเตอร์แท็บสไตล์พรีเมียม) */}
            <nav className="hidden md:flex items-center p-1 rounded-2xl bg-[#EDE7DE] border border-[#DFD7CB] shadow-2xs gap-1">
              {/* Filter 0: หน้าหลัก */}
              <button
                type="button"
                onClick={() => onTabChange('home')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeTab === 'home'
                    ? 'bg-white text-[#C86A39] font-bold shadow-xs border border-[#D5CDC1] ring-1 ring-black/5'
                    : 'text-[#656057] hover:text-[#24211D] hover:bg-white/60 font-medium border border-transparent'
                }`}
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{t('navHome', 'หน้าหลัก')}</span>
              </button>

              {/* Filter 1: สแกนป้าย (OCR) */}
              <button
                type="button"
                onClick={() => onTabChange('scan')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeTab === 'scan'
                    ? 'bg-white text-[#C86A39] font-bold shadow-xs border border-[#D5CDC1] ring-1 ring-black/5'
                    : 'text-[#656057] hover:text-[#24211D] hover:bg-white/60 font-medium border border-transparent'
                }`}
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{t('navScan')}</span>
              </button>

              {/* Filter 2: พอร์ตลงทุน */}
              <button
                type="button"
                onClick={() => onTabChange('portfolio')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeTab === 'portfolio'
                    ? 'bg-white text-[#C86A39] font-bold shadow-xs border border-[#D5CDC1] ring-1 ring-black/5'
                    : 'text-[#656057] hover:text-[#24211D] hover:bg-white/60 font-medium border border-transparent'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{t('navPortfolio')}</span>
                {portfolioCount > 0 && (
                  <span
                    className={`ml-0.5 text-[11px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                      activeTab === 'portfolio'
                        ? 'bg-[#F4EFEB] text-[#C86A39]'
                        : 'bg-[#DFD7CB] text-[#5A554D]'
                    }`}
                  >
                    {portfolioCount}
                  </span>
                )}
              </button>

              {/* Filter 3: เกณฑ์ตลาด & สินเชื่อ */}
              <button
                type="button"
                onClick={() => onTabChange('market')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeTab === 'market'
                    ? 'bg-white text-[#C86A39] font-bold shadow-xs border border-[#D5CDC1] ring-1 ring-black/5'
                    : 'text-[#656057] hover:text-[#24211D] hover:bg-white/60 font-medium border border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{t('navMarket')}</span>
              </button>

              {/* Filter 4: ช่าง & ผู้รับเหมา */}
              <button
                type="button"
                onClick={() => onTabChange('contractors')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeTab === 'contractors'
                    ? 'bg-white text-[#C86A39] font-bold shadow-xs border border-[#D5CDC1] ring-1 ring-black/5'
                    : 'text-[#656057] hover:text-[#24211D] hover:bg-white/60 font-medium border border-transparent'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{t('navContractors')}</span>
                <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.2 rounded-full">
                  5
                </span>
              </button>
            </nav>

            {/* User Auth, Language Selector, Tutorial & Membership Widgets */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Owner Revenue & Monetization Center Button (Exclusive for kerdphon.posea@gmail.com) */}
              {isUnlimitedVipUser(user?.email) && onOpenRevenueCenter && (
                <button
                  type="button"
                  onClick={onOpenRevenueCenter}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-[#C86A39] to-amber-600 hover:brightness-105 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 min-h-[36px]"
                  title={t('revenueCenterBtn', 'ศูนย์สร้างรายได้')}
                >
                  <span className="text-sm">💰</span>
                  <span className="hidden md:inline">{t('revenueCenterBtn', 'ศูนย์สร้างรายได้')}</span>
                </button>
              )}

              {/* 5-Language Selector Button */}
              <LanguageSelector />

              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Google Sheet Sync Link */}
                  {spreadsheetMeta && (
                    <a
                      href={spreadsheetMeta.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="hidden 2xl:flex items-center gap-1.5 bg-white hover:bg-[#F4EFEB] border border-[#E2DBD0] text-[#24211D] text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all shadow-2xs"
                      title={t('openSheets')}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>{t('openSheets')}</span>
                      <ExternalLink className="w-3 h-3 text-[#8A847C]" />
                    </a>
                  )}

                  {/* Profile Card */}
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white border border-[#E2DBD0] pl-1 pr-2 sm:pl-1.5 sm:pr-2.5 py-1 rounded-full shadow-2xs">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-6 h-6 sm:w-6 sm:h-6 rounded-full border border-[#E2DBD0] object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#C86A39] text-white flex items-center justify-center font-bold text-[10px]">
                        {user.email ? user.email[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[#24211D] truncate max-w-[90px] sm:max-w-[120px] hidden md:inline">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] shrink-0" title={t('driveConnected')} />
                  </div>

                  {/* Sign out */}
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-[#8A847C] hover:text-[#C86A39] hover:bg-[#F4EFEB] rounded-xl transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title={t('logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Register / Membership Button */}
                  {onOpenTeam && (
                    <button
                      type="button"
                      onClick={onOpenTeam}
                      className="flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-white border border-[#EAE3D9] hover:border-[#C86A39]/60 text-[#24211D] text-xs sm:text-sm font-semibold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 min-h-[36px]"
                      title={t('registerBtn', 'สมัครสมาชิก')}
                    >
                      <Crown className="w-3.5 h-3.5 text-[#C86A39]" />
                      <span>{t('registerBtn', 'สมัครสมาชิก')}</span>
                    </button>
                  )}

                  {/* Google Login Button */}
                  <button
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    className="flex items-center gap-2 bg-[#C86A39] hover:bg-[#B55B2C] text-white text-xs sm:text-sm font-semibold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap min-h-[36px]"
                    title={t('loginBtn', 'เข้าสู่ระบบ')}
                  >
                    {isLoggingIn ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      </div>
                    )}
                    <span>{t('loginBtn', 'เข้าสู่ระบบ')}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Ergonomic Mobile Bottom Navigation Bar (Thumb-Zone Optimized & Safe-Area Aware) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-xl border-t border-[#EAE3D9] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          {/* 0. Home Tab */}
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all cursor-pointer min-h-[58px] active:scale-95 ${
              activeTab === 'home'
                ? 'bg-[#FDF7F3] text-[#C86A39] font-bold shadow-xs border border-[#F4EFEB]'
                : 'text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'home' ? 'bg-[#C86A39] text-white shadow-xs scale-105' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-1 font-medium tracking-tight leading-none truncate max-w-full">
              {t('navHome', 'หน้าหลัก')}
            </span>
          </button>

          {/* 1. Scan OCR Tab */}
          <button
            onClick={() => onTabChange('scan')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all cursor-pointer min-h-[58px] active:scale-95 ${
              activeTab === 'scan'
                ? 'bg-[#FDF7F3] text-[#C86A39] font-bold shadow-xs border border-[#F4EFEB]'
                : 'text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'scan' ? 'bg-[#C86A39] text-white shadow-xs scale-105' : ''}`}>
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-1 font-medium tracking-tight leading-none truncate max-w-full">
              {t('navScan')}
            </span>
          </button>

          {/* 2. Portfolio Tab */}
          <button
            onClick={() => onTabChange('portfolio')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all cursor-pointer min-h-[58px] active:scale-95 relative ${
              activeTab === 'portfolio'
                ? 'bg-[#FDF7F3] text-[#C86A39] font-bold shadow-xs border border-[#F4EFEB]'
                : 'text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all relative ${activeTab === 'portfolio' ? 'bg-[#C86A39] text-white shadow-xs scale-105' : ''}`}>
              <TableProperties className="w-5 h-5" />
              {portfolioCount > 0 && (
                <span className="absolute -top-1 -right-1.5 text-[9px] font-bold text-white bg-[#C86A39] border border-white w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {portfolioCount > 9 ? '9+' : portfolioCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium tracking-tight leading-none truncate max-w-full">
              {t('navPortfolio')}
            </span>
          </button>

          {/* 3. Market Tab */}
          <button
            onClick={() => onTabChange('market')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all cursor-pointer min-h-[58px] active:scale-95 ${
              activeTab === 'market'
                ? 'bg-[#FDF7F3] text-[#C86A39] font-bold shadow-xs border border-[#F4EFEB]'
                : 'text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'market' ? 'bg-[#C86A39] text-white shadow-xs scale-105' : ''}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-1 font-medium tracking-tight leading-none truncate max-w-full">
              {t('navMarket')}
            </span>
          </button>

          {/* 4. Contractors Tab */}
          <button
            onClick={() => onTabChange('contractors')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all cursor-pointer min-h-[58px] active:scale-95 relative ${
              activeTab === 'contractors'
                ? 'bg-[#FDF7F3] text-[#C86A39] font-bold shadow-xs border border-[#F4EFEB]'
                : 'text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all relative ${activeTab === 'contractors' ? 'bg-[#C86A39] text-white shadow-xs scale-105' : ''}`}>
              <Wrench className="w-5 h-5" />
              <span className="absolute -top-1 -right-2 text-[8px] font-bold text-white bg-[#2E7D32] px-1 py-0.2 rounded-full border border-white leading-none">
                5
              </span>
            </div>
            <span className="text-[10px] mt-1 font-medium tracking-tight leading-none truncate max-w-full">
              {t('navContractors')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

