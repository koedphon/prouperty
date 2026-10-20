import React, { useState } from 'react';
import {
  Camera,
  Sparkles,
  ArrowRight,
  Play,
  Crown,
  Globe,
  TrendingUp,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { PropertyItem } from '../types/property';
import { User } from 'firebase/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { TeamData } from '../types/team';
import { OrbitDeliveryHero } from './ui/orbit-delivery-hero';

interface HomeSectionProps {
  user: User | null;
  team?: TeamData | null;
  onNavigateToScan: () => void;
  onOpenAnalysis: (item: PropertyItem) => void;
  onOpenTeam: () => void;
  demoProperties?: PropertyItem[];
  onShowNotification?: (msg: string, type?: 'success' | 'error') => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({
  user,
  team,
  onNavigateToScan,
  onOpenAnalysis,
  onOpenTeam,
  demoProperties = [],
  onShowNotification,
}) => {
  const { t } = useLanguage();
  const [show3DHero, setShow3DHero] = useState(true);
  const [isTutorialPlaying, setIsTutorialPlaying] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 3D Interactive World Hero (Warm Brown Art Direction) */}
      <div className="relative">
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            onClick={() => setShow3DHero(!show3DHero)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F4EFEB] hover:bg-[#EAE3D9] text-[#78350F] border border-[#EAE3D9] transition-all cursor-pointer shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#C86A39]" />
            <span>{show3DHero ? t('toggle3DCollapse', 'ย่อมุมมอง 3D') : t('toggle3DExpand', 'แสดงโมเดล 3D โลกอสังหาฯ')}</span>
          </button>
        </div>

        {show3DHero ? (
          <div className="animate-in fade-in duration-300">
            <OrbitDeliveryHero
              compact={true}
              showHeader={false}
              showCta={false}
              badge={t('heroBadge', 'AI Vision & Spatial Real Estate')}
              title={<>{t('homeHeroTitleLine1', 'PropInvest AI.')}<br />{t('homeHeroTitleLine2', 'วิเคราะห์อสังหาฯ')}<br /><em>{t('homeHeroTitleLine3', 'ด้วยภาพถ่าย')}</em></>}
              description={t('heroSubtitle', 'สแกนป้ายประกาศอสังหาริมทรัพย์ด้วยปัญญาประดิษฐ์ สกัดพิกัด เบอร์โทร และราคาต่อตารางวา พร้อมสร้างแบบจำลองสถาปัตยกรรม 3 มิติ และคำนวณสินเชื่อธนาคารทันที')}
            />
          </div>
        ) : (
          /* Classic Compact Hero Header */
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-2 sm:pt-4 animate-in fade-in duration-200">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C86A39] block">
              {t('heroBadge', 'AI Vision & Architectural Spatial Underwriting')}
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[#24211D] tracking-tight leading-tight">
              {t('heroTitle', 'Institutional-Grade Property Investment Analysis')}
            </h1>
            <p className="text-sm sm:text-base text-[#767067] max-w-2xl mx-auto leading-relaxed font-sans">
              {t('heroSubtitle', 'สแกนป้ายประกาศอสังหาริมทรัพย์ด้วยปัญญาประดิษฐ์ สกัดพิกัด เบอร์โทร และราคาต่อตารางวา พร้อมสร้างแบบจำลองสถาปัตยกรรม 3 มิติ และคำนวณสินเชื่อธนาคารทันที')}
            </p>
          </div>
        )}
      </div>

      {/* Hero Quick Navigation Banner (ทางลัดเข้าสู่หน้าสแกนป้าย OCR ทันที) */}
      <div className="bg-gradient-to-r from-[#2D221B] via-[#3D2D23] to-[#2D221B] text-white rounded-3xl p-5 sm:p-7 shadow-luxe flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-[#4D3A2E]">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C86A39] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#EAE3D9]">
              {t('homeCtaReady', 'Optical OCR Vision Ready')}
            </span>
          </div>
          <h2 className="font-editorial text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('homeCtaTitle', 'พร้อมสแกนป้ายประกาศอสังหาริมทรัพย์แล้วหรือยัง?')}
          </h2>
          <p className="text-xs sm:text-sm text-[#D4C8B8] leading-relaxed">
            {t('homeCtaDesc', 'เปิดหน้าสแกนป้าย (OCR) เพื่อถ่ายรูปป้ายประกาศ ป้ายไวนิล หรือโฉนดที่ดิน ระบบ AI จะถอดข้อมูลอัตโนมัติพร้อมบันทึกเข้า Google Sheet บัญชีของคุณทันที')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onNavigateToScan}
            className="btn-terracotta text-sm font-bold px-6 py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all flex-1 sm:flex-none"
          >
            <Camera className="w-5 h-5 text-white" />
            <span>{t('homeCtaScanBtn', 'ไปที่หน้า สแกนป้าย (OCR)')}</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={onOpenTeam}
            className="bg-white/10 hover:bg-white/20 text-[#FAF8F5] border border-white/20 text-xs sm:text-sm font-semibold px-4 py-3.5 rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 flex-1 sm:flex-none"
          >
            <Crown className="w-4 h-4 text-[#E6A23C]" />
            <span>{t('homeCtaPlanBtn', 'แพ็กเกจสมาชิก')}</span>
          </button>
        </div>
      </div>

      {/* 3 Steps Workflow & How-To-Use Guide */}
      <div className="bg-[#FAF8F5] rounded-3xl p-5 sm:p-6 border border-[#EAE3D9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE3D9] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C86A39]" />
            <h3 className="font-editorial text-base sm:text-lg font-bold text-[#24211D]">
              {t('howItWorksTitle', '3 ขั้นตอนง่ายๆ ในการใช้งาน (How It Works)')}
            </h3>
          </div>
          <span className="text-xs text-[#767067]">
            {t('howItWorksSub', 'สแกนป้าย วิเคราะห์ความคุ้มค่า และบันทึกข้อมูลใน 30 วินาที')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#EAE3D9] shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5 text-[#C86A39]">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-[#24211D]">{t('step1Title', 'ถ่ายหรืออัปโหลดป้าย')}</span>
            </div>
            <p className="text-xs text-[#767067] leading-relaxed">
              {t('step1Desc', 'ถ่ายภาพป้ายไวนิล เสาไฟฟ้า หรือโฉนดที่ดิน ระบบ AI Multimodal OCR จะอ่านราคา พื้นที่ เบอร์โทร และพิกัดทันที')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE3D9] shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5 text-[#2E7D32]">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-center font-bold text-xs text-[#2E7D32]">
                2
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-[#24211D]">{t('step2Title', 'เทียบราคาประเมิน & Yield')}</span>
            </div>
            <p className="text-xs text-[#767067] leading-relaxed">
              {t('step2Desc', 'เปรียบเทียบกับราคาประเมินทุนทรัพย์ที่ดินกรมที่ดินรอบบัญชีปัจจุบัน 77 จังหวัด และคำนวณอัตราผลตอบแทนค่าเช่าสุทธิ')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EAE3D9] shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5 text-[#C86A39]">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EAE3D9] flex items-center justify-center font-bold text-xs text-[#C86A39]">
                3
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-[#24211D]">{t('step3Title', 'คำนวณสินเชื่อ & บันทึกชีต')}</span>
            </div>
            <p className="text-xs text-[#767067] leading-relaxed">
              {t('step3Desc', 'คำนวณค่างวด 6 ธนาคารพันธมิตร และบันทึกลง Google Sheet พร้อมเก็บภาพถ่ายบน Google Drive บัญชีของคุณเองอัตโนมัติ')}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Demo Properties Showcase (Clickable Instant Preview) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C86A39]" />
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#24211D]">
                {t('demoTitle', 'ตัวอย่างอสังหาริมทรัพย์พร้อมบทวิเคราะห์ AI (Interactive Demos)')}
              </h3>
            </div>
            <p className="text-xs text-[#767067] mt-0.5">
              {t('demoSub', 'คลิกการ์ดด้านล่างเพื่อทดลองเปิดดูบทวิเคราะห์ราคาประเมินกรมที่ดิน, อัตราผลตอบแทน Yield และจำลองสินเชื่อ 6 ธนาคารทันที')}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenTeam}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#C86A39] border border-[#EAE3D9] transition-all cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{t('viewAllPlans', 'ดูแพ็กเกจสมาชิกทั้งหมด')}</span>
          </button>
        </div>

        {/* 3 Clickable Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(demoProperties.length > 0 ? demoProperties : [
            {
              id: 'demo-1',
              propertyType: 'บ้านเดี่ยว',
              country: 'ไทย',
              province: 'นนทบุรี',
              district: 'บางกรวย',
              subDistrict: 'มหาสวัสดิ์',
              village: 'ม.มัณฑนา ราชพฤกษ์',
              houseNumber: '88/142',
              mapLink: 'https://maps.google.com/?q=13.8048,100.4526',
              latitude: 13.8048,
              longitude: 100.4526,
              price: 6500000,
              rentalPrice: 35000,
              appraisedPrice: 7200000,
              areaSize: 72,
              pricePerSqWa: 90278,
              contactNumber: '081-998-7744',
              highlights: 'บ้านเดี่ยว 2 ชั้น หลังมุม สวนกว้าง ใกล้ The Crystal SB ราชพฤกษ์ กู้ได้เกินราคาขาย',
              dateAdded: '27/09/2026',
            },
            {
              id: 'demo-2',
              propertyType: 'ทาวน์โฮม/ทาวน์เฮ้าส์',
              country: 'ไทย',
              province: 'กรุงเทพมหานคร',
              district: 'ประเวศ',
              subDistrict: 'ดอกไม้',
              village: 'โกลเด้น นีโอ บางนา-กิ่งแก้ว',
              houseNumber: '19/55',
              mapLink: 'https://maps.google.com/?q=13.6738,100.6978',
              latitude: 13.6738,
              longitude: 100.6978,
              price: 3800000,
              rentalPrice: 22000,
              appraisedPrice: 4200000,
              areaSize: 36,
              pricePerSqWa: 105556,
              contactNumber: '086-554-1122',
              highlights: 'ทาวน์โฮมสไตล์อังกฤษ 4 ห้องนอน ทำเลเชื่อมต่อเมกาบางนาและสนามบินสุวรรณภูมิ',
              dateAdded: '27/09/2026',
            },
            {
              id: 'demo-3',
              propertyType: 'คอนโดมิเนียม',
              country: 'ไทย',
              province: 'กรุงเทพมหานคร',
              district: 'วัฒนา',
              subDistrict: 'คลองตันเหนือ',
              village: 'The Monument Thong Lo (ทองหล่อ)',
              houseNumber: '99/8',
              mapLink: 'https://maps.google.com/?q=13.7335,100.5828',
              latitude: 13.7335,
              longitude: 100.5828,
              price: 18500000,
              rentalPrice: 75000,
              appraisedPrice: 21000000,
              areaSize: 32,
              pricePerSqWa: 578125,
              contactNumber: '089-771-4433',
              highlights: 'คอนโด Luxury กลางทองหล่อ ผลตอบแทนค่าเช่าสูง วิวมุมสูง 360 องศา ใกล้ BTS ทองหล่อ',
              dateAdded: '28/09/2026',
            },
          ] as PropertyItem[]).slice(0, 3).map((item, idx) => {
            const yieldRate = item.price > 0 && item.rentalPrice ? ((item.rentalPrice * 12) / item.price) * 100 : 0;
            return (
              <div
                key={item.id || idx}
                onClick={() => onOpenAnalysis(item)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE3D9] hover:border-[#C86A39] shadow-luxe-sm hover:shadow-luxe transition-all cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-[#C86A39] bg-[#FAF8F5] px-2.5 py-0.5 rounded-lg border border-[#EAE3D9]">
                      {item.propertyType}
                    </span>
                    <span className="text-[11px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-lg">
                      Yield {yieldRate.toFixed(1)}%
                    </span>
                  </div>

                  <h4 className="font-editorial text-sm sm:text-base font-bold text-[#24211D] group-hover:text-[#C86A39] transition-colors leading-snug line-clamp-1">
                    {item.village || `${item.propertyType} ${item.district}`}
                  </h4>

                  <p className="text-xs text-[#767067] flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#8A847C] shrink-0" />
                    <span>{item.subDistrict}, {item.district}, {item.province}</span>
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#F0EBE3] grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#8A847C] block">{t('askingPriceLabel', 'ราคาเสนอขาย')}</span>
                      <strong className="text-sm text-[#24211D] font-bold">
                        ฿{item.price.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A847C] block">{t('officialAppraisedLabel', 'ราคาประเมินราชการ')}</span>
                      <strong className="text-sm text-[#2E7D32] font-bold">
                        ฿{item.appraisedPrice.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAnalysis(item);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#FAF8F5] group-hover:bg-[#C86A39] text-[#24211D] group-hover:text-white border border-[#EAE3D9] group-hover:border-transparent text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>{t('viewAiAndLoans', 'ดูบทวิเคราะห์ AI & สินเชื่อ 6 ธนาคาร')}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Financial & Valuation Benchmark Console */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE3D9] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C86A39]" />
              <span className="font-editorial text-lg sm:text-xl font-bold text-[#24211D]">
                {t('liveBenchmarkTitle', 'เกณฑ์ราคาประเมิน & สินเชื่อธนาคารสด (Live Benchmark)')}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-0.5 rounded-full self-start sm:self-auto">
              {t('benchmark77Provinces', 'ฐานข้อมูล 77 จังหวัด')}
            </span>
          </div>

          <p className="text-xs text-[#767067] leading-relaxed">
            {t('liveBenchmarkDesc', 'เกณฑ์อ้างอิงดอกเบี้ยสินเชื่อที่อยู่อาศัยและราคาประเมินทุนทรัพย์ที่ดินรอบบัญชีปัจจุบัน สำหรับประเมินความคุ้มค่าก่อนตัดสินใจซื้อหรือต่อรองราคา')}
          </p>

          {/* Bank Loan Rates Benchmark Card */}
          <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#EAE3D9] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#C86A39]">
                <TrendingUp className="w-4 h-4" />
                <h4 className="text-xs font-bold text-[#24211D]">{t('avg3YearFixedRate', 'อัตราดอกเบี้ยเฉลี่ย 3 ปีแรก (พาร์ทเนอร์ 4 ธนาคารหลัก)')}</h4>
              </div>
              <span className="text-[10px] text-[#8A847C]">{t('updatedYear', 'อัปเดต 2026')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white rounded-xl p-2.5 border border-[#EAE3D9]">
                <span className="text-[10px] text-[#767067] block">{t('bankGsb', 'ออมสิน (GSB)')}</span>
                <span className="text-sm font-bold text-[#C86A39] block mt-0.5">2.99%</span>
                <span className="text-[9px] text-[#8A847C]">~4,180 {t('approxPerMillion', 'บ./ล้าน')}</span>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-[#EAE3D9]">
                <span className="text-[10px] text-[#767067] block">{t('bankGhb', 'ธอส. (GHB)')}</span>
                <span className="text-sm font-bold text-[#C86A39] block mt-0.5">3.00%</span>
                <span className="text-[9px] text-[#8A847C]">~4,200 {t('approxPerMillion', 'บ./ล้าน')}</span>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-[#EAE3D9]">
                <span className="text-[10px] text-[#767067] block">{t('bankKtb', 'กรุงไทย (KTB)')}</span>
                <span className="text-sm font-bold text-[#C86A39] block mt-0.5">3.20%</span>
                <span className="text-[9px] text-[#8A847C]">~4,300 {t('approxPerMillion', 'บ./ล้าน')}</span>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-[#EAE3D9]">
                <span className="text-[10px] text-[#767067] block">{t('bankTtb', 'ทีทีบี (ttb)')}</span>
                <span className="text-sm font-bold text-[#C86A39] block mt-0.5">3.25%</span>
                <span className="text-[9px] text-[#8A847C]">~4,350 {t('approxPerMillion', 'บ./ล้าน')}</span>
              </div>
            </div>
          </div>

          {/* Quick Interactive Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                const demoTarget = (demoProperties.length > 0 ? demoProperties[0] : null) || {
                  id: 'demo-1',
                  propertyType: 'บ้านเดี่ยว',
                  country: 'ไทย',
                  province: 'นนทบุรี',
                  district: 'บางกรวย',
                  subDistrict: 'มหาสวัสดิ์',
                  village: 'ม.มัณฑนา ราชพฤกษ์',
                  houseNumber: '88/142',
                  mapLink: 'https://maps.google.com/?q=13.8048,100.4526',
                  latitude: 13.8048,
                  longitude: 100.4526,
                  price: 6500000,
                  rentalPrice: 35000,
                  appraisedPrice: 7200000,
                  areaSize: 72,
                  pricePerSqWa: 90278,
                  contactNumber: '081-998-7744',
                  highlights: 'บ้านเดี่ยว 2 ชั้น หลังมุม สวนกว้าง ใกล้ The Crystal SB ราชพฤกษ์ กู้ได้เกินราคาขาย',
                  dateAdded: '27/09/2026',
                } as PropertyItem;
                onOpenAnalysis(demoTarget);
              }}
              className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#F4EFEB] border border-[#EAE3D9] text-left transition-all cursor-pointer group flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#24211D] group-hover:text-[#C86A39] block">
                  {t('tryAiDemoBtn', '⚡ ลองเปิดบทวิเคราะห์ AI')}
                </span>
                <span className="text-[10px] text-[#767067]">
                  {t('tryAiDemoSub', 'ดูตัวอย่างผลการวิเคราะห์เต็มรูปแบบ')}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#C86A39] transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => setIsTutorialPlaying(!isTutorialPlaying)}
              className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#F4EFEB] border border-[#EAE3D9] text-left transition-all cursor-pointer group flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-[#24211D] group-hover:text-[#C86A39] block">
                  {isTutorialPlaying ? t('collapseVideo', 'ย่อวิดีโอสอน') : t('watchTutorialBtn', '▶ ดูวิดีโอสอนวิธีใช้')}
                </span>
                <span className="text-[10px] text-[#767067]">
                  {t('watchTutorialSub', 'คลิปอธิบายวิธีสแกนป้ายและจัดเก็บ')}
                </span>
              </div>
              <Play className="w-4 h-4 text-[#C86A39] fill-[#C86A39]" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-[#767067] pt-3 border-t border-[#EAE3D9]">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
            {t('enterpriseSecurityText', 'ความปลอดภัยระดับองค์กร จัดเก็บใน Google Drive และ Sheet ส่วนตัวของคุณ')}
          </span>
          <span className="text-[#C86A39] font-semibold">PropStudio 2.5</span>
        </div>
      </div>

      {/* Membership & Registration Promotion Banner */}
      <div className="bg-gradient-to-r from-[#FAF8F5] via-[#FFFDFB] to-[#F5EFEB] rounded-3xl p-4 sm:p-6 border border-[#EAE3D9] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#C86A39] text-white flex items-center justify-center shadow-luxe-sm shrink-0">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-editorial text-base sm:text-lg font-bold text-[#24211D]">
                {t('membershipBannerTitle', 'ระบบการสมัครสมาชิก PropStudio (3 แพ็กเกจตอบโจทย์ทุกระดับ)')}
              </h3>
              <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full border border-[#C8E6C9]">
                {t('startFreeBadge', 'เริ่มต้นฟรี')}
              </span>
            </div>
            <p className="text-xs text-[#767067] mt-1 leading-relaxed max-w-2xl">
              {t('membershipBannerDesc', '• แบบฟรี (Free): 10 เครดิต/เดือน สำหรับทดลองใช้งาน • Standard (150 บ./ด.): 100 เครดิต วิเคราะห์ราคาประเมินและแนบภาพ 10 ไฟล์ • Pro ทีม (299 บ./ด.): 400 เครดิต พร้อมเพิ่มลูกทีมแชร์ Google Sheet กลางได้ไม่จำกัด')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={onOpenTeam}
            className="btn-terracotta text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{user ? t('membershipManageBtn', 'จัดการแพ็กเกจสมาชิก') : t('membershipSubscribeBtn', 'สมัครสมาชิก / ดูแพ็กเกจ')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Tutorial Video Card (YouTube: rZTBIqm2iBI) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EAE3D9] shadow-luxe space-y-4 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#C86A39] text-white flex items-center justify-center shadow-luxe-sm shrink-0">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-editorial text-base sm:text-xl font-bold text-[#24211D]">
                  {t('tutorialVideoCardTitle', 'วิดีโอสอนการใช้งานระบบ (Tutorial Video)')}
                </h3>
                <span className="text-[10px] font-bold text-[#C86A39] bg-[#F4EFEB] px-2 py-0.5 rounded-full border border-[#EAE3D9]">
                  Official Guide
                </span>
              </div>
              <p className="text-xs text-[#767067] mt-0.5 leading-relaxed max-w-2xl">
                {t('tutorialVideoCardDesc', 'แนะนำวิธีใช้งานระบบอย่างละเอียด: ถ่ายภาพป้ายประกาศ, สกัดข้อมูลด้วย AI, บันทึกลง Google Sheet และเพิ่มรูปภาพ/วิดีโอ 10 ไฟล์ต่อทรัพย์')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <a
              href="https://youtu.be/rZTBIqm2iBI"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] border border-[#EAE3D9] text-[#24211D] text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C86A39]" />
              <span>{t('openInYoutube', 'เปิดใน YouTube')}</span>
            </a>

            <button
              type="button"
              onClick={() => setIsTutorialPlaying(!isTutorialPlaying)}
              className="btn-terracotta text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isTutorialPlaying ? t('collapseVideo', 'ย่อวิดีโอ') : t('playTutorialVideo', 'คลิกเพื่อดูวิดีโอสอน')}</span>
            </button>
          </div>
        </div>

        {/* Embedded YouTube Player or Thumbnail Poster */}
        {isTutorialPlaying ? (
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-luxe border border-[#3A3530] animate-in fade-in zoom-in-95 duration-200">
            <iframe
              src="https://www.youtube-nocookie.com/embed/rZTBIqm2iBI?autoplay=1&rel=0"
              title={t('tutorialVideoCardTitle', 'วิดีโอสอนการใช้งาน PropStudio')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div
            onClick={() => setIsTutorialPlaying(true)}
            className="relative w-full h-44 sm:h-64 rounded-2xl overflow-hidden bg-[#24211D] cursor-pointer group border border-[#EAE3D9] flex items-center justify-center shadow-xs"
          >
            <img
              src="https://img.youtube.com/vi/rZTBIqm2iBI/hqdefault.jpg"
              alt="Video Tutorial Thumbnail"
              className="w-full h-full object-cover opacity-75 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

            <div className="relative z-10 flex flex-col items-center gap-2 text-center px-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#C86A39] text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-[#B65B2D] transition-all">
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-white ml-1" />
              </div>
              <span className="text-white text-xs sm:text-sm font-bold bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                {t('playTutorialVideo', '▶ คลิกเพื่อเล่นวิดีโอสอนการใช้งาน (ความยาวประมาณ 2 นาที)')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
