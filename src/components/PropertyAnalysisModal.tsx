import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Landmark,
  Scale,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Globe,
  Navigation,
  Sun,
  Wrench,
  Film,
  Play,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';
import { PropertyItem, AIAnalysisResult } from '../types/property';
import { getBenchmarkForProperty, generateNearbyComps } from '../data/thaiLocations';
import { BankLoanComparison } from './BankLoanComparison';
import { ContractorsDirectory } from './ContractorsDirectory';
import { getDriveViewUrl } from '../utils/imageUrl';
import { getGoogleMapsEmbedUrl, getStreetViewEmbedUrl, parseGoogleMapsCoordinates } from '../services/googleMapSync';
import { useLanguage } from '../i18n/LanguageContext';
import { PropertyImage } from './PropertyImage';

interface PropertyAnalysisModalProps {
  property: PropertyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProperty?: (updated: PropertyItem) => void;
  onUploadImage?: (property: PropertyItem, file: File) => Promise<void>;
  onOpenMedia?: (property: PropertyItem) => void;
}

export const PropertyAnalysisModal: React.FC<PropertyAnalysisModalProps> = ({
  property,
  isOpen,
  onClose,
  onUpdateProperty,
  onUploadImage,
  onOpenMedia,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'ai-dossier' | 'contractors' | 'location' | 'mortgage' | 'comps'>('ai-dossier');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to top of content when tab changes
  const handleTabChange = (newTab: 'ai-dossier' | 'mortgage' | 'comps' | 'contractors' | 'location') => {
    setActiveTab(newTab);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Trigger AI Analysis
  const handleRunAiAnalysis = React.useCallback(async (targetProperty: PropertyItem) => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const currentBenchmark = getBenchmarkForProperty(targetProperty);
      const p = targetProperty.price || 0;
      const a = targetProperty.areaSize || 0;
      const sqWa = targetProperty.pricePerSqWa || (a > 0 ? Math.round(p / a) : 0);
      const appraised = targetProperty.appraisedPrice > 0
        ? targetProperty.appraisedPrice
        : Math.round(a * currentBenchmark.landDepartmentAppraisalPerSqWa);

      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            ...targetProperty,
            pricePerSqWa: sqWa,
            appraisedPrice: appraised,
          },
          marketStats: currentBenchmark,
        }),
      });

      const result = await response.json().catch(() => null);
      if (result && result.analysis) {
        setAiAnalysis(result.analysis);
      } else {
        throw new Error(result?.error || t('noAiAnalysisResult', 'ไม่ได้รับผลการวิเคราะห์จาก AI'));
      }
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setAiError(err.message || t('aiProcessingError', 'การประมวลผล AI เกิดข้อผิดพลาดชั่วคราว'));
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Run automatically when property modal opens
  React.useEffect(() => {
    if (isOpen && property) {
      setAiAnalysis(null);
      setAiError(null);
      handleRunAiAnalysis(property);
    }
  }, [isOpen, property?.id, handleRunAiAnalysis]);

  if (!isOpen || !property) return null;

  const benchmark = getBenchmarkForProperty(property);
  const comps = generateNearbyComps(property, benchmark);

  // Financial calculations
  const price = property.price || 0;
  const areaSize = property.areaSize || 0;
  const pricePerSqWa = property.pricePerSqWa || (areaSize > 0 ? Math.round(price / areaSize) : 0);
  
  // Land Department Appraisal comparison
  const calculatedAppraisedPrice = property.appraisedPrice > 0
    ? property.appraisedPrice
    : Math.round(areaSize * benchmark.landDepartmentAppraisalPerSqWa);
  
  const appraisalGapPercent = calculatedAppraisedPrice > 0 && price > 0
    ? Math.round(((price - calculatedAppraisedPrice) / calculatedAppraisedPrice) * 100)
    : 0;

  // Market Price comparison
  const marketAvgPricePerSqWa = benchmark.avgMarketPricePerSqWa;
  const estimatedMarketTotal = Math.round(areaSize * marketAvgPricePerSqWa);
  const marketDiscountPercent = pricePerSqWa > 0 && marketAvgPricePerSqWa > 0
    ? Math.round(((marketAvgPricePerSqWa - pricePerSqWa) / marketAvgPricePerSqWa) * 100)
    : 0;

  // Rental Yield calculation
  const annualRental = (property.rentalPrice || 0) * 12;
  const grossYield = price > 0 && annualRental > 0
    ? ((annualRental / price) * 100).toFixed(1)
    : '5.5';

  const formatNumber = (num: number) => (num ? Number(num).toLocaleString() : '0');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden overscroll-contain">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-5xl w-full h-[96dvh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#EAE3D9] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Mobile Drag Pill */}
        <div className="sm:hidden pt-2.5 pb-1 bg-[#FAF8F5] flex justify-center shrink-0">
          <div className="w-12 h-1 bg-[#D5C9B8] rounded-full" />
        </div>

        {/* Modal Header (Compact & thumb-friendly on mobile) */}
        <div className="bg-[#FAF8F5] px-4 py-2.5 sm:p-7 flex justify-between items-center sm:items-start shrink-0 border-b border-[#EAE3D9]">
          <div className="flex-1 pr-2 sm:pr-4 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-2 text-xs text-[#767067]">
              <span className="font-semibold text-[#C86A39] flex items-center gap-1">
                <Landmark className="w-3.5 h-3.5" />
                {property.propertyType || t('generalProperty', 'อสังหาริมทรัพย์')}
              </span>
              <span>·</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{property.province || t('unspecifiedProvince', 'ไม่ระบุจังหวัด')}</span>
              {property.dateAdded && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#8A847C]" /> {property.dateAdded}
                  </span>
                </>
              )}
            </div>

            <h2 className="font-editorial text-lg sm:text-3xl font-bold tracking-tight text-[#24211D] truncate">
              {property.village ? property.village : `${property.propertyType || t('propertyLabel', 'ทรัพย์สิน')} ${t('locationPrefix', 'ทำเล')} ${property.subDistrict || property.district || ''}`}
            </h2>

            <p className="text-[#767067] text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:flex items-center gap-1.5 flex-wrap">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C86A39] shrink-0" />
              <span className="truncate max-w-full">
                {property.houseNumber ? `${t('houseNumberPrefix', 'บ้านเลขที่')} ${property.houseNumber} ` : ''}
                {property.subDistrict ? `${t('subDistrictPrefix', 'ต.')}${property.subDistrict} ` : ''}
                {property.district ? `${t('districtPrefix', 'อ.')}${property.district} ` : ''}
                {property.province ? `${t('provincePrefix', 'จ.')}${property.province}` : ''}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenMedia && (
              <button
                type="button"
                onClick={() => onOpenMedia(property)}
                className="bg-white hover:bg-[#FAF8F5] border border-[#EAE3D9] hover:border-[#C86A39] text-[#24211D] text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-luxe-sm min-h-[42px] sm:min-h-[38px] cursor-pointer active:scale-95 touch-manipulation"
                title={t('viewAddMediaModalTitle', 'ดูและเพิ่มรูปภาพ/วิดีโอ (สูงสุด 10 ไฟล์ต่อทรัพย์)')}
              >
                <Film className="w-3.5 h-3.5 text-[#C86A39]" />
                <span className="hidden sm:inline">{t('photosAndVideos', 'รูป & วิดีโอ')}</span>
                <span className="text-[10px] font-bold text-[#C86A39] bg-[#F4EFEB] px-1.5 py-0.5 rounded-full border border-[#EAE3D9] leading-none">
                  {property.mediaFiles?.length || (property.image ? 1 : 0)}/10
                </span>
              </button>
            )}

            {(() => {
              const driveUrl = getDriveViewUrl(property.image);
              if (!driveUrl) return null;
              return (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden md:flex bg-white hover:bg-[#F4EFEB] border border-[#EAE3D9] text-[#24211D] text-xs font-semibold px-3 py-1.5 rounded-xl transition-all items-center gap-1.5 shadow-luxe-sm min-h-[38px]"
                  title={t('openInDriveTooltip', 'เปิดดูรูปภาพต้นฉบับใน Google Drive')}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>{t('openInDrive', 'ดูใน Drive')}</span>
                </a>
              );
            })()}

            {property.mapLink && (
              <a
                href={property.mapLink}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex bg-white hover:bg-[#F4EFEB] border border-[#EAE3D9] text-[#24211D] text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl transition-all items-center gap-1 shadow-luxe-sm min-h-[42px] sm:min-h-0"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C86A39]" />
                <span>{t('mapLabel', 'แผนที่')}</span>
                <ExternalLink className="w-3 h-3 text-[#8A847C]" />
              </a>
            )}

            <button
              onClick={onClose}
              className="text-[#767067] hover:text-[#24211D] p-2 rounded-xl bg-white hover:bg-[#F4EFEB] border border-[#EAE3D9] transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 shadow-xs touch-manipulation"
              title={t('closeModal', 'ปิดหน้าต่าง')}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* 1. Mobile Segmented Tab Bar (Ergonomic, Touch-Optimized, Pinned Sticky Top, NEVER DISAPPEARS on scroll) */}
        <div className="sm:hidden bg-[#FAF8F5]/98 backdrop-blur-md border-b border-[#EAE3D9] px-2.5 py-2 shrink-0 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-0.5 px-0.5">
            {/* Tab 1: บทวิเคราะห์ AI */}
            <button
              type="button"
              onClick={() => handleTabChange('ai-dossier')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 text-xs font-bold touch-manipulation select-none ${
                activeTab === 'ai-dossier'
                  ? 'bg-[#C86A39] text-white shadow-md ring-2 ring-[#C86A39]/30'
                  : 'bg-white text-[#4A453E] border border-[#DDD5CA] shadow-2xs hover:bg-[#F4EFEB]'
              }`}
            >
              <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'ai-dossier' ? 'text-white' : 'text-[#C86A39]'}`} />
              <span className="whitespace-nowrap">{t('tabAiDossier', 'บทวิเคราะห์ AI')}</span>
            </button>

            {/* Tab 2: คำนวณสินเชื่อ */}
            <button
              type="button"
              onClick={() => handleTabChange('mortgage')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 text-xs font-bold touch-manipulation select-none ${
                activeTab === 'mortgage'
                  ? 'bg-[#C86A39] text-white shadow-md ring-2 ring-[#C86A39]/30'
                  : 'bg-white text-[#4A453E] border border-[#DDD5CA] shadow-2xs hover:bg-[#F4EFEB]'
              }`}
            >
              <Landmark className={`w-4 h-4 shrink-0 ${activeTab === 'mortgage' ? 'text-white' : 'text-[#C86A39]'}`} />
              <span className="whitespace-nowrap">{t('tabMortgage', 'คำนวณสินเชื่อ')}</span>
            </button>

            {/* Tab 3: ช่าง&ผู้รับเหมา */}
            <button
              type="button"
              onClick={() => handleTabChange('contractors')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 text-xs font-bold touch-manipulation select-none ${
                activeTab === 'contractors'
                  ? 'bg-[#C86A39] text-white shadow-md ring-2 ring-[#C86A39]/30'
                  : 'bg-white text-[#4A453E] border border-[#DDD5CA] shadow-2xs hover:bg-[#F4EFEB]'
              }`}
            >
              <Wrench className={`w-4 h-4 shrink-0 ${activeTab === 'contractors' ? 'text-white' : 'text-[#C86A39]'}`} />
              <span className="whitespace-nowrap">{t('tabLocalContractorsShort', 'ช่าง & ผู้รับเหมา')}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                activeTab === 'contractors'
                  ? 'bg-white text-[#2E7D32]'
                  : 'bg-[#2E7D32] text-white'
              }`}>
                5
              </span>
            </button>

            {/* Tab 4: ทำเล&แผนที่ */}
            <button
              type="button"
              onClick={() => handleTabChange('location')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer min-h-[46px] active:scale-95 text-xs font-bold touch-manipulation select-none ${
                activeTab === 'location'
                  ? 'bg-[#C86A39] text-white shadow-md ring-2 ring-[#C86A39]/30'
                  : 'bg-white text-[#4A453E] border border-[#DDD5CA] shadow-2xs hover:bg-[#F4EFEB]'
              }`}
            >
              <MapPin className={`w-4 h-4 shrink-0 ${activeTab === 'location' ? 'text-white' : 'text-[#C86A39]'}`} />
              <span className="whitespace-nowrap">{t('tabLocationMap', 'ทำเล & แผนที่')}</span>
            </button>
          </div>
        </div>

        {/* 2. Desktop Navigation Tab Bar */}
        <div className="hidden sm:flex bg-[#FAF8F5]/90 border-b border-[#EAE3D9] px-6 items-center gap-2 overflow-x-auto scrollbar-none shrink-0 sticky top-0 z-30">
          <button
            onClick={() => handleTabChange('ai-dossier')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all min-h-[48px] active:scale-95 cursor-pointer touch-manipulation ${
              activeTab === 'ai-dossier'
                ? 'border-[#C86A39] text-[#C86A39] bg-white'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#C86A39]" />
            <span>{t('tabAiDossier', 'บทวิเคราะห์ AI')} (SWOT)</span>
          </button>

          <button
            onClick={() => handleTabChange('mortgage')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all min-h-[48px] active:scale-95 cursor-pointer touch-manipulation ${
              activeTab === 'mortgage'
                ? 'border-[#C86A39] text-[#C86A39] bg-white'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <Landmark className="w-4 h-4 text-[#C86A39]" />
            <span>{t('tabMortgage', 'คำนวณสินเชื่อ 3 ธนาคาร')}</span>
          </button>

          <button
            onClick={() => handleTabChange('contractors')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all min-h-[48px] active:scale-95 cursor-pointer touch-manipulation ${
              activeTab === 'contractors'
                ? 'border-[#C86A39] text-[#C86A39] bg-white'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <Wrench className="w-4 h-4 text-[#C86A39]" />
            <span>{t('tabLocalContractors', 'ช่าง & ผู้รับเหมาในพื้นที่')}</span>
            <span className="bg-[#2E7D32] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {t('navContractorsBadge', '5 บริษัทแนะนำ')}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('location')}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold whitespace-nowrap transition-all min-h-[48px] active:scale-95 cursor-pointer touch-manipulation ${
              activeTab === 'location'
                ? 'border-[#C86A39] text-[#C86A39] bg-white'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <MapPin className="w-4 h-4 text-[#C86A39]" />
            <span>{t('tabLocationMap', 'ทำเล & แผนที่')}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 sm:space-y-6 overscroll-contain">

          {/* Key Financial KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Asking Price */}
            <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#767067] text-xs">
                <span>{t('askingPriceLabel', 'ราคาเสนอขาย')}</span>
                <DollarSign className="w-4 h-4 text-[#C86A39]" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-[#C86A39]">
                  ฿{formatNumber(price)}
                </span>
                <p className="text-xs text-[#24211D] font-semibold mt-1">
                  {t('averagePrefix', 'เฉลี่ย')} ฿{formatNumber(pricePerSqWa)} /{t('sqWaUnit', 'ตร.ว.')}
                </p>
              </div>
              <span className="text-[11px] text-[#767067] mt-1">
                {t('areaSizeLabel', 'พื้นที่:')} {formatNumber(areaSize)} {t('sqWaUnit', 'ตร.ว.')}
              </span>
            </div>

            {/* 2. Land Dept Appraisal */}
            <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#767067] text-xs">
                <span>{t('officialAppraisalGov', 'ราคาประเมินราชการ')}</span>
                <Landmark className="w-4 h-4 text-[#C86A39]" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-[#24211D]">
                  ฿{formatNumber(calculatedAppraisedPrice)}
                </span>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {appraisalGapPercent < 0 ? (
                    <span className="font-bold text-[#2E7D32] flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {t('underAppraisalBy', 'ต่ำกว่าประเมิน')} {Math.abs(appraisalGapPercent)}%
                    </span>
                  ) : appraisalGapPercent > 0 ? (
                    <span className="font-bold text-[#B45309] flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" /> {t('aboveAppraisalBy', 'สูงกว่าประเมิน')} {appraisalGapPercent}%
                    </span>
                  ) : (
                    <span className="text-[#767067]">{t('equalAppraisal', 'เท่ากับราคาประเมิน')}</span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-[#767067] mt-1">
                {t('baseLabel', 'ฐาน')} ฿{formatNumber(benchmark.landDepartmentAppraisalPerSqWa)}/{t('sqWaUnit', 'ตร.ว.')}
              </span>
            </div>

            {/* 3. Market Benchmark */}
            <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#767067] text-xs">
                <span>{t('marketPriceArea', 'ราคาตลาดในพื้นที่')}</span>
                <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-[#24211D]">
                  ฿{formatNumber(estimatedMarketTotal)}
                </span>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {marketDiscountPercent > 0 ? (
                    <span className="font-bold text-[#2E7D32] flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {t('underMarketBy', 'ถูกกว่าตลาด')} {marketDiscountPercent}%
                    </span>
                  ) : (
                    <span className="text-[#767067]">{t('nearMarketPrice', 'ใกล้เคียงราคาตลาด')}</span>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-[#767067] mt-1">
                {t('marketPrefix', 'ตลาด')} ฿{formatNumber(marketAvgPricePerSqWa)}/{t('sqWaUnit', 'ตร.ว.')}
              </span>
            </div>

            {/* 4. Rental Yield */}
            <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#767067] text-xs">
                <span>{t('grossYieldLabel', 'ผลตอบแทน (Yield)')}</span>
                <Percent className="w-4 h-4 text-[#C86A39]" />
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-bold text-[#2E7D32]">
                  {grossYield}% <span className="text-xs font-normal text-[#767067]">/{t('perYearShort', 'ปี')}</span>
                </span>
                <p className="text-xs text-[#24211D] font-semibold mt-1">
                  {property.rentalPrice ? `${t('rentalPrice', 'ค่าเช่า')} ฿${formatNumber(property.rentalPrice)}/${t('bahtPerMonth', 'ด.')}` : t('marketRentalRate', 'ค่าเช่าตามเกณฑ์ตลาด')}
                </p>
              </div>
              <span className="text-[11px] text-[#767067] mt-1">
                {t('expectedCashFlow', 'กระแสเงินสดคาดการณ์')}
              </span>
            </div>
          </div>

          {/* Property Photos & Videos Strip (Up to 10 files) */}
          <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EAE3D9] flex items-center justify-center text-[#C86A39]">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#24211D] flex items-center gap-1.5">
                    <span>{t('propertyMediaSectionTitle', 'รูปภาพ & วิดีโอของทรัพย์')}</span>
                    <span className="text-[#C86A39] text-xs">
                      ({property.mediaFiles?.length || (property.image ? 1 : 0)} / 10 {t('filesCountLabel', 'ไฟล์')})
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#767067]">
                    {t('propertyMediaSyncDesc', 'บันทึกรูปภาพและวิดีโอรีวิวทรัพย์นี้ (สูงสุด 10 ไฟล์ ซิงก์ Google Sheets & Google Drive)')}
                  </p>
                </div>
              </div>

              {onOpenMedia && (
                <button
                  type="button"
                  onClick={() => onOpenMedia(property)}
                  className="btn-terracotta text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer touch-manipulation"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('manageMediaButton', 'จัดการสื่อ / เพิ่มรูป & วิดีโอ')}</span>
                </button>
              )}
            </div>

            {/* Thumbnail carousel */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              {(property.mediaFiles && property.mediaFiles.length > 0
                ? property.mediaFiles
                : property.image
                ? [{ id: 'cov', url: property.image, type: 'image' as const, isCover: true, fileName: t('coverImageDefaultName', 'รูปหน้าปก') }]
                : []
              ).map((m, idx) => (
                <div
                  key={m.id || idx}
                  onClick={() => onOpenMedia && onOpenMedia(property)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black shrink-0 relative border border-[#EAE3D9] hover:border-[#C86A39] cursor-pointer group shadow-2xs transition-all hover:scale-105"
                  title={m.fileName || t('mediaCountLabel', 'ไฟล์สื่อ')}
                >
                  {m.type === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#24211D] text-white">
                      <Play className="w-5 h-5 text-[#C86A39] fill-[#C86A39]" />
                      <span className="text-[8px] font-bold mt-0.5">VDO</span>
                    </div>
                  ) : (
                    <PropertyImage
                      imageUrl={m.url}
                      propertyId={m.isCover ? property.id : undefined}
                      alt={m.fileName || 'Media'}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {m.isCover && (
                    <div className="absolute top-1 left-1 bg-[#C86A39] text-white text-[8px] font-bold px-1 rounded">
                      {t('coverBadge', 'ปก')}
                    </div>
                  )}
                </div>
              ))}

              {/* Add slot placeholder button */}
              {onOpenMedia && (10 - (property.mediaFiles?.length || (property.image ? 1 : 0))) > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenMedia(property)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-[#DDD5CA] hover:border-[#C86A39] bg-white hover:bg-[#F4EFEB] flex flex-col items-center justify-center gap-1 text-[#767067] hover:text-[#C86A39] shrink-0 cursor-pointer transition-all active:scale-95 group"
                  title={t('addMediaPrompt', 'เพิ่มรูปหรือวิดีโอ')}
                >
                  <Plus className="w-4 h-4 text-[#C86A39]" />
                  <span className="text-[9px] font-medium">+ {t('addMediaSlotRemain', 'เพิ่ม')}</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB: Location & Google Maps */}
          {activeTab === 'location' && (() => {
            const coords = parseGoogleMapsCoordinates(property.mapLink || '') || {
              lat: property.latitude || 13.8048,
              lng: property.longitude || 100.4526,
            };
            const mapEmbed = getGoogleMapsEmbedUrl(coords.lat, coords.lng, 'satellite');

            return (
              <div className="space-y-4">
                <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-[#EAE3D9] space-y-4">
                  <div className="flex flex-wrap justify-between items-center border-b border-[#EAE3D9] pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#C86A39]" />
                      <h3 className="font-editorial text-lg font-bold text-[#24211D]">
                        {t('locationGoogleMaps', 'ตำแหน่งที่ตั้ง & แผนที่ดาวเทียม Google Maps')}
                      </h3>
                    </div>
                    {property.mapLink && (
                      <a
                        href={property.mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-terracotta flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-luxe-sm cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t('openInGoogleMaps', 'เปิดใน Google Maps')}</span>
                      </a>
                    )}
                  </div>

                  {/* Google Maps Embed Frame */}
                  <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-[#EAE3D9] shadow-luxe-sm bg-[#EAE3D8]">
                    <iframe
                      src={mapEmbed}
                      className="w-full h-full border-0"
                      loading="lazy"
                      title="Google Maps Location"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs text-[#767067] gap-2 pt-1">
                    <span className="font-mono text-[#24211D] font-medium">
                      {t('coordPrefix', '📍 พิกัด:')} {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                    </span>
                    <span>
                      {property.subDistrict ? `${property.subDistrict} ` : ''}
                      {property.district ? `${property.district} ` : ''}
                      {property.province ? `${property.province}` : ''}
                    </span>
                  </div>
                </div>

                {/* Spatial & Location Specifications */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9]">
                    <span className="text-[11px] text-[#767067] block uppercase">{t('frontageWidthLabel', 'ความกว้างหน้าแปลง')}</span>
                    <span className="text-sm font-bold text-[#24211D] mt-1 block">
                      ~{Math.round(Math.sqrt(areaSize * 4) * 0.9)} {t('meterUnit', 'เมตร')}
                    </span>
                    <span className="text-[10px] text-[#8A847C] mt-0.5 block">{t('frontageRoadNote', 'ติดถนนโครงการ')}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9]">
                    <span className="text-[11px] text-[#767067] block uppercase">{t('depthPlotLabel', 'ความลึกแปลงที่ดิน')}</span>
                    <span className="text-sm font-bold text-[#24211D] mt-1 block">
                      ~{Math.round(Math.sqrt(areaSize * 4) * 1.1)} {t('meterUnit', 'เมตร')}
                    </span>
                    <span className="text-[10px] text-[#8A847C] mt-0.5 block">{t('depthPlotNote', 'สัดส่วนผังทรงสวย')}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9]">
                    <span className="text-[11px] text-[#767067] block uppercase">{t('setbackLegalLabel', 'ระยะร่นตามกฎหมาย')}</span>
                    <span className="text-sm font-bold text-[#C86A39] mt-1 block">
                      {t('setbackLegalValue', 'หน้า 3ม. / ข้าง 2ม.')}
                    </span>
                    <span className="text-[10px] text-[#8A847C] mt-0.5 block">{t('setbackStandardNote', 'ระยะปลอดภัยมาตรฐาน')}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9]">
                    <span className="text-[11px] text-[#767067] block uppercase">{t('farZoningLabel', 'สัดส่วน FAR ผังเมือง')}</span>
                    <span className="text-sm font-bold text-[#2E7D32] mt-1 block">
                      2.0 : 1 (OSR 30%)
                    </span>
                    <span className="text-[10px] text-[#8A847C] mt-0.5 block">{t('farGrowthNote', 'ศักยภาพขยายตัวสูง')}</span>
                  </div>
                </div>

                {/* Nearby Connectivity */}
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-2">
                  <div className="flex items-center gap-2 text-[#2E7D32]">
                    <Navigation className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#24211D]">
                      {t('nearbyTransitHeader', 'จุดเชื่อมต่อสำคัญรอบทำเล (Nearby Transit & POI Context)')}
                    </h4>
                  </div>
                  <ul className="text-xs text-[#767067] space-y-1.5 leading-relaxed pt-1">
                    <li className="flex items-center justify-between">
                      <span>• {t('poiMainRoad', 'ถนนสายหลัก / ทางคู่ขนาน')}</span>
                      <span className="font-semibold text-[#24211D]">~300 {t('meterUnit', 'ม.')}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>• {t('poiTransit', 'สถานีรถไฟฟ้า / จุดต่อขนส่งมวลชน')}</span>
                      <span className="font-semibold text-[#24211D]">~1.8 {t('kmUnit', 'กม.')}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>• {t('poiMall', 'คอมมูนิตี้มอลล์ & ไฮเปอร์มาร์เก็ต')}</span>
                      <span className="font-semibold text-[#24211D]">~1.2 {t('kmUnit', 'กม.')}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>• {t('poiHospital', 'โรงพยาบาลศูนย์การแพทย์')}</span>
                      <span className="font-semibold text-[#24211D]">~3.5 {t('kmUnit', 'กม.')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* TAB 2: AI Investor Dossier & SWOT */}
          {activeTab === 'ai-dossier' && (
            <div className="space-y-6">
              
              <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-[#EAE3D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-5 h-5 text-[#C86A39]" />
                    <h3 className="font-editorial text-lg font-bold text-[#24211D]">
                      {t('aiValuationStrategyHeader', 'การประเมินความคุ้มค่าและกลยุทธ์การลงทุนด้วย AI')}
                    </h3>
                  </div>
                  <p className="text-xs text-[#767067]">
                    {t('aiValuationStrategyDesc', 'ประเมินคะแนนเกรดการลงทุน SWOT เทคนิคต่อรองราคา และกลยุทธ์ทำกำไร (Flipping / Buy & Hold)')}
                  </p>
                </div>

                <button
                  onClick={() => handleRunAiAnalysis(property)}
                  disabled={isAnalyzing}
                  className="btn-terracotta text-xs font-semibold px-4 py-2.5 rounded-xl shadow-luxe-sm flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{t('analyzingState', 'กำลังวิเคราะห์...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{aiAnalysis ? t('reanalyzeAi', 'วิเคราะห์ใหม่อีกครั้ง') : t('startAiAnalysis', 'เริ่มให้ AI วิเคราะห์')}</span>
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{aiError}</span>
                  </div>
                  <button
                    onClick={() => handleRunAiAnalysis(property)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold"
                  >
                    {t('retryLabel', 'ลองใหม่')}
                  </button>
                </div>
              )}

              {/* AI Analysis Result Display */}
              {aiAnalysis && (
                <div className="space-y-6">
                  {/* Score & Verdict Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-6 rounded-3xl border border-[#EAE3D9] shadow-luxe">
                    {/* Score */}
                    <div className="flex items-center gap-4 md:border-r md:border-[#EAE3D9] pr-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#C86A39] text-white flex flex-col items-center justify-center font-bold shadow-luxe-sm">
                        <span className="text-2xl leading-none">{aiAnalysis.investmentScore}</span>
                        <span className="text-[10px] uppercase opacity-90">{t('outOf10Score', 'เต็ม 10')}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#767067]">{t('investmentGradeLabel', 'เกรดการลงทุน:')}</span>
                          <span className="text-xl font-bold text-[#C86A39]">{aiAnalysis.grade}</span>
                        </div>
                        <span className="text-xs text-[#2E7D32] font-semibold">{t('projectedYieldLabel', 'Yield คาดการณ์:')} {aiAnalysis.rentalYield}% {t('perYearShort', '/ปี')}</span>
                      </div>
                    </div>

                    {/* Verdict */}
                    <div className="md:col-span-2 flex flex-col justify-center">
                      <span className="text-[11px] uppercase text-[#C86A39] font-bold tracking-wider mb-1">
                        {t('strategicAdviceSummary', 'ข้อสรุปคำแนะนำเชิงยุทธศาสตร์')}
                      </span>
                      <p className="font-editorial text-base font-bold text-[#24211D] leading-snug">
                        "{aiAnalysis.verdict}"
                      </p>
                      <p className="text-xs text-[#767067] mt-1.5">
                        {aiAnalysis.priceGapAnalysis}
                      </p>
                    </div>
                  </div>

                  {/* SWOT Tactical Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-2">
                      <div className="flex items-center gap-2 text-[#2E7D32] font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('swotStrengths', 'STRENGTHS (จุดแข็งของทรัพย์)')}</span>
                      </div>
                      <ul className="text-xs text-[#24211D] space-y-1.5 list-disc pl-4 font-sans">
                        {aiAnalysis.swot?.strengths?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-2">
                      <div className="flex items-center gap-2 text-[#C86A39] font-bold text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{t('swotWeaknesses', 'WEAKNESSES (จุดอ่อนที่ต้องพิจารณา)')}</span>
                      </div>
                      <ul className="text-xs text-[#24211D] space-y-1.5 list-disc pl-4 font-sans">
                        {aiAnalysis.swot?.weaknesses?.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-2">
                      <div className="flex items-center gap-2 text-[#C86A39] font-bold text-xs">
                        <Lightbulb className="w-4 h-4" />
                        <span>{t('swotOpportunities', 'OPPORTUNITIES (โอกาสสร้างมูลค่าเพิ่ม)')}</span>
                      </div>
                      <ul className="text-xs text-[#24211D] space-y-1.5 list-disc pl-4 font-sans">
                        {aiAnalysis.swot?.opportunities?.map((o, i) => (
                          <li key={i}>{o}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Threats */}
                    <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-2">
                      <div className="flex items-center gap-2 text-[#B45309] font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t('swotThreats', 'THREATS (ความเสี่ยงและปัจจัยภายนอก)')}</span>
                      </div>
                      <ul className="text-xs text-[#24211D] space-y-1.5 list-disc pl-4 font-sans">
                        {aiAnalysis.swot?.threats?.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Negotiation Tactics & Strategy */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EAE3D9] shadow-luxe space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#EAE3D9] pb-3">
                      <div>
                        <span className="text-[11px] text-[#C86A39] font-semibold uppercase">{t('recommendedStrategyLabel', 'กลยุทธ์ที่แนะนำ')}</span>
                        <h4 className="font-editorial text-lg font-bold text-[#24211D]">
                          {aiAnalysis.strategyRecommendation?.bestStrategy}
                        </h4>
                      </div>
                      {aiAnalysis.strategyRecommendation?.targetNegotiationPrice ? (
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] text-[#767067] uppercase">{t('targetNegotiationPriceLabel', 'เป้าหมายราคาต่อรอง')}</span>
                          <span className="text-lg font-bold text-[#2E7D32] block">
                            ฿{formatNumber(aiAnalysis.strategyRecommendation.targetNegotiationPrice)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Tactics List */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#24211D]">
                        {t('negotiationTacticsLabel', 'เทคนิคการเจรจาต่อรอง (Negotiation Tactics):')}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#24211D]">
                        {aiAnalysis.strategyRecommendation?.negotiationTactics?.map((tac, idx) => (
                          <div key={idx} className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE3D9] flex items-start gap-2">
                            <span className="text-[#C86A39] font-bold">{idx + 1}.</span>
                            <span>{tac}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EAE3D9] text-xs text-[#767067] flex flex-wrap justify-between gap-2">
                      <span>{t('holdingPeriodLabel', 'ระยะเวลาถือครองที่เหมาะสม:')} {aiAnalysis.strategyRecommendation?.estimatedHoldingPeriodMonths || 12} {t('monthsUnit', 'เดือน')}</span>
                      <span>{t('renovationBudgetLabel', 'งบประมาณปรับปรุง:')} {aiAnalysis.estimatedRenovationBudget || t('asIsCondition', 'ตามสภาพจริง')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Mortgage & Bank Financing */}
          {activeTab === 'mortgage' && (
            <div className="space-y-4">
              <BankLoanComparison property={property} />
            </div>
          )}

          {/* TAB 4: Comps Matrix */}
          {activeTab === 'comps' && (
            <div className="bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-luxe space-y-4">
              <div className="flex justify-between items-center border-b border-[#EAE3D9] pb-3">
                <h4 className="font-editorial text-base font-bold text-[#24211D]">
                  {t('compareNearbyListingsHeader', 'เปรียบเทียบกับทรัพย์ประกาศขายในทำเลใกล้เคียง')}
                </h4>
                <span className="text-xs text-[#767067]">{t('radius3km', 'รัศมี ~3 กม.')}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#767067] border-b border-[#EAE3D9] text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-3">{t('thCompName', 'ชื่อทรัพย์สินเปรียบเทียบ')}</th>
                      <th className="p-3">{t('thCompLocation', 'ทำเล / ระยะทาง')}</th>
                      <th className="p-3">{t('thCompArea', 'ขนาดที่ดิน')}</th>
                      <th className="p-3 text-right">{t('thCompAskingPrice', 'ราคาเสนอขาย')}</th>
                      <th className="p-3 text-right">{t('thCompPricePerSqWa', 'ราคา/ตร.ว.')}</th>
                      <th className="p-3 text-center">{t('thCompPriceDiff', 'ส่วนต่างกับทรัพย์นี้')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D9]">
                    {comps.map((comp, idx) => {
                      const isMoreExpensive = comp.differencePercent > 0;
                      return (
                        <tr key={`${comp.id || 'comp'}-${idx}`} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="p-3">
                            <p className="font-semibold text-[#24211D]">{comp.title}</p>
                            <span className="text-[11px] text-[#767067]">{comp.features}</span>
                          </td>
                          <td className="p-3 text-[#767067]">
                            {comp.subDistrict} (~{comp.distanceKm} {t('kmUnit', 'กม.')})
                          </td>
                          <td className="p-3 text-[#24211D]">{comp.areaSize} {t('sqWa', 'ตร.ว.')}</td>
                          <td className="p-3 text-right text-[#24211D]">
                            ฿{formatNumber(comp.price)}
                          </td>
                          <td className="p-3 text-right text-[#C86A39] font-bold">
                            ฿{formatNumber(comp.pricePerSqWa)}
                          </td>
                          <td className="p-3 text-center">
                            {isMoreExpensive ? (
                              <span className="text-rose-600 font-semibold">
                                +{comp.differencePercent}%
                              </span>
                            ) : comp.differencePercent < 0 ? (
                              <span className="text-[#2E7D32] font-semibold">
                                {comp.differencePercent}%
                              </span>
                            ) : (
                              <span className="text-[#767067]">{t('samePriceLabel', 'ราคาเท่ากัน')}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Local Quality Contractors (5 Companies) */}
          {activeTab === 'contractors' && (
            <div className="space-y-4">
              <ContractorsDirectory
                initialProvince={property.province || t('bangkokProvince', 'กรุงเทพมหานคร')}
                initialDistrict={property.district || ''}
                propertyTitle={property.village || property.highlights || `${property.propertyType} ${property.district} ${property.province}`}
                propertyType={property.propertyType}
                areaSizeSqWa={property.areaSize}
              />
            </div>
          )}

        </div>

        {/* Modal Footer (Safe-Area Aware on Mobile) */}
        <div className="p-4 sm:p-6 bg-[#FAF8F5] border-t border-[#EAE3D9] flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2 text-xs text-[#767067] text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-[#C86A39] shrink-0" />
            <span>{t('dataSourceLandDept', 'ข้อมูลราคาตลาดและราคาประเมินอ้างอิงจากฐานข้อมูลกรมที่ดิน')}</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] bg-white hover:bg-[#F4EFEB] active:scale-[0.98] text-[#24211D] rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer border border-[#EAE3D9] shadow-xs flex items-center justify-center"
          >
            {t('closeModal', 'ปิดหน้าต่าง')}
          </button>
        </div>

      </div>
    </div>
  );
};
