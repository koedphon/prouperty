import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Landmark,
  Scale,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  ShieldCheck,
  RefreshCw,
  Activity,
  CheckCircle2,
  Clock,
  Search,
  Percent,
  Layers,
  HelpCircle,
  Building,
  Info,
} from 'lucide-react';
import { DEFAULT_PROVINCE_BENCHMARKS } from '../data/thaiLocations';
import { fetchLiveMarketData, LiveMarketData, LiveBankPackage } from '../services/marketDataLive';
import { useLanguage } from '../i18n/LanguageContext';

const POPULAR_PROVINCES = [
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'ชลบุรี',
  'ระยอง',
  'เชียงใหม่',
  'ภูเก็ต',
  'ขอนแก่น',
  'นครราชสีมา',
  'สงขลา',
  'สุราษฎร์ธานี',
];

export const MarketBenchmarkView: React.FC = () => {
  const { t } = useLanguage();
  const [selectedProvince, setSelectedProvince] = useState<string>('กรุงเทพมหานคร');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdatingLive, setIsUpdatingLive] = useState(false);
  const [liveData, setLiveData] = useState<LiveMarketData | null>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'mortgage' | 'bot_ltv' | 'mrr_table'>('market');
  const [autoSyncTimer, setAutoSyncTimer] = useState<number>(300); // 5 min countdown

  const provinceEntries = Object.entries(DEFAULT_PROVINCE_BENCHMARKS);
  
  // All searchable provinces
  const allProvinces = Array.from(
    new Set([
      ...POPULAR_PROVINCES,
      ...provinceEntries.map(([name]) => name),
    ])
  );

  const filteredProvinces = allProvinces.filter((p) =>
    p.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const fallbackBenchmark = DEFAULT_PROVINCE_BENCHMARKS[selectedProvince] || provinceEntries[0][1];

  // Load live automated data for the selected province
  const loadLiveData = useCallback(async (province: string, force: boolean = false) => {
    setIsUpdatingLive(true);
    try {
      const data = await fetchLiveMarketData(province, force);
      setLiveData(data);
      setAutoSyncTimer(300);
    } catch (err) {
      console.warn('Live market load note:', err);
    } finally {
      setIsUpdatingLive(false);
    }
  }, []);

  // Automatically fetch live data when province changes
  useEffect(() => {
    loadLiveData(selectedProvince, false);
  }, [selectedProvince, loadLiveData]);

  // Periodic background auto-sync check every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoSyncTimer((prev) => {
        if (prev <= 1) {
          loadLiveData(selectedProvince, false);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedProvince, loadLiveData]);

  const formatNumber = (num?: number) => (num ? Number(num).toLocaleString() : '0');

  // Dynamic values favoring live automated data
  const marketPrice = liveData?.avgMarketPricePerSqWa || fallbackBenchmark.avgMarketPricePerSqWa || 45000;
  const appraisalPrice = liveData?.landDepartmentAppraisalPerSqWa || fallbackBenchmark.landDepartmentAppraisalPerSqWa || 32000;
  const targetInvestorPrice = Math.round(marketPrice * 0.82);
  const growthTrend = liveData?.growthTrend || fallbackBenchmark.growthTrend || t('benchmarkGrowthTrend', 'การเติบโตของโครงข่ายคมนาคมและศูนย์กลางเศรษฐกิจ');
  const populationDensity = liveData?.populationDensity || fallbackBenchmark.populationDensity || t('benchmarkDensityMedium', 'หนาแน่นปานกลาง');
  const targetDemographic = liveData?.targetDemographic || fallbackBenchmark.targetDemographic || t('benchmarkDemographic', 'คนทำงาน ครอบครัว และนักลงทุน');
  const households = liveData?.households || fallbackBenchmark.households || 350000;
  const dominantPropertyType = liveData?.dominantPropertyType || fallbackBenchmark.dominantPropertyType || t('benchmarkDominantType', 'บ้านเดี่ยว / ทาวน์โฮม');
  const lastUpdated = liveData?.lastUpdated || new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const botPolicyRate = liveData?.botPolicyRate || 2.25;

  const displayBanks = liveData?.allBanks && liveData.allBanks.length > 0 ? liveData.allBanks : (liveData?.topBanks || []);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Live Auto-Update Status Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE3D9] shadow-luxe flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#E8F5E9] text-[#2E7D32] px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#C8E6C9] shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D32] animate-ping" />
            <span>{t('autoSyncBadge', 'อัปเดตข้อมูลอัตโนมัติ')} (Live Auto-Sync Active)</span>
          </div>

          <div className="text-xs text-[#767067] flex items-center gap-1.5 font-sans">
            <Clock className="w-3.5 h-3.5 text-[#C86A39]" />
            <span>{t('lastSyncLabel', 'ข้อมูลล่าสุด')}: <strong className="text-[#24211D]">{lastUpdated}</strong></span>
          </div>

          <span className="text-[#D5C9B8] hidden lg:inline">|</span>

          <div className="text-xs text-[#767067] flex items-center gap-1.5 font-sans">
            <Activity className="w-3.5 h-3.5 text-[#C86A39]" />
            <span>{t('mrrReference', 'ดอกเบี้ยนโยบาย')}: <strong className="text-[#24211D] font-mono">{botPolicyRate}% {t('perYear', 'ต่อปี')}</strong></span>
          </div>
        </div>

        <button
          onClick={() => loadLiveData(selectedProvince, true)}
          disabled={isUpdatingLive}
          className="btn-terracotta text-xs font-semibold px-4 py-2 rounded-xl shadow-luxe-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingLive ? 'animate-spin' : ''}`} />
          <span>{isUpdatingLive ? t('submitting', 'กำลังซิงก์ข้อมูล...') : t('refreshNow', 'รีเฟรชข้อมูล')}</span>
        </button>
      </div>

      {/* Header Console & Province Selector */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C86A39] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C86A39]" />
              <span>Macro Real Estate Intelligence & Bank Mortgage Engine</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#24211D] tracking-tight">
              {t('marketTitle', 'เกณฑ์ราคาตลาด & สินเชื่อธนาคาร')}
            </h1>
            <p className="text-xs sm:text-sm text-[#767067] mt-1.5 leading-relaxed font-sans">
              {t('marketSubtitle', 'ข้อมูลเปรียบเทียบอัตราดอกเบี้ย MRR/MLR ล่าสุด 6 ธนาคารชั้นนำ และเกณฑ์ราคาต่อ ตร.ว. แต่ละทำเล')}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#8A847C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPlaceholder', 'ค้นหาชื่อจังหวัดในไทย...')}
              className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl pl-9 pr-8 py-2.5 sm:py-2 text-base sm:text-sm focus:outline-none focus:border-[#C86A39] text-[#24211D] placeholder:text-[#A8A196] min-h-[46px] sm:min-h-0"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A847C] hover:text-[#24211D] p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Province Selector Pills */}
        <div className="pt-1 border-t border-[#EAE3D9]">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {filteredProvinces.slice(0, 16).map((name) => (
              <button
                key={name}
                onClick={() => setSelectedProvince(name)}
                className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer min-h-[40px] sm:min-h-0 active:scale-95 flex items-center justify-center ${
                  selectedProvince === name
                    ? 'btn-terracotta font-semibold shadow-luxe-sm'
                    : 'bg-[#FAF8F5] text-[#656057] hover:text-[#24211D] hover:bg-[#F4EFEB] border border-[#EAE3D9]'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Segmented View Navigation Tabs */}
        <div className="flex border-b border-[#EAE3D9] pt-2 overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('market')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 min-h-[48px] active:scale-95 ${
              activeTab === 'market'
                ? 'border-[#C86A39] text-[#C86A39]'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('tabZoneBenchmark', 'ราคาตลาด & ราคาประเมิน')} ({selectedProvince})</span>
          </button>

          <button
            onClick={() => setActiveTab('mortgage')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 min-h-[48px] active:scale-95 ${
              activeTab === 'mortgage'
                ? 'border-[#C86A39] text-[#C86A39]'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>{t('tabBankComparison', 'อัตราดอกเบี้ย & โปรโมชัน 6 ธนาคาร')}</span>
          </button>

          <button
            onClick={() => setActiveTab('bot_ltv')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 min-h-[48px] active:scale-95 ${
              activeTab === 'bot_ltv'
                ? 'border-[#C86A39] text-[#C86A39]'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>LTV & DSR</span>
          </button>

          <button
            onClick={() => setActiveTab('mrr_table')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 min-h-[48px] active:scale-95 ${
              activeTab === 'mrr_table'
                ? 'border-[#C86A39] text-[#C86A39]'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>MRR / MLR</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Real Estate Market & Land Department Appraisal */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: Benchmark Stats & Spread Bar */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-6">
            <div className="flex justify-between items-start border-b border-[#EAE3D9] pb-4">
              <div>
                <span className="text-[11px] font-semibold text-[#C86A39] uppercase tracking-wider font-sans">
                  {t('locationOverviewLive', 'ข้อมูลภาพรวมทำเลแบบเรียลไทม์')}
                </span>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#24211D] mt-0.5">
                  {t('provinceLabel', 'จังหวัด')}{selectedProvince}
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-3.5 py-1 rounded-full flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                <span>{t('syncedLive', 'ซิงก์สดเรียบร้อย')}</span>
              </span>
            </div>

            {/* Key Metric Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Market Price Avg */}
              <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-[#C86A39] text-xs font-semibold mb-1">
                  <TrendingUp className="w-4 h-4" /> {t('marketAvgInArea', 'ราคาตลาดเฉลี่ยในพื้นที่')}
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-[#24211D] font-mono block">
                  ฿{formatNumber(marketPrice)} <span className="text-xs font-normal text-[#767067] font-sans">/{t('sqWaUnit', 'ตร.ว.')}</span>
                </span>
                <p className="text-xs text-[#767067] mt-1 font-sans">{t('marketPriceNote', 'อ้างอิงจากราคาที่มีการประกาศซื้อขายจริงในพื้นที่')}</p>
              </div>

              {/* Land Dept Appraisal */}
              <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-[#24211D] text-xs font-semibold mb-1">
                  <Landmark className="w-4 h-4 text-[#C86A39]" /> {t('officialAppraisalGov', 'ราคาประเมินกรมที่ดิน (ฐานราชการ)')}
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-[#C86A39] font-mono block">
                  ฿{formatNumber(appraisalPrice)} <span className="text-xs font-normal text-[#767067] font-sans">/{t('sqWaUnit', 'ตร.ว.')}</span>
                </span>
                <p className="text-xs text-[#767067] mt-1 font-sans">{t('appraisalPurposeNote', 'เกณฑ์คำนวณภาษีโอนและวงเงินจำนองสถาบันการเงิน')}</p>
              </div>
            </div>

            {/* Comparative Valuation Spread Bar */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#24211D] font-semibold">{t('spreadTitle', 'สเปรดราคาประเมิน vs ราคาตลาด vs เป้าหมายต่อรอง')}</span>
                <span className="text-[#C86A39] font-medium font-sans">{t('marginOfSafety', 'Margin of Safety')}</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs text-[#767067] mb-1">
                    <span>{t('spreadMarketBenchmark', 'ราคาตลาดเฉลี่ย (Market Benchmark)')}</span>
                    <span className="text-[#24211D] font-bold font-mono">฿{formatNumber(marketPrice)}</span>
                  </div>
                  <div className="w-full bg-[#EAE3D9] rounded-full h-2.5 overflow-hidden">
                    <div className="bg-[#24211D] h-full w-[100%] rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#767067] mb-1">
                    <span>{t('spreadInvestorTarget', 'เป้าหมายราคาต่อรองนักลงทุน (-18%)')}</span>
                    <span className="text-[#C86A39] font-bold font-mono">฿{formatNumber(targetInvestorPrice)}</span>
                  </div>
                  <div className="w-full bg-[#EAE3D9] rounded-full h-2.5 overflow-hidden">
                    <div className="bg-[#C86A39] h-full w-[82%] rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#767067] mb-1">
                    <span>{t('spreadGovFloor', 'ราคาประเมินราชการ (Gov Valuation Floor)')}</span>
                    <span className="text-[#2E7D32] font-bold font-mono">฿{formatNumber(appraisalPrice)}</span>
                  </div>
                  <div className="w-full bg-[#EAE3D9] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#2E7D32] h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.round((appraisalPrice / marketPrice) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Yield Benchmarks by Property Type */}
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-3">
              <span className="text-xs font-bold text-[#24211D] uppercase tracking-wider block">
                {t('rentalYieldTitle', 'เกณฑ์ผลตอบแทนค่าเช่าเฉลี่ย (Gross Rental Yield Benchmark)')}
              </span>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-[#EAE3D9]">
                  <span className="text-[11px] text-[#767067] block">{t('typeSingleHouse', 'บ้านเดี่ยว')}</span>
                  <span className="text-base sm:text-lg font-bold text-[#24211D] font-mono mt-0.5 block">
                    {liveData?.rentalYieldBenchmark?.singleHouse || 5.2}%
                  </span>
                  <span className="text-[10px] text-[#8A847C]">{t('perYear', 'ต่อปี')}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#EAE3D9]">
                  <span className="text-[11px] text-[#767067] block">{t('typeTownhome', 'ทาวน์โฮม')}</span>
                  <span className="text-base sm:text-lg font-bold text-[#C86A39] font-mono mt-0.5 block">
                    {liveData?.rentalYieldBenchmark?.townhome || 5.8}%
                  </span>
                  <span className="text-[10px] text-[#8A847C]">{t('perYear', 'ต่อปี')}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#EAE3D9]">
                  <span className="text-[11px] text-[#767067] block">{t('typeCondo', 'คอนโดมิเนียม')}</span>
                  <span className="text-base sm:text-lg font-bold text-[#2E7D32] font-mono mt-0.5 block">
                    {liveData?.rentalYieldBenchmark?.condo || 6.5}%
                  </span>
                  <span className="text-[10px] text-[#8A847C]">{t('perYear', 'ต่อปี')}</span>
                </div>
              </div>
            </div>

            {/* Demographic & Households */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9]">
              <div>
                <span className="text-[11px] text-[#767067] font-medium block uppercase">{t('popDensityLabel', 'ความหนาแน่นประชากร')}</span>
                <span className="text-base font-bold text-[#24211D] mt-0.5 block">
                  {populationDensity}
                </span>
                <span className="text-xs text-[#767067] font-mono mt-0.5 block">~{formatNumber(households)} {t('householdsInArea', 'ครัวเรือนในพื้นที่')}</span>
              </div>

              <div>
                <span className="text-[11px] text-[#767067] font-medium block uppercase">{t('targetDemographicLabel', 'กลุ่มเป้าหมายผู้ซื้อ/ผู้เช่า')}</span>
                <span className="text-xs font-bold text-[#C86A39] mt-0.5 block leading-tight">
                  {targetDemographic}
                </span>
                <span className="text-xs text-[#767067] mt-0.5 block">{dominantPropertyType}</span>
              </div>
            </div>

            {/* Growth corridor info */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] text-xs sm:text-sm text-[#24211D] flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#C86A39] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#24211D] mb-0.5">{t('growthTrendLabel', 'ทิศทางการพัฒนาและโครงสร้างพื้นฐานล่าสุด:')}</strong>
                <span className="leading-relaxed text-[#767067] font-sans">{growthTrend}</span>
              </div>
            </div>
          </div>

          {/* Right 1 Col: Institutional Investment Principles */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-5">
            <div className="flex items-center gap-2 border-b border-[#EAE3D9] pb-3">
              <BookOpen className="w-5 h-5 text-[#C86A39]" />
              <h3 className="font-editorial text-lg font-bold text-[#24211D]">
                {t('investorFormulaTitle', 'สูตรคิดวิเคราะห์สำหรับนักลงทุน')}
              </h3>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] space-y-1">
              <span className="text-xs font-bold text-[#C86A39] flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" /> {t('formula1Title', '1. Gap จากราคาประเมิน (Margin of Safety)')}
              </span>
              <p className="text-xs text-[#767067] leading-relaxed">
                {t('formula1Desc', 'หากซื้อได้ต่ำกว่าราคาประเมินราชการ จะมีแต้มต่อในการกู้ธนาคาร (กู้ได้วงเงินสูงกว่าราคาซื้อ) และมีเบาะรองรับความเสี่ยงที่แข็งแกร่ง')}
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] space-y-1">
              <span className="text-xs font-bold text-[#C86A39] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> {t('formula2Title', '2. ส่วนลดจากราคาตลาด (Under Market Value)')}
              </span>
              <p className="text-xs text-[#767067] leading-relaxed">
                {t('formula2Desc', 'กฎเหล็ก: "กำไรตั้งแต่ตอนซื้อ (Make Profit on Buy)" ควรต่อรองให้ได้ราคาต่ำกว่าราคาตลาดในพื้นที่ 15% - 25% เพื่อรองรับงบรีโนเวทและค่าธรรมเนียมโอน')}
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] space-y-1">
              <span className="text-xs font-bold text-[#C86A39] flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> {t('formula3Title', '3. Rental Yield เกณฑ์ปลอดภัย')}
              </span>
              <p className="text-xs text-[#767067] leading-relaxed">
                {t('formula3Desc', 'สำหรับที่อยู่อาศัยปล่อยเช่าควรได้ 5.5% - 7.5% ต่อปี เพื่อให้เพียงพอต่อค่างวดผ่อนธนาคารและเหลือกระแสเงินสดสุทธิเป็นบวก (Positive Cashflow)')}
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EAE3D9] space-y-1">
              <span className="text-xs font-bold text-[#24211D] flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#C86A39]" /> {t('formula4Title', '4. ทำเลที่มี Demand การเช่าแท้จริง')}
              </span>
              <p className="text-xs text-[#767067] leading-relaxed">
                {t('formula4Desc', 'โฟกัสรัศมี 1-3 กม. รอบสถานีรถไฟฟ้า แหล่งงาน นิคมอุตสาหกรรม หรือศูนย์กลางมหาวิทยาลัย อัตราห้องว่าง (Vacancy Rate) จะต่ำกว่า 5%')}
              </p>
            </div>

            <div className="pt-2 text-center text-xs text-[#8A847C] border-t border-[#EAE3D9]">
              {t('autoLinkedDataGov', 'เชื่อมโยงข้อมูลอัตโนมัติกับฐานข้อมูลกรมที่ดิน & ธปท.')}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: 6 Thai Commercial & State Bank Mortgage Packages */}
      {activeTab === 'mortgage' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EAE3D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C86A39] text-white flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#24211D]">
                  {t('mortgageCompareTitle', 'เปรียบเทียบอัตราดอกเบี้ยสินเชื่อบ้าน 6 สถาบันการเงินไทย (อัปเดตอัตโนมัติล่าสุด)')}
                </h3>
              </div>
              <p className="text-xs text-[#767067] mt-1 font-sans">
                {t('mortgageCompareDesc', 'จัดอันดับตามอัตราดอกเบี้ยเฉลี่ย 3 ปีแรกต่ำสุด วงเงินกู้สูงสุด (LTV) และสิทธิประโยชน์ฟรีค่าจดจำนอง / วงเงินตกแต่ง Top-up')}
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              <span>{t('autoUpdateLabel', 'อัปเดตอัตโนมัติ:')} {lastUpdated}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayBanks.map((bank: LiveBankPackage, index: number) => {
              const isRank1 = bank.rank === 1 || index === 0;
              const isRank2 = bank.rank === 2 || index === 1;
              const isRank3 = bank.rank === 3 || index === 2;

              return (
                <div
                  key={bank.bankCode || index}
                  className={`bg-[#FAF8F5] rounded-2xl p-6 relative flex flex-col justify-between transition-all border ${
                    isRank1
                      ? 'border-2 border-[#C86A39] shadow-luxe-sm'
                      : isRank2
                      ? 'border-[#EAE3D9] hover:border-[#C86A39]'
                      : 'border-[#EAE3D9] hover:border-[#C86A39]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isRank1
                          ? 'bg-[#C86A39] text-white'
                          : isRank2 || isRank3
                          ? 'bg-[#24211D] text-white'
                          : 'bg-[#F4EFEB] text-[#24211D] border border-[#EAE3D9]'
                      }`}>
                        {bank.badge}
                      </span>
                      <span className="text-[10px] font-mono text-[#8A847C]">#{bank.rank || index + 1}</span>
                    </div>

                    <h4 className="font-editorial text-lg font-bold text-[#24211D] leading-tight">{bank.bankName}</h4>
                    <p className="text-xs text-[#767067] mt-0.5 line-clamp-1">{bank.packageName}</p>
                    
                    {/* Rate Display */}
                    <div className="mt-4 bg-white p-4 rounded-xl border border-[#EAE3D9]">
                      <span className="text-[11px] text-[#767067] block">{t('avgInterestRate3Years', 'ดอกเบี้ยเฉลี่ย 3 ปีแรก')}</span>
                      <span className="text-2xl sm:text-3xl font-bold text-[#C86A39] font-mono block">
                        {bank.avgInterestRate3Years}% <span className="text-xs font-normal text-[#767067] font-sans">{t('perYearShort', '/ปี')}</span>
                      </span>
                      
                      {bank.rateBreakdown && (
                        <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-[#EAE3D9] text-center text-[10px] text-[#767067]">
                          <div>{t('year1Label', 'ปี 1:')} <strong className="text-[#24211D] font-mono">{bank.rateBreakdown.year1}%</strong></div>
                          <div>{t('year2Label', 'ปี 2:')} <strong className="text-[#24211D] font-mono">{bank.rateBreakdown.year2}%</strong></div>
                          <div>{t('year3Label', 'ปี 3:')} <strong className="text-[#24211D] font-mono">{bank.rateBreakdown.year3}%</strong></div>
                        </div>
                      )}

                      <div className="mt-2 text-[11px] text-[#24211D] font-medium flex justify-between">
                        <span>{t('approxMonthlyInstallment', 'ผ่อนล้านละประมาณ')}</span>
                        <strong className="font-mono text-[#C86A39]">~{Math.round(bank.avgInterestRate3Years * 1250)} {t('unitBahtPerMonth', 'บาท/เดือน')}</strong>
                      </div>
                    </div>

                    {/* Loan terms */}
                    <div className="flex items-center justify-between text-xs text-[#767067] mt-3 px-1">
                      <span>{t('maxLtvLabel', 'วงเงินกู้สูงสุด (LTV):')} <strong className="text-[#24211D] font-mono">{bank.maxLTV}%</strong></span>
                      <span>{t('maxTermLabel', 'ผ่อนนานสุด:')} <strong className="text-[#24211D] font-mono">{bank.maxTermYears} {t('unitYears', 'ปี')}</strong></span>
                    </div>

                    {/* Features List */}
                    <ul className="mt-3 text-xs text-[#767067] space-y-1.5 font-sans">
                      {(bank.investorHighlights || []).map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#2E7D32] font-bold">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE3D9] text-xs text-[#C86A39] font-medium font-sans">
                    <span>{t('specialPerksLabel', 'จุดเด่น:')} {bank.specialPerks}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl text-xs text-[#767067] border border-[#EAE3D9] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C86A39] shrink-0" />
              <span>{t('mortgageDisclaimer', 'เกณฑ์สินเชื่อและอัตราดอกเบี้ยอัปเดตอัตโนมัติสำหรับโปรโมชันสินเชื่อเพื่อที่อยู่อาศัยและนักลงทุน ปี 2569')}</span>
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: Bank of Thailand LTV & DSR Criteria */}
      {activeTab === 'bot_ltv' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EAE3D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C86A39] text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#24211D]">
                  {t('botLtvTitle', 'เกณฑ์กำกับดูแลสินเชื่อเพื่อที่อยู่อาศัย ธนาคารแห่งประเทศไทย (BOT LTV Measure)')}
                </h3>
              </div>
              <p className="text-xs text-[#767067] mt-1 font-sans">
                {t('botLtvDesc', 'มาตรการ LTV (Loan-to-Value) และเกณฑ์ภาระหนี้ DSR (Debt Service Ratio) สำหรับการวางแผนพอร์ตอสังหาริมทรัพย์')}
              </p>
            </div>

            <span className="text-xs font-semibold text-[#24211D] bg-[#F4EFEB] px-3 py-1.5 rounded-full border border-[#EAE3D9]">
              {t('botCurrentEnforced', 'เกณฑ์บังคับใช้ ธปท. ปัจจุบัน')}
            </span>
          </div>

          {/* LTV Rules Table */}
          <div className="overflow-x-auto border border-[#EAE3D9] rounded-2xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D9] text-[#767067] uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{t('thContractOrder', 'ลำดับสัญญา')}</th>
                  <th className="py-3.5 px-4">{t('thContractType', 'ลักษณะสัญญา / วัตถุประสงค์')}</th>
                  <th className="py-3.5 px-4">{t('thPriceUnder10M', 'ทรัพย์ราคา < 10 ล้านบาท')}</th>
                  <th className="py-3.5 px-4">{t('thPriceOver10M', 'ทรัพย์ราคา ≥ 10 ล้านบาท')}</th>
                  <th className="py-3.5 px-4">{t('thTopupLoan', 'สินเชื่อตกแต่ง Top-up')}</th>
                  <th className="py-3.5 px-4">{t('thInvestorNotes', 'หมายเหตุสำหรับนักลงทุน')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9] text-[#24211D]">
                {(liveData?.botLtvRules || []).map((rule, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#C86A39] whitespace-nowrap">{rule.contract}</td>
                    <td className="py-4 px-4 font-medium">{rule.label}</td>
                    <td className="py-4 px-4 font-semibold text-[#2E7D32] whitespace-nowrap">{rule.priceUnder10M}</td>
                    <td className="py-4 px-4 font-semibold whitespace-nowrap">{rule.priceOver10M}</td>
                    <td className="py-4 px-4 text-[#767067]">{rule.topupLoanAllowed}</td>
                    <td className="py-4 px-4 text-xs text-[#767067]">{rule.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DSR / DBR Debt Burden Thresholds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-1.5">
              <div className="flex items-center gap-2 text-[#24211D] text-xs font-bold uppercase">
                <Percent className="w-4 h-4 text-[#C86A39]" /> {t('dsrUnder30kTitle', 'DSR ผู้กู้รายได้ < 30,000 บ.')}
              </div>
              <span className="text-xl font-bold text-[#24211D] font-mono block">{t('dsrMax60', 'สูงสุดไม่เกิน 60%')}</span>
              <p className="text-xs text-[#767067] leading-relaxed">
                {t('dsrUnder30kDesc', 'ค่างวดรวมหนี้สินทุกประเภทรวมกัน ต้องไม่เกิน 60% ของรายได้สุทธิเพื่อความมั่นคงทางการเงิน')}
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-1.5">
              <div className="flex items-center gap-2 text-[#24211D] text-xs font-bold uppercase">
                <Percent className="w-4 h-4 text-[#C86A39]" /> {t('dsrOver30kTitle', 'DSR ผู้กู้รายได้ ≥ 30,000 บ.')}
              </div>
              <span className="text-xl font-bold text-[#C86A39] font-mono block">{t('dsrMax70', 'สูงสุดไม่เกิน 70%')}</span>
              <p className="text-xs text-[#767067] leading-relaxed">
                {t('dsrOver30kDesc', 'เปิดกว้างให้กู้เพื่อการลงทุนได้คล่องตัวขึ้น เหมาะสำหรับผู้มีเงินเดือนประจำหรือธุรกิจส่วนตัว')}
              </p>
            </div>

            <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-1.5">
              <div className="flex items-center gap-2 text-[#24211D] text-xs font-bold uppercase">
                <Building className="w-4 h-4 text-[#2E7D32]" /> {t('rentalIncomeCountTitle', 'นับรวมรายได้ค่าเช่า (Rental Income)')}
              </div>
              <span className="text-xl font-bold text-[#2E7D32] font-mono block">{t('rentalIncomeCountValue', 'คิด 60% - 70%')}</span>
              <p className="text-xs text-[#767067] leading-relaxed">
                {t('rentalIncomeCountDesc', 'สามารถนำสัญญาเช่าและ Statement ย้อนหลัง 6 เดือนของทรัพย์เดิมมานับเป็นรายได้กู้ทรัพย์ถัดไปได้')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Reference Rates (MRR / MLR / MOR) */}
      {activeTab === 'mrr_table' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EAE3D9] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C86A39] text-white flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#24211D]">
                  {t('mrrTableTitle', 'ตารางอัตราดอกเบี้ยเงินกู้อ้างอิง (MRR, MLR, MOR) ทุกสถาบันการเงิน')}
                </h3>
              </div>
              <p className="text-xs text-[#767067] mt-1 font-sans">
                {t('mrrTableDesc', 'อัตราดอกเบี้ยมาตรฐานที่ธนาคารใช้กำหนดในสัญญาสินเชื่อบ้าน (ปีที่ 4 เป็นต้นไปหลังหมดโปรโมชันคงที่)')}
              </p>
            </div>

            <div className="text-xs font-mono text-[#767067] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EAE3D9]">
              {t('botPolicyRateLabel', 'ธปท. อัตราดอกเบี้ยนโยบาย:')} {botPolicyRate}%
            </div>
          </div>

          <div className="overflow-x-auto border border-[#EAE3D9] rounded-2xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#EAE3D9] text-[#767067] uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">{t('thFinancialInstitution', 'สถาบันการเงิน')}</th>
                  <th className="py-3.5 px-4">{t('thMrrRetail', 'MRR (ลูกค้ารายย่อยชั้นดี)')}</th>
                  <th className="py-3.5 px-4">{t('thMlrCorporate', 'MLR (ลูกค้ารายใหญ่ชั้นดี)')}</th>
                  <th className="py-3.5 px-4">{t('thMorOverdraft', 'MOR (เบิกเกินบัญชี)')}</th>
                  <th className="py-3.5 px-4">{t('thEffectiveDate', 'วันที่มีผลบังคับใช้')}</th>
                  <th className="py-3.5 px-4">{t('thMortgageValueStatus', 'สถานะความคุ้มค่าสินเชื่อบ้าน')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D9] text-[#24211D]">
                {(liveData?.bankRateReferences || []).map((ref, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#24211D] whitespace-nowrap">{ref.bankName}</td>
                    <td className="py-4 px-4 font-mono font-bold text-[#C86A39]">{ref.mrr}%</td>
                    <td className="py-4 px-4 font-mono font-semibold text-[#767067]">{ref.mlr}%</td>
                    <td className="py-4 px-4 font-mono text-[#767067]">{ref.mor}%</td>
                    <td className="py-4 px-4 text-xs text-[#8A847C] whitespace-nowrap">{ref.effectiveDate}</td>
                    <td className="py-4 px-4 text-xs">
                      {ref.bankCode === 'ghb' && <span className="text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-md">{t('mrrLowestInSystem', 'MRR ต่ำสุดในระบบ')}</span>}
                      {ref.bankCode === 'gsb' && <span className="text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-md">{t('mrrSecondLowest', 'MRR ต่ำรองลงมา')}</span>}
                      {ref.bankCode === 'bbl' && <span className="text-[#24211D] font-medium bg-[#FAF8F5] px-2 py-0.5 rounded-md">{t('mrrHighStabilityCommercial', 'ธนาคารพาณิชย์เสถียรภาพสูง')}</span>}
                      {ref.bankCode === 'ttb' && <span className="text-[#C86A39] font-medium bg-[#F4EFEB] px-2 py-0.5 rounded-md">{t('mrrSpecialDiscount', 'มีส่วนลด MRR พิเศษ 3 ปีแรก')}</span>}
                      {ref.bankCode === 'kbank' && <span className="text-[#767067] font-medium">{t('mrrThaiBankStandard', 'มาตรฐานสมาคมธนาคารไทย')}</span>}
                      {ref.bankCode === 'scb' && <span className="text-[#767067] font-medium">{t('mrrThaiBankStandard', 'มาตรฐานสมาคมธนาคารไทย')}</span>}
                      {ref.bankCode === 'ktb' && <span className="text-[#767067] font-medium">{t('mrrStateBankStandard', 'มาตรฐานสถาบันการเงินรัฐ')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl text-xs text-[#767067] border border-[#EAE3D9] leading-relaxed">
            {t('debtAdviceFooter', '💡 คำแนะนำการบริหารหนี้: เมื่อผ่อนครบกำหนด 3 ปี ดอกเบี้ยจะปรับเป็นอัตราลอยตัวอิงตาม MRR นักลงทุนควรยื่นขอ Retention (ขอลดดอกเบี้ยเดิมกับธนาคารเดิม) หรือดำเนินการ Refinance ไปยังสถาบันการเงินที่ให้ดอกเบี้ยโปรโมชันใหม่เพื่อรักษาค่างวดให้ต่ำอยู่เสมอ')}
          </div>
        </div>
      )}

    </div>
  );
};
