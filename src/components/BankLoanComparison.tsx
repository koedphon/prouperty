import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { PropertyItem } from '../types/property';
import { getTop3InvestorBanks, calculateMonthlyPayment } from '../data/thaiBanks';
import { fetchLiveMarketData, LiveMarketData } from '../services/marketDataLive';
import { useLanguage } from '../i18n/LanguageContext';

interface BankLoanComparisonProps {
  property: PropertyItem;
}

export const BankLoanComparison: React.FC<BankLoanComparisonProps> = ({ property }) => {
  const { t } = useLanguage();
  const [loanPercent, setLoanPercent] = useState<number>(90);
  const [termYears, setTermYears] = useState<number>(30);
  const [showAllBanks, setShowAllBanks] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<LiveMarketData | null>(null);
  const [isUpdatingLive, setIsUpdatingLive] = useState(false);

  const price = property.price || 0;
  const rentalPrice = property.rentalPrice || 0;

  // Auto-fetch live verified rates for the property's province
  useEffect(() => {
    let isMounted = true;
    setIsUpdatingLive(true);
    fetchLiveMarketData(property.province || t('bangkokProvince', 'กรุงเทพมหานคร'), false)
      .then((data) => {
        if (isMounted) setLiveData(data);
      })
      .catch((err) => {
        console.warn('Live bank data load note:', err);
      })
      .finally(() => {
        if (isMounted) setIsUpdatingLive(false);
      });

    return () => {
      isMounted = false;
    };
  }, [property.province]);

  const { top3: defaultTop3, allBanks: defaultAllBanks, loanAmount, currentDateFormatted } = getTop3InvestorBanks(
    price,
    rentalPrice,
    loanPercent,
    termYears
  );

  const formatNumber = (num: number) => (num ? Number(num).toLocaleString() : '0');

  // Compute live banks if liveData is present
  const liveBanks = React.useMemo(() => {
    const sourceBanks = liveData?.topBanks && liveData.topBanks.length > 0 ? liveData.topBanks : defaultTop3;

    return sourceBanks.map((b: any, i: number) => {
      const finalTerm = Math.min(termYears, b.maxTermYears || 40);
      const effectiveLoan = Math.min(loanAmount, Math.round((price * (b.maxLTV || 100)) / 100));
      const monthlyPromo = calculateMonthlyPayment(effectiveLoan, b.avgInterestRate3Years, finalTerm);
      const netCash = rentalPrice > 0 ? rentalPrice - monthlyPromo : -monthlyPromo;

      return {
        rank: i + 1,
        bankCode: b.bankCode,
        bankName: b.bankName,
        packageName: b.packageName,
        avgInterestRate3Years: b.avgInterestRate3Years,
        maxLTV: b.maxLTV || 100,
        maxTermYears: b.maxTermYears || 40,
        badge: b.badge || `${t('rankPrefix', 'อันดับ')} ${i + 1}`,
        specialPerks: b.specialPerks,
        investorHighlights: b.investorHighlights || [],
        monthlyInstallmentPromo: monthlyPromo,
        netCashFlow: netCash,
      };
    });
  }, [liveData, defaultTop3, loanAmount, price, rentalPrice, termYears]);

  // Compute all banks live
  const liveAllBanks = React.useMemo(() => {
    const sourceAll = liveData?.allBanks && liveData.allBanks.length > 0 ? liveData.allBanks : defaultAllBanks;

    return sourceAll.map((b: any, idx: number) => {
      const finalTerm = Math.min(termYears, b.maxTermYears || 35);
      const effectiveLoan = Math.min(loanAmount, Math.round((price * (b.maxLTV || 95)) / 100));
      const monthlyPromo = calculateMonthlyPayment(effectiveLoan, b.avgInterestRate3Years, finalTerm);
      const standardRate = b.avgInterestRate3Years + 2.5; // post-promo floating rate
      const monthlyStandard = calculateMonthlyPayment(effectiveLoan, standardRate, finalTerm);
      const netCash = rentalPrice > 0 ? rentalPrice - monthlyPromo : -monthlyPromo;

      return {
        ...b,
        rank: idx + 1,
        monthlyInstallmentPromo: monthlyPromo,
        monthlyInstallmentStandard: monthlyStandard,
        netCashFlow: netCash,
      };
    });
  }, [liveData, defaultAllBanks, loanAmount, price, rentalPrice, termYears]);

  const activeTop3 = liveBanks;
  const activeDate = liveData?.lastUpdated || currentDateFormatted;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE3D9] shadow-luxe space-y-6">
      
      {/* Header with Live Automated Date */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#EAE3D9] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#C86A39] text-white flex items-center justify-center shadow-xs">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#24211D] tracking-tight">
                {t('bestBanksCompareTitle', 'เปรียบเทียบการกู้เงิน 3 ธนาคารไทยที่ดีที่สุดสำหรับนักลงทุน')}
              </h3>
              <p className="text-xs text-[#767067]">
                {t('bestBanksCompareSub', 'ระบบอัปเดตอัตราดอกเบี้ยและค่างวดอัตโนมัติแบบเรียลไทม์ คำนวณตรงกับราคาทรัพย์นี้')}
              </p>
            </div>
          </div>
        </div>

        {/* Live Date Badge with Auto-Update status */}
        <div className="inline-flex items-center gap-2 bg-[#E8F5E9] border border-[#C8E6C9] text-[#2E7D32] px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-ping" />
          <span>{t('autoUpdateLabel', 'อัปเดตสดอัตโนมัติ:')} {activeDate}</span>
        </div>
      </div>

      {/* Interactive Loan Parameter Controls */}
      <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-[#24211D] uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-[#C86A39]" />
            {t('simulatorTitle', 'เครื่องคำนวณค่างวดผ่อน & สัดส่วนเงินกู้ (Mortgage Simulator)')}
          </span>
          <span className="text-xs text-[#767067]">
            {t('calculatedLoanAmount', 'วงเงินกู้คำนวณ:')} <strong className="text-sm font-bold text-[#C86A39]">฿{formatNumber(loanAmount)}</strong> ({loanPercent}% {t('ofPriceLabel', 'ของราคาขาย')} ฿{formatNumber(price)})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* 1. Loan % Slider & Presets */}
          <div>
            <div className="flex justify-between items-center text-xs text-[#767067] mb-1.5">
              <span>{t('ltvRatioLabel', 'สัดส่วนวงเงินกู้ (LTV):')}</span>
              <span className="font-bold text-[#C86A39] text-sm">{loanPercent}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={loanPercent}
              onChange={(e) => setLoanPercent(Number(e.target.value))}
              className="w-full h-3 sm:h-2 bg-[#EAE3D9] rounded-lg appearance-none cursor-pointer accent-[#C86A39]"
            />
            <div className="flex justify-between gap-1.5 mt-2.5">
              {[80, 85, 90, 95, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setLoanPercent(pct)}
                  className={`flex-1 py-2 sm:py-1 rounded-xl text-xs font-bold transition-all min-h-[40px] sm:min-h-0 flex items-center justify-center cursor-pointer active:scale-95 ${
                    loanPercent === pct
                      ? 'btn-terracotta shadow-xs'
                      : 'bg-white text-[#767067] hover:text-[#24211D] border border-[#EAE3D9]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* 2. Loan Term Years */}
          <div>
            <div className="flex justify-between items-center text-xs text-[#767067] mb-1.5">
              <span>{t('termYearsLabel', 'ระยะเวลาผ่อนชำระ:')}</span>
              <span className="font-bold text-[#24211D] text-sm">{termYears} {t('unitYears', 'ปี')} ({termYears * 12} {t('installmentsCount', 'งวด')})</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="5"
              value={termYears}
              onChange={(e) => setTermYears(Number(e.target.value))}
              className="w-full h-3 sm:h-2 bg-[#EAE3D9] rounded-lg appearance-none cursor-pointer accent-[#C86A39]"
            />
            <div className="flex justify-between gap-1.5 mt-2.5">
              {[15, 20, 25, 30, 40].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setTermYears(yr)}
                  className={`flex-1 py-2 sm:py-1 rounded-xl text-xs font-bold transition-all min-h-[40px] sm:min-h-0 flex items-center justify-center cursor-pointer active:scale-95 ${
                    termYears === yr
                      ? 'btn-terracotta shadow-xs'
                      : 'bg-white text-[#767067] hover:text-[#24211D] border border-[#EAE3D9]'
                  }`}
                >
                  {yr} {t('unitYears', 'ปี')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Bank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {activeTop3.map((bank) => {
          const isRank1 = bank.rank === 1;
          const isPositiveFlow = bank.netCashFlow > 0;

          return (
            <div
              key={bank.bankCode}
              className={`rounded-2xl p-5 relative flex flex-col justify-between transition-all bg-[#FAF8F5] border ${
                isRank1
                  ? 'border-2 border-[#C86A39] shadow-luxe-sm'
                  : 'border-[#EAE3D9] hover:border-[#C86A39]'
              }`}
            >
              <div>
                {/* Header Rank Badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isRank1
                      ? 'bg-[#C86A39] text-white'
                      : 'bg-[#F4EFEB] text-[#24211D] border border-[#EAE3D9]'
                  }`}>
                    {bank.badge}
                  </span>
                  <span className="text-[10px] text-[#8A847C]">{t('rankPrefix', 'อันดับ')} #{bank.rank}</span>
                </div>

                <h4 className="font-editorial text-base font-bold text-[#24211D] leading-tight">{bank.bankName}</h4>
                <p className="text-xs text-[#767067] mt-0.5">{bank.packageName}</p>

                {/* Key Numbers Box */}
                <div className="mt-4 bg-white p-4 rounded-xl border border-[#EAE3D9] space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#767067]">{t('avgInterestRate3Years', 'ดบ. เฉลี่ย 3 ปีแรก')}:</span>
                    <span className="text-xl font-bold text-[#C86A39]">
                      {bank.avgInterestRate3Years}% <span className="text-xs font-normal text-[#767067]">{t('perYearShort', '/ปี')}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1.5 border-t border-[#EAE3D9]">
                    <span className="text-xs text-[#767067]">{t('first3YearsMonthly', 'ค่างวดผ่อน 3 ปีแรก')}:</span>
                    <span className="text-base font-bold text-[#24211D]">
                      ฿{formatNumber(bank.monthlyInstallmentPromo)} <span className="text-xs font-normal text-[#767067]">{t('perMonthShort', '/ด.')}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1.5 border-t border-[#EAE3D9]">
                    <span className="text-xs text-[#767067]">{t('netCashFlowLabel', 'กระแสเงินสดสุทธิ (Net)')}:</span>
                    <span className={`text-sm font-bold ${isPositiveFlow ? 'text-[#2E7D32]' : 'text-[#767067]'}`}>
                      {rentalPrice > 0
                        ? isPositiveFlow
                          ? `+฿${formatNumber(bank.netCashFlow)}${t('perMonthShort', '/ด.')}`
                          : `-฿${formatNumber(Math.abs(bank.netCashFlow))}${t('perMonthShort', '/ด.')}`
                        : t('dependsOnRent', 'ขึ้นอยู่กับค่าเช่า')}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="mt-3 text-xs text-[#767067] space-y-1.5 font-sans">
                  {(bank.investorHighlights || []).map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#2E7D32] font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Special Promotion Highlight */}
              <div className="mt-4 pt-3 border-t border-[#EAE3D9] text-xs text-[#C86A39] font-medium">
                <span>{t('specialBenefits', 'สิทธิประโยชน์:')} {bank.specialPerks}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show All Banks Expand Button */}
      <div className="text-center pt-1">
        <button
          onClick={() => setShowAllBanks(!showAllBanks)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C86A39] hover:text-[#B55B2C] bg-[#FAF8F5] hover:bg-[#F4EFEB] border border-[#EAE3D9] px-4 py-2 rounded-xl transition-all cursor-pointer"
        >
          <span>{showAllBanks ? t('hideOtherBanks', 'ซ่อนธนาคารอื่นๆ') : t('viewAllBanksTable', 'ดูตารางเปรียบเทียบธนาคารพาณิชย์ไทยทั้งหมด (KTB, KBANK, SCB...)')}</span>
          {showAllBanks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Table for all banks */}
      {showAllBanks && (
        <div className="overflow-x-auto border border-[#EAE3D9] rounded-2xl animate-in fade-in duration-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#767067] font-semibold border-b border-[#EAE3D9] uppercase text-[10px]">
              <tr>
                <th className="p-3">{t('bankName', 'ธนาคาร')}</th>
                <th className="p-3">{t('packageNameHeader', 'ชื่อแพ็กเกจสินเชื่อ')}</th>
                <th className="p-3 text-center">{t('avg3YrRateHeader', 'ดบ. เฉลี่ย 3 ปี')}</th>
                <th className="p-3 text-center">{t('maxLtvHeader', 'LTV สูงสุด')}</th>
                <th className="p-3 text-right">{t('promoInstallmentHeader', 'ค่างวดผ่อน 3 ปีแรก')}</th>
                <th className="p-3 text-right">{t('standardInstallmentHeader', 'ค่างวดหลังจากนั้น')}</th>
                <th className="p-3 text-center">Net Cash Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3D9] bg-white">
              {liveAllBanks.map((b: any, idx: number) => {
                const isPositive = b.netCashFlow > 0;
                return (
                  <tr key={b.bankCode} className={idx < 3 ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'}>
                    <td className="p-3 font-semibold text-[#24211D] flex items-center gap-1.5">
                      {idx < 3 && <span className="text-[10px] bg-[#C86A39] text-white font-bold px-1.5 py-0.2 rounded">Top {idx + 1}</span>}
                      <span>{b.bankName}</span>
                    </td>
                    <td className="p-3 text-[#767067] max-w-[200px] truncate" title={b.packageName}>
                      {b.packageName}
                    </td>
                    <td className="p-3 text-center font-bold text-[#C86A39]">
                      {b.avgInterestRate3Years}%
                    </td>
                    <td className="p-3 text-center text-[#24211D]">
                      {b.maxLTV}%
                    </td>
                    <td className="p-3 text-right font-bold text-[#24211D]">
                      ฿{formatNumber(b.monthlyInstallmentPromo)}
                    </td>
                    <td className="p-3 text-right text-[#767067]">
                      ฿{formatNumber(b.monthlyInstallmentStandard)}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {rentalPrice > 0 ? (
                        <span className={isPositive ? 'text-[#2E7D32]' : 'text-rose-600'}>
                          {isPositive ? `+฿${formatNumber(b.netCashFlow)}` : `-฿${formatNumber(Math.abs(b.netCashFlow))}`}
                        </span>
                      ) : (
                        <span className="text-[#8A847C]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Investor Tip Footer */}
      <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 text-xs text-[#24211D] flex items-start gap-2.5">
        <Sparkles className="w-5 h-5 text-[#C86A39] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold text-[#24211D]">
            {t('mortgageOptStrategyTitle', 'กลยุทธ์การบริหารสินเชื่อเพื่อการลงทุน (Mortgage Optimization):')}
          </strong>
          <p className="leading-relaxed text-[#767067]">
            1. <strong>{t('refinanceEvery3YearsTitle', 'รีไฟแนนซ์ (Refinance) ทุก 3 ปี:')}</strong> {t('refinanceEvery3YearsDesc', 'ดอกเบี้ยโปรโมชัน 3 ปีแรกจะถูกกว่าดอกเบี้ยลอยตัวเกือบ 2.5% - 3.0% เมื่อครบ 3 ปีให้ยื่นขอ Retention กับธนาคารเดิมหรือ Refinance ไปธนาคารใหม่ทันทีเพื่อล็อกต้นทุนดอกเบี้ยต่ำไว้ตลอดการถือครอง')}
          </p>
          <p className="leading-relaxed text-[#767067]">
            2. <strong>{t('topUpLoanOptionTitle', 'การเลือกใช้วงเงิน Top-up:')}</strong> {t('topUpLoanOptionDesc', 'หากทรัพย์ต้องมีการรีโนเวทเพื่อเพิ่มค่าเช่า ธนาคารที่มีแพ็กเกจสินเชื่อตกแต่งพ่วง (เช่น ttb) จะช่วยลดการดึงเงินสดสำรองของนักลงทุน')}
          </p>
        </div>
      </div>

    </div>
  );
};
