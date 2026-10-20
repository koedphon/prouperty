import React from 'react';
import { X, Play, ExternalLink, Sparkles, CheckCircle2, ShieldCheck, Film, BookOpen } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface TutorialVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialVideoModal: React.FC<TutorialVideoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden overscroll-contain animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full h-[95dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#EAE3D9]"
        role="dialog"
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 bg-[#FAF8F5] flex justify-center shrink-0">
          <div className="w-12 h-1 bg-[#D5C9B8] rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="bg-[#FAF8F5] px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shrink-0 border-b border-[#EAE3D9]">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#C86A39] text-white flex items-center justify-center shadow-xs shrink-0">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </div>
            <div className="truncate">
              <h2 className="font-editorial text-base sm:text-xl font-bold text-[#24211D] truncate flex items-center gap-2">
                <span>{t('tutorialTitle', 'วิดีโอสอนการใช้งานระบบ')}</span>
                <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 bg-[#F4EFEB] text-[#C86A39] rounded-full border border-[#EAE3D9]">
                  Official Guide
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#767067] truncate">
                {t('tutorialModalSub', 'แนะนำขั้นตอนการใช้งานตั้งแต่เริ่มต้น สแกนป้าย บันทึก Google Sheet และเพิ่มรูป/วิดีโอ 10 ไฟล์')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://youtu.be/rZTBIqm2iBI"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4EFEB] border border-[#EAE3D9] text-[#24211D] text-xs font-semibold rounded-xl transition-all shadow-2xs"
              title={t('openInYoutube', 'เปิดดูใน YouTube')}
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C86A39]" />
              <span>{t('openInYoutube', 'เปิดใน YouTube')}</span>
            </a>

            <button
              onClick={onClose}
              className="text-[#767067] hover:text-[#24211D] p-2 rounded-xl bg-white hover:bg-[#F4EFEB] border border-[#EAE3D9] transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 shadow-xs touch-manipulation"
              title={t('closeModal', 'ปิดหน้าต่าง')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          
          {/* 16:9 Responsive YouTube Video Player */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-luxe border border-[#2E2822]">
            <iframe
              src="https://www.youtube-nocookie.com/embed/rZTBIqm2iBI?autoplay=1&rel=0"
              title={t('tutorialTitle', 'วิดีโอสอนการใช้งาน PropStudio')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Quick Mobile YouTube Link Button */}
          <div className="sm:hidden">
            <a
              href="https://youtu.be/rZTBIqm2iBI"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-4 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl text-xs font-bold text-[#24211D] flex items-center justify-center gap-2 active:scale-95 shadow-2xs"
            >
              <ExternalLink className="w-4 h-4 text-[#C86A39]" />
              <span>{t('openFullscreenYoutube', 'เปิดดูแบบเต็มจอในแอป YouTube')}</span>
            </a>
          </div>

          {/* Key Topics & Workflow Highlights */}
          <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-[#24211D] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#C86A39]" />
              <span>{t('tutorialKeyTopicsTitle', 'หัวข้อและขั้นตอนสำคัญในวิดีโอสอนการใช้งาน')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-[#EAE3D9] flex items-start gap-2.5 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#F4EFEB] text-[#C86A39] flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-[#24211D]">{t('tutorialStep1Title', 'การถ่ายภาพและสแกนป้ายประกาศ')}</h4>
                  <p className="text-[11px] text-[#767067] mt-0.5 leading-relaxed">
                    {t('tutorialStep1Desc', 'ใช้กล้องมือถือถ่ายป้ายขายหรืออัปโหลดรูปภาพ AI Vision จะสกัดเบอร์โทร พิกัด และราคาต่อตร.ว. อัตโนมัติ')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#EAE3D9] flex items-start gap-2.5 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#F4EFEB] text-[#C86A39] flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-[#24211D]">{t('tutorialStep2Title', 'บันทึกลง Google Sheet ส่วนตัว')}</h4>
                  <p className="text-[11px] text-[#767067] mt-0.5 leading-relaxed">
                    {t('tutorialStep2Desc', 'เชื่อมต่อ Gmail ด้วย 1 คลิก ข้อมูลทุกรายการจะถูกบันทึกลงในสเปรดชีตและ Google Drive ของคุณโดยตรง')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#EAE3D9] flex items-start gap-2.5 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#F4EFEB] text-[#C86A39] flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-[#24211D]">{t('tutorialStep3Title', 'บันทึกรูปและวิดีโอ 10 ไฟล์ต่อทรัพย์')}</h4>
                  <p className="text-[11px] text-[#767067] mt-0.5 leading-relaxed">
                    {t('tutorialStep3Desc', 'เพิ่มรูปภาพมุมต่างๆ และวิดีโอรีวิวบ้านได้ภายหลัง ซิงก์เก็บใน Google Drive และเปิดดูได้ทุกที่')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-[#EAE3D9] flex items-start gap-2.5 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#F4EFEB] text-[#C86A39] flex items-center justify-center shrink-0 font-bold text-xs">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-[#24211D]">{t('tutorialStep4Title', 'วิเคราะห์ผลตอบแทน & สินเชื่อ 3 ธนาคาร')}</h4>
                  <p className="text-[11px] text-[#767067] mt-0.5 leading-relaxed">
                    {t('tutorialStep4Desc', 'คำนวณอัตราผลตอบแทนค่าเช่า (Yield), ตารางผ่อนสินเชื่อ ธอส., ออมสิน, ttb และรายชื่อผู้รับเหมาในพื้นที่')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Cloud Sync Notice */}
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] flex items-center gap-2.5 text-xs text-[#767067]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
            <span>
              {t('tutorialSecurityNotice', 'ระบบทำงานร่วมกับ Google Sheets API และ Google Drive API เชื่อมต่อบัญชี Gmail ของคุณโดยตรง ข้อมูลทรัพย์สินของคุณจึงปลอดภัยและเป็นส่วนตัว 100%')}
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#EAE3D9] flex justify-between items-center shrink-0">
          <div className="text-xs text-[#767067] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C86A39]" />
            <span className="hidden sm:inline">{t('tutorialVideoModalTitle', 'วิดีโอสอนการใช้งานระบบ PropStudio')}</span>
            <span className="sm:hidden">{t('userManual', 'คู่มือการใช้งาน')}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-terracotta text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs cursor-pointer active:scale-95"
          >
            {t('closeModal', 'เข้าใจแล้ว / ปิดหน้าต่าง')}
          </button>
        </div>

      </div>
    </div>
  );
};
