import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Award,
  Star,
  Phone,
  MessageCircle,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Send,
  Wrench,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Sparkles,
  ExternalLink,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { ContractorCompany, ContractorInquiry } from '../types/contractor';
import { fetchLiveContractors, submitContractorInquiry } from '../services/contractorService';
import { THAI_PROVINCES } from '../data/thaiLocations';
import { useLanguage } from '../i18n/LanguageContext';

interface ContractorsDirectoryProps {
  initialProvince?: string;
  initialDistrict?: string;
  propertyTitle?: string;
  propertyType?: string;
  areaSizeSqWa?: number;
  compactView?: boolean;
}

export const ContractorsDirectory: React.FC<ContractorsDirectoryProps> = ({
  initialProvince = 'กรุงเทพมหานคร',
  initialDistrict = '',
  propertyTitle,
  propertyType,
  areaSizeSqWa,
  compactView = false,
}) => {
  const { t } = useLanguage();
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contractors, setContractors] = useState<ContractorCompany[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  // Quote Request Modal State
  const [activeQuoteCompany, setActiveQuoteCompany] = useState<ContractorCompany | null>(null);
  const [quoteCustomerName, setQuoteCustomerName] = useState('');
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState('');
  const [quoteCustomerLine, setQuoteCustomerLine] = useState('');
  const [quoteScope, setQuoteScope] = useState<'renovation_full' | 'kitchen_extension' | 'interior_turnkey' | 'system_repair' | 'new_build'>('renovation_full');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<{ ref: string; text: string } | null>(null);

  const loadContractors = async (force: boolean = false) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetchLiveContractors({
        province: selectedProvince,
        district: initialDistrict,
        category: selectedCategory === 'all' ? '' : selectedCategory,
        forceRefresh: force,
      });

      setContractors(res.contractors);
      setLastSyncedTime(res.lastSynced);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadContractors(false);
  }, [selectedProvince, selectedCategory]);

  const handleCopyContact = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleReviews = (companyId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  const handleOpenQuoteModal = (company: ContractorCompany) => {
    setActiveQuoteCompany(company);
    setQuoteSuccessMsg(null);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuoteCompany || !quoteCustomerPhone) return;

    setIsSubmittingQuote(true);
    try {
      const inquiry: ContractorInquiry = {
        contractorId: activeQuoteCompany.id,
        contractorName: activeQuoteCompany.name,
        customerName: quoteCustomerName || t('unspecifiedCustomer', 'ลูกค้าไม่ระบุชื่อ'),
        customerPhone: quoteCustomerPhone,
        customerLineId: quoteCustomerLine,
        propertyLocation: `${selectedProvince} ${initialDistrict}`,
        propertyType: propertyType || t('generalProperty', 'บ้าน/อสังหาริมทรัพย์'),
        areaSizeSqWa: areaSizeSqWa,
        scopeOfWork: quoteScope,
        notes: quoteNotes,
        preferredContactTime: t('anytimeContact', 'สะดวกทุกช่วงเวลา'),
      };

      const result = await submitContractorInquiry(inquiry);
      if (result.success) {
        setQuoteSuccessMsg({
          ref: result.referenceNumber,
          text: result.message,
        });
        setTimeout(() => {
          setActiveQuoteCompany(null);
          setQuoteSuccessMsg(null);
          setQuoteCustomerName('');
          setQuoteCustomerPhone('');
          setQuoteCustomerLine('');
          setQuoteNotes('');
        }, 4000);
      }
    } catch (err) {
      console.error('Inquiry error:', err);
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Calculate estimated renovation cost range if areaSize is available
  const getEstimatedCostRange = (company: ContractorCompany) => {
    if (!areaSizeSqWa) return null;
    // 1 sq.wa approx 2-4 sqm usable area for 2-floor house, let's assume standard usable area ~120-180 sqm
    const usableSqm = Math.round(areaSizeSqWa * 2.2);
    const minCost = usableSqm * company.priceEstimatePerSqm.renovationMin;
    const maxCost = usableSqm * company.priceEstimatePerSqm.renovationMax;
    return {
      usableSqm,
      minCost,
      maxCost,
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Automated Sync Status */}
      <div className="bg-[#FAF8F5] rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#EAE3D9] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#C86A39] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED CONTRACTORS
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse"></span>
                {t('autoSyncBadge', 'อัปเดตอัตโนมัติสด')}
              </span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#24211D] tracking-tight">
              {t('contractorsHeaderTitle', 'ช่าง & บริษัทรับเหมาก่อสร้างคุณภาพสูงในพื้นที่ (5 บริษัทแนะนำ)')}
            </h2>
            <p className="text-xs sm:text-sm text-[#767067]">
              {t('contractorsHeaderSubtitle', 'คัดเลือกผู้รับเหมาจดทะเบียน มีรีวิวดีเยี่ยม การันตีไม่ทิ้งงาน 100% แบ่งจ่ายตามงวดงาน และมีวิศวกรควบคุมมาตรฐาน')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => loadContractors(true)}
              disabled={isRefreshing}
              className="w-full sm:w-auto bg-white hover:bg-[#F4EFEB] text-[#24211D] border border-[#EAE3D9] text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-luxe-sm cursor-pointer disabled:opacity-50"
              title={t('refreshNow', 'ดึงข้อมูลความพร้อมและสถานะคิวงานล่าสุด')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#C86A39] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? t('submitting', 'กำลังอัปเดตสด...') : t('autoSyncBadge', 'อัปเดตข้อมูลล่าสุดอัตโนมัติ')}</span>
            </button>
          </div>
        </div>

        {/* 4 Pillars of Guaranteed Quality & Zero-Abandonment */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE3D9] space-y-1">
            <div className="flex items-center gap-1.5 text-[#2E7D32] text-xs font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{t('badgeNoAbandonment', 'การันตีไม่ทิ้งงาน 100%')}</span>
            </div>
            <p className="text-[11px] text-[#767067] leading-relaxed">
              {t('pillar1Desc', 'สัญญามาตรฐาน สคบ. ระบุค่าปรับรายวันชัดเจน มีที่ตั้งสำนักงานตรวจสอบได้')}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE3D9] space-y-1">
            <div className="flex items-center gap-1.5 text-[#C86A39] text-xs font-bold">
              <DollarSign className="w-4 h-4 shrink-0" />
              <span>{t('safetyStandards', 'แบ่งจ่ายตามงวดงานจริง')}</span>
            </div>
            <p className="text-[11px] text-[#767067] leading-relaxed">
              {t('pillar2Desc', 'ไม่มีเบิกเงินล่วงหน้าก้อนใหญ่ ตรวจรับความเรียบร้อยก่อนโอนแต่ละงวด')}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE3D9] space-y-1">
            <div className="flex items-center gap-1.5 text-[#B45309] text-xs font-bold">
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>{t('badgeEngineer', 'วิศวกร & สถาปนิกคุมงาน')}</span>
            </div>
            <p className="text-[11px] text-[#767067] leading-relaxed">
              {t('pillar3Desc', 'ทีมช่างประจำบริษัท มีโฟร์แมนตรวจหน้างานทุกวัน ไม่ส่งต่อผู้รับเหมาช่วง')}
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE3D9] space-y-1">
            <div className="flex items-center gap-1.5 text-[#1565C0] text-xs font-bold">
              <Award className="w-4 h-4 shrink-0" />
              <span>{t('badgeWarranty', 'รับประกันโครงสร้าง 1-5 ปี')}</span>
            </div>
            <p className="text-[11px] text-[#767067] leading-relaxed">
              {t('pillar4Desc', 'จดทะเบียนนิติบุคคล DBD ทุนชำระเต็ม มีใบรับประกันผลงานเป็นลายลักษณ์อักษร')}
            </p>
          </div>
        </div>

        {/* Location & Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-[#EAE3D9] rounded-xl px-3 py-1.5 text-xs text-[#24211D] shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-[#C86A39]" />
              <span className="text-[#767067]">{t('filterProvince', 'พื้นที่ให้บริการ')}:</span>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="font-bold text-[#24211D] bg-transparent outline-none cursor-pointer"
              >
                {THAI_PROVINCES.map((prov: string) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#24211D] text-white'
                    : 'bg-white text-[#767067] hover:bg-[#F4EFEB] border border-[#EAE3D9]'
                }`}
              >
                {t('allCategories', 'ทุกประเภทงาน')}
              </button>
              <button
                onClick={() => setSelectedCategory('renovate')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'renovate'
                    ? 'bg-[#24211D] text-white'
                    : 'bg-white text-[#767067] hover:bg-[#F4EFEB] border border-[#EAE3D9]'
                }`}
              >
                {t('catRenovation', 'รีโนเวท & ปรับปรุง')}
              </button>
              <button
                onClick={() => setSelectedCategory('build')}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'build'
                    ? 'bg-[#24211D] text-white'
                    : 'bg-white text-[#767067] hover:bg-[#F4EFEB] border border-[#EAE3D9]'
                }`}
              >
                {t('catNewBuild', 'ต่อเติม & สร้างบ้าน')}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#767067]">
            <span>{t('systemStatusDbd', 'สถานะระบบ: ซิงก์ข้อมูลตรงกับทะเบียน DBD')} · {lastSyncedTime || t('realtimeStatus', 'เรียลไทม์')}</span>
          </div>
        </div>
      </div>

      {/* 5 Recommended Companies List */}
      <div className="space-y-5">
        {contractors.map((company, index) => {
          const isExpanded = !!expandedReviews[company.id];
          const costEstimate = getEstimatedCostRange(company);

          return (
            <div
              key={company.id}
              className="bg-white rounded-3xl border border-[#EAE3D9] p-6 sm:p-7 shadow-luxe hover:border-[#C86A39]/60 transition-all space-y-5 relative overflow-hidden"
            >
              {/* Ranking & Top Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3D9] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#C86A39] text-white flex items-center justify-center font-bold text-base shadow-luxe-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#24211D]">
                        {company.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-[#2E7D32] bg-[#E8F5E9] border border-[#C8E6C9] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                        {company.currentQueueStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#767067] flex items-center gap-1.5 mt-0.5">
                      <span>{company.legalName}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">DBD: {company.registrationNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-base font-bold text-[#24211D]">{company.rating.toFixed(2)}</span>
                      <span className="text-xs text-[#767067]">({company.reviewCount} {t('reviewUnit', 'รีวิว')})</span>
                    </div>
                    <span className="text-[11px] text-[#2E7D32] font-semibold">
                      {t('completedProjectsPrefix', 'ส่งมอบแล้วกว่า')} {company.completedProjectsCount}+ {t('completedProjectsSuffix', 'โครงการ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Highlight Badge */}
              <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE3D9] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#C86A39] font-bold">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{company.highlightBadge}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#767067]">
                  <Clock className="w-3.5 h-3.5 text-[#8A847C]" />
                  <span>{company.lastUpdated}</span>
                </div>
              </div>

              {/* Guarantees & Specialties Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Standard Guarantees (No Abandonment) */}
                <div className="bg-[#FAF8F5]/80 p-4 rounded-2xl border border-[#EAE3D9] space-y-2">
                  <span className="text-[11px] font-bold text-[#24211D] uppercase tracking-wider block">
                    {t('verifiedQualityWarranty', '🛡️ มาตรฐานคุณภาพ & การันตีไม่ทิ้งงาน')}
                  </span>
                  <ul className="text-xs text-[#24211D] space-y-1.5">
                    {company.guarantees.map((g, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-[#EAE3D9] text-[11px] text-[#C86A39] font-semibold">
                    📜 {company.warrantyDetails}
                  </div>
                </div>

                {/* Right: Specialties & Certifications */}
                <div className="bg-[#FAF8F5]/80 p-4 rounded-2xl border border-[#EAE3D9] space-y-2">
                  <span className="text-[11px] font-bold text-[#24211D] uppercase tracking-wider block">
                    {t('professionalCertifications', '👷 ความเชี่ยวชาญ & ใบรับรองวิชาชีพ')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {company.specialties.map((s, i) => (
                      <span
                        key={i}
                        className="bg-white border border-[#EAE3D9] text-[#24211D] text-[11px] font-medium px-2.5 py-1 rounded-xl shadow-2xs"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#EAE3D9] space-y-1">
                    <span className="text-[10px] text-[#767067] font-semibold block uppercase">
                      {t('affiliationsAndAccreditations', 'การรับรองและสังกัดองค์กร:')}
                    </span>
                    <ul className="text-[11px] text-[#767067] space-y-0.5">
                      {company.certifications.map((cert, ci) => (
                        <li key={ci}>• {cert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Price Estimate & Property Specific Renovation Budget */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE3D9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-[#767067] block uppercase font-medium">
                    {t('boqStandardRates', 'อัตราค่าแรงและวัสดุเริ่มต้นมาตรฐาน (BOQ):')}
                  </span>
                  <div className="flex flex-wrap items-baseline gap-3 mt-0.5">
                    <span>
                      {t('renovationWorkRate', 'งานรีโนเวท:')} <strong className="text-[#C86A39] text-sm">฿{company.priceEstimatePerSqm.renovationMin.toLocaleString()} - ฿{company.priceEstimatePerSqm.renovationMax.toLocaleString()}</strong> /{t('sqm', 'ตร.ม.')}
                    </span>
                    <span className="text-[#8A847C]">|</span>
                    <span>
                      {t('newBuildRate', 'สร้างใหม่/ต่อเติม:')} <strong className="text-[#24211D] text-sm">฿{company.priceEstimatePerSqm.buildingMin.toLocaleString()} - ฿{company.priceEstimatePerSqm.buildingMax.toLocaleString()}</strong> /{t('sqm', 'ตร.ม.')}
                    </span>
                  </div>
                </div>

                {costEstimate && (
                  <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE3D9] text-right">
                    <span className="text-[10px] text-[#767067] block">
                      {t('roughEstimateForProperty', 'งบประเมินคร่าวๆ สำหรับทรัพย์นี้')} (~{costEstimate.usableSqm} {t('sqm', 'ตร.ม.')}):
                    </span>
                    <span className="text-xs font-bold text-[#2E7D32]">
                      ฿{(costEstimate.minCost / 100000).toFixed(1)} - {(costEstimate.maxCost / 100000).toFixed(1)} {t('hundredThousandBaht', 'แสนบาท')}
                    </span>
                  </div>
                )}
              </div>

              {/* Comprehensive Contact Channels (Phone, LINE, Web, Address) */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE3D9] pb-2">
                  <span className="text-xs font-bold text-[#24211D] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#C86A39]" />
                    <span>{t('directContactChannels', 'ช่องทางติดต่อโดยตรง (Direct Contacts)')}</span>
                  </span>
                  <span className="text-[11px] text-[#767067] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#8A847C]" />
                    <span>{t('coverageAreaLabel', 'พื้นที่ครอบคลุม:')} {company.coverageProvinces.join(', ')}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Phone */}
                  <div className="bg-white p-3 rounded-xl border border-[#EAE3D9] space-y-1">
                    <span className="text-[10px] text-[#767067] block">{t('directPhoneLabel', 'เบอร์โทรศัพท์สายตรง:')}</span>
                    <a
                      href={`tel:${company.phone.replace(/[^0-9]/g, '')}`}
                      className="font-bold text-[#C86A39] hover:underline flex items-center gap-1 text-sm"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#C86A39]" />
                      <span>{company.phone}</span>
                    </a>
                    {company.secondaryPhone && (
                      <span className="text-[11px] text-[#767067] block">{company.secondaryPhone}</span>
                    )}
                  </div>

                  {/* LINE */}
                  <div className="bg-white p-3 rounded-xl border border-[#EAE3D9] space-y-1">
                    <span className="text-[10px] text-[#767067] block">LINE Official:</span>
                    <a
                      href={`https://line.me/R/ti/p/~${company.lineId.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#2E7D32] hover:underline flex items-center gap-1 text-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>{company.lineId}</span>
                    </a>
                    <span className="text-[10px] text-[#8A847C] block">{t('clickToChatFree', 'คลิกเพื่อแชทปรึกษาฟรี')}</span>
                  </div>

                  {/* Website */}
                  <div className="bg-white p-3 rounded-xl border border-[#EAE3D9] space-y-1">
                    <span className="text-[10px] text-[#767067] block">{t('websiteSocialLabel', 'เว็บไซต์ / แฟนเพจ:')}</span>
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[#1565C0] hover:underline flex items-center gap-1 truncate text-xs"
                      title={company.websiteUrl}
                    >
                      <Globe className="w-3.5 h-3.5 text-[#1565C0] shrink-0" />
                      <span className="truncate">{company.websiteUrl.replace('https://', '')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <span className="text-[10px] text-[#8A847C] block">{t('viewProjects300', 'ชมผลงานจริง 300+ โครงการ')}</span>
                  </div>

                  {/* Office Address */}
                  <div className="bg-white p-3 rounded-xl border border-[#EAE3D9] space-y-1">
                    <span className="text-[10px] text-[#767067] block">{t('officeLocationLabel', 'ที่ตั้งสำนักงาน:')}</span>
                    <p className="text-[11px] text-[#24211D] leading-snug line-clamp-2" title={company.address}>
                      {company.address}
                    </p>
                    <span className="text-[10px] text-[#8A847C] block">{t('workingHoursLabel', 'เวลา:')} {company.workingHours}</span>
                  </div>
                </div>

                {/* Action Buttons: Copy / Reviews / Direct Call / LINE / Quote Request */}
                <div className="flex flex-col gap-2 pt-3 border-t border-[#F4EFEB]">
                  {/* Top Mobile-Friendly Quick Communication Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Direct Phone Call Button */}
                    <a
                      href={`tel:${company.phone.replace(/[^0-9]/g, '')}`}
                      className="bg-white hover:bg-[#FAF8F5] active:scale-[0.98] text-[#C86A39] border border-[#EAE3D9] text-xs sm:text-sm font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[46px]"
                    >
                      <Phone className="w-4 h-4 shrink-0 text-[#C86A39]" />
                      <span>{t('callContact', 'โทรติดต่อ')}: {company.phone}</span>
                    </a>

                    {/* Direct LINE Chat Button */}
                    <a
                      href={`https://line.me/R/ti/p/~${company.lineId.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#2E7D32] hover:bg-[#256829] active:scale-[0.98] text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[46px]"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>{t('lineContact', 'แชท LINE')}: {company.lineId}</span>
                    </a>

                    {/* Request Free Quote Button */}
                    <button
                      onClick={() => handleOpenQuoteModal(company)}
                      className="btn-terracotta active:scale-[0.98] text-xs sm:text-sm font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-luxe-sm cursor-pointer min-h-[46px]"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span>{t('requestQuoteBtn', 'ขอใบเสนอราคาฟรี')}</span>
                    </button>
                  </div>

                  {/* Secondary Utilities: Copy & Reviews */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => handleCopyContact(company.id, `${t('companyPrefix', 'บริษัท')} ${company.name}\n${t('phoneLabel', 'โทร')}: ${company.phone}\nLINE: ${company.lineId}\n${t('websiteLabel', 'เว็บ')}: ${company.websiteUrl}`)}
                      className="text-[#767067] hover:text-[#24211D] text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === company.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                          <span className="text-[#2E7D32]">{t('copiedContact', 'คัดลอกข้อมูลแล้ว')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#767067]" />
                          <span>{t('copyPhoneAndLine', 'คัดลอกเบอร์ & LINE')}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => toggleReviews(company.id)}
                      className="text-xs font-semibold text-[#767067] hover:text-[#24211D] flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-white transition-colors cursor-pointer"
                    >
                      <span>{t('viewReviewsCount', 'ดูรีวิวจริง')} ({company.topReviews.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Customer Reviews */}
              {isExpanded && (
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#EAE3D9] space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-2">
                    <span className="text-xs font-bold text-[#24211D]">
                      {t('verifiedCustomerReviews', 'รีวิวจากลูกค้าตัวจริงที่ว่าจ้างผ่านระบบ (Verified Reviews)')}
                    </span>
                    <span className="text-[11px] text-[#2E7D32] font-semibold">
                      {t('contractGuaranteeBadge', '✓ ตรวจสอบสัญญาและหน้างานจริง 100%')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {company.topReviews.map((rev) => (
                      <div key={rev.id} className="bg-white p-3.5 rounded-xl border border-[#EAE3D9] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#24211D]">{rev.author}</span>
                            <span className="text-[10px] text-[#767067]">({rev.location})</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star
                                key={si}
                                className={`w-3 h-3 ${
                                  si < Math.floor(rev.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-[#24211D] leading-relaxed">
                          "{rev.comment}"
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-[#F0EBE4] text-[10px] text-[#8A847C]">
                          <span>{t('reviewProjectTypeLabel', 'ประเภท:')} {rev.projectType}</span>
                          <span>{t('reviewDateLabel', 'วันที่:')} {rev.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Inquiry & Quotation Modal */}
      {activeQuoteCompany && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#EAE3D9] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-start border-b border-[#EAE3D9] pb-3">
              <div>
                <span className="text-[11px] text-[#C86A39] font-bold uppercase tracking-wider">
                  REQUEST QUOTATION & SITE VISIT
                </span>
                <h3 className="font-editorial text-xl font-bold text-[#24211D]">
                  {t('freeQuoteTitle', 'ขอใบเสนอราคาฟรี:')} {activeQuoteCompany.name}
                </h3>
                <p className="text-xs text-[#767067] mt-0.5">
                  {t('expertEngineerCallPrompt', 'วิศวกรผู้เชี่ยวชาญจะติดต่อกลับเพื่อให้คำปรึกษาและประเมินงบประมาณเบื้องต้นฟรี')}
                </p>
              </div>
              <button
                onClick={() => setActiveQuoteCompany(null)}
                className="text-[#8A847C] hover:text-[#24211D] p-1.5 rounded-xl hover:bg-[#FAF8F5] transition-colors"
              >
                ✕
              </button>
            </div>

            {quoteSuccessMsg ? (
              <div className="bg-[#E8F5E9] border border-[#C8E6C9] p-5 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#2E7D32] mx-auto" />
                <h4 className="font-bold text-[#2E7D32] text-sm">
                  {quoteSuccessMsg.text}
                </h4>
                <p className="text-xs text-[#767067]">
                  {t('quoteRefLabel', 'รหัสอ้างอิงการติดต่อ:')} <span className="font-mono font-bold text-[#24211D]">{quoteSuccessMsg.ref}</span>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
                {/* Property Context */}
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE3D9]">
                  <span className="text-[10px] text-[#767067] block">{t('propertyToRenovateLabel', 'อสังหาริมทรัพย์ที่ต้องการปรับปรุง:')}</span>
                  <span className="font-bold text-[#24211D] block">
                    {propertyTitle || `${selectedProvince} ${initialDistrict}`}
                  </span>
                  {areaSizeSqWa && (
                    <span className="text-[11px] text-[#C86A39] font-medium">
                      {t('landAreaLabel', 'ขนาดที่ดิน:')} {areaSizeSqWa} {t('sqWa', 'ตร.ว.')}
                    </span>
                  )}
                </div>

                {/* Scope of work */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#24211D] block">{t('serviceTypeNeededLabel', 'ประเภทงานที่ต้องการ:')}</label>
                  <select
                    value={quoteScope}
                    onChange={(e: any) => setQuoteScope(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2.5 font-medium text-[#24211D] outline-none focus:border-[#C86A39]"
                  >
                    <option value="renovation_full">{t('scopeRenovationFull', 'รีโนเวททั้งหลัง (Full Renovation)')}</option>
                    <option value="kitchen_extension">{t('scopeKitchenExtension', 'ต่อเติมห้องครัว / โรงรถเข็มไมโครไพล์')}</option>
                    <option value="interior_turnkey">{t('scopeInteriorTurnkey', 'ออกแบบตกแต่งภายใน Turnkey')}</option>
                    <option value="system_repair">{t('scopeSystemRepair', 'งานระบบไฟฟ้า-ประปา-แก้หลังคารั่ว')}</option>
                    <option value="new_build">{t('scopeNewBuild', 'รับสร้างบ้านใหม่บนที่ดิน')}</option>
                  </select>
                </div>

                {/* Customer Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#24211D] block">{t('contactPersonNameLabel', 'ชื่อ-นามสกุล ผู้ติดต่อ:')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('namePlaceholder', 'เช่น คุณสมชาย เจริญสุข')}
                    value={quoteCustomerName}
                    onChange={(e) => setQuoteCustomerName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2 font-medium text-[#24211D] outline-none focus:border-[#C86A39]"
                  />
                </div>

                {/* Customer Phone & LINE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#24211D] block">{t('contactPhoneRequiredLabel', 'เบอร์โทรศัพท์ (จำเป็น):')}</label>
                    <input
                      type="tel"
                      required
                      placeholder="08X-XXX-XXXX"
                      value={quoteCustomerPhone}
                      onChange={(e) => setQuoteCustomerPhone(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2 font-medium text-[#24211D] outline-none focus:border-[#C86A39]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#24211D] block">{t('contactLineIdLabel', 'LINE ID (ถ้ามี):')}</label>
                    <input
                      type="text"
                      placeholder={t('lineIdPlaceholder', 'ไอดีไลน์สำหรับส่งรูปหน้างาน')}
                      value={quoteCustomerLine}
                      onChange={(e) => setQuoteCustomerLine(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2 font-medium text-[#24211D] outline-none focus:border-[#C86A39]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#24211D] block">{t('moreDetailsCurrentStateLabel', 'รายละเอียดเพิ่มเติม / สภาพปัจจุบัน:')}</label>
                  <textarea
                    rows={3}
                    placeholder={t('notesPlaceholder', 'เช่น ต้องการทาสีใหม่ เปลี่ยนกระเบื้องชั้นล่าง รื้อห้องน้ำ 2 ห้อง งบประมาณตั้งไว้ประมาณ 3-5 แสนบาท')}
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl px-3 py-2 font-medium text-[#24211D] outline-none focus:border-[#C86A39]"
                  />
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-[11px] text-[#767067] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  <span>{t('privacyDataAssurance', 'ข้อมูลของคุณจะถูกส่งตรงไปยังวิศวกรของบริษัท ไม่มีการนำไปเปิดเผยกับบุคคลภายนอก')}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE3D9]">
                  <button
                    type="button"
                    onClick={() => setActiveQuoteCompany(null)}
                    className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#EAE3D9] text-[#767067] font-semibold rounded-xl"
                  >
                    {t('cancel', 'ยกเลิก')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuote || !quoteCustomerPhone}
                    className="btn-terracotta px-5 py-2 font-semibold rounded-xl shadow-luxe-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingQuote ? t('submittingQuote', 'กำลังส่งข้อมูล...') : t('confirmRequestQuote', 'ยืนยันขอใบเสนอราคา')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
