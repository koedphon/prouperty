import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  QrCode,
  Share2,
  Copy,
  Check,
  Settings,
  Sparkles,
  ShieldCheck,
  Video,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface OwnerRevenueCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onShowNotification?: (msg: string, type?: 'success' | 'error') => void;
}

export const OwnerRevenueCenterModal: React.FC<OwnerRevenueCenterModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onShowNotification,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'marketing'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Revenue stats state
  const [stats, setStats] = useState<{
    totalRevenue: number;
    mrr: number;
    proSubscribers: number;
    standardSubscribers: number;
    totalSubscribers: number;
    transactions: any[];
    settings: any;
  } | null>(null);

  // Settings form state
  const [formPromptpayId, setFormPromptpayId] = useState('');
  const [formPromptpayName, setFormPromptpayName] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formBankAccountNumber, setFormBankAccountNumber] = useState('');
  const [formBankAccountHolder, setFormBankAccountHolder] = useState('');
  const [formStandardPrice, setFormStandardPrice] = useState(150);
  const [formProPrice, setFormProPrice] = useState(299);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/revenue/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
        if (data.settings) {
          setFormPromptpayId(data.settings.promptpayId || '');
          setFormPromptpayName(data.settings.promptpayName || '');
          setFormBankName(data.settings.bankName || '');
          setFormBankAccountNumber(data.settings.bankAccountNumber || '');
          setFormBankAccountHolder(data.settings.bankAccountHolder || '');
          setFormStandardPrice(data.settings.standardPriceThb || 150);
          setFormProPrice(data.settings.proPriceThb || 299);
        }
      }
    } catch (e) {
      console.warn('Failed to load revenue stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
    if (onShowNotification) onShowNotification(t('copySuccess', 'คัดลอกข้อความสำเร็จ!'), 'success');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/revenue/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptpayId: formPromptpayId,
          promptpayName: formPromptpayName,
          bankName: formBankName,
          bankAccountNumber: formBankAccountNumber,
          bankAccountHolder: formBankAccountHolder,
          standardPriceThb: Number(formStandardPrice),
          proPriceThb: Number(formProPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || t('saveFailed', 'บันทึกไม่สำเร็จ'));
      if (onShowNotification) onShowNotification(t('saveRevenueChannelsSuccess', 'บันทึกข้อมูลช่องทางรับเงินสำเร็จเรียบร้อย!'), 'success');
      fetchStats();
    } catch (err: any) {
      if (onShowNotification) onShowNotification(err.message || t('saveRevenueChannelsFailed', 'บันทึกข้อมูลไม่สำเร็จ'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const publicAppUrl = window.location.origin;

  // Ready-to-use Marketing Content
  const facebookPostCopy = `🚀 นายหน้าและนักลงทุนอสังหาฯ ต้องลอง! เลิกจดป้ายข้างทางด้วยมือได้แล้ว
.
วันนี้ผมใช้ "PropInvest AI" เครื่องมือใหม่ล่าสุดสำหรับคนทำอสังหาฯ 
📱 แค่ยื่นมือถือถ่ายรูปป้ายประกาศขายที่ดิน/บ้านข้างทาง 
✨ AI สกัดข้อมูลเบอร์โทร, ราคา, ขนาดที่ดิน, พิกัด 
📊 เด้งบันทึกลงตาราง Google Sheets ของเราทันทีใน 3 วินาที!
📈 พร้อมระบบวิเคราะห์ราคาประเมินและผลตอบแทนการลงทุนให้อัตโนมัติ
.
👉 เข้าใช้งานได้เลยที่: ${publicAppUrl}
(ทดลองใช้ฟรี 10 ทรัพย์แรก ไม่ต้องติดตั้งแอป สมัครด้วย Gmail ใช้งานได้ทันทีครับ!)`;

  const linePostCopy = `🏢 แนะนำเครื่องมือทุ่นเวลานายหน้าอสังหาฯ ครับ!
ถ่ายรูปป้ายขายที่ดินข้างทาง AI ดึงข้อมูลลง Google Sheet ให้อัตโนมัติ ไม่ต้องพิมพ์เอง
ทดลองใช้ฟรีที่นี่เลยครับ 👉 ${publicAppUrl}`;

  const videoScript = `[ฉากที่ 1: วินาทีที่ 0-5]
(ภาพคนขับรถชะลอข้างทาง เจอป้ายประกาศขายที่ดินติดเสาไฟฟ้า)
เสียงพูด: "เคยไหมครับ? ขับรถสำรวจที่ดิน เจอป้ายประกาศเต็มไปหมด แต่จดเบอร์ไม่ทัน หรือถ่ายรูปไว้เต็มเครื่องแต่ขี้เกียจมานั่งพิมพ์ลงตาราง Excel"

[ฉากที่ 2: วินาทีที่ 6-18]
(ยกมือถือขึ้นมา เข้าเว็บ PropInvest AI กดถ่ายรูปป้าย 1 แชะ)
เสียงพูด: "ตั้งแต่มีตัวนี้ ชีวิตง่ายขึ้นเยอะมาก แค่ยื่นมือถือถ่ายรูปป้ายในเว็บ... ดูนะครับ! AI ดึงราคา ขนาดที่ดิน และเบอร์โทร สรุปออกมาให้ครบเลย"

[ฉากที่ 3: วินาทีที่ 19-30]
(หน้าจอโชว์ข้อมูลเด้งเข้าไปใน Google Sheets แบบอัตโนมัติ)
เสียงพูด: "ที่เจ๋งคือ มันบันทึกลง Google Sheet ของเราทันที จะทำงานคนเดียวหรือให้ลูกทีมช่วยสแกนก็ได้ ทดลองใช้ฟรีได้แล้ววันนี้ ลิงก์อยู่ที่หน้าโปรไฟล์เลยครับ!"`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#EAE3D9] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#24211D] via-[#362F28] to-[#24211D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-[#C86A39] flex items-center justify-center text-white font-bold text-xl shadow-md">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-lg sm:text-xl font-bold">
                  {t('revenueCenterBtn', 'ศูนย์สร้างรายได้ & จัดการเงิน (Owner Revenue Center)')}
                </h3>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  VIP ({userEmail})
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                {t('revenueCenterBtn', 'ศูนย์สร้างรายได้')} • PromptPay / Stripe / Bank
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            title={t('closeModal', 'ปิดหน้าต่าง')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-[#EAE3D9] bg-[#FAF8F5]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#C86A39] text-[#C86A39]'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. {t('revenueSummaryTab', 'สรุปรายได้ & ลูกค้า')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#C86A39] text-[#C86A39]'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>2. {t('paymentSettingsTab', 'ตั้งค่าช่องทางรับเงิน (PromptPay/ธนาคาร)')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('marketing')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'marketing'
                ? 'border-[#C86A39] text-[#C86A39]'
                : 'border-transparent text-[#767067] hover:text-[#24211D]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>3. {t('marketingKitTab', 'ชุดสื่อโปรโมทหาลูกค้า (Marketing Kit)')}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & REVENUE DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-4 rounded-2xl">
                  <span className="text-[11px] text-[#767067] block font-medium">{t('totalCumulativeRevenue', 'รายได้รวมสะสม')}</span>
                  <div className="font-editorial text-2xl font-bold text-[#24211D] mt-1">
                    ฿{(stats?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] text-[#2E7D32] font-semibold mt-1 block">
                    {t('directDepositNotice', '✓ เงินเข้าบัญชีโดยตรง')}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-4 rounded-2xl">
                  <span className="text-[11px] text-[#767067] block font-medium">{t('monthlyRecurringRevenue', 'รายได้ประจำรายเดือน (MRR)')}</span>
                  <div className="font-editorial text-2xl font-bold text-[#C86A39] mt-1">
                    ฿{(stats?.mrr || 0).toLocaleString()} <span className="text-xs text-[#767067]">{t('perMonthShort', '/ด.')}</span>
                  </div>
                  <span className="text-[10px] text-[#767067] mt-1 block">
                    {stats?.totalSubscribers || 0} {t('subscribersCountLabel', 'ผู้สมัครสมาชิก')}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-4 rounded-2xl">
                  <span className="text-[11px] text-[#767067] block font-medium">{t('planPro299Title', 'แพ็กเกจ Pro (299 บ.)')}</span>
                  <div className="font-editorial text-2xl font-bold text-[#24211D] mt-1">
                    {stats?.proSubscribers || 0} <span className="text-xs text-[#767067]">{t('teamUnit', 'ทีม')}</span>
                  </div>
                  <span className="text-[10px] text-[#C86A39] font-medium mt-1 block">
                    ฿{((stats?.proSubscribers || 0) * 299).toLocaleString()} {t('perMonthShort', '/ ด.')}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] border border-[#EAE3D9] p-4 rounded-2xl">
                  <span className="text-[11px] text-[#767067] block font-medium">{t('planStandard150Title', 'แพ็กเกจ Standard (150 บ.)')}</span>
                  <div className="font-editorial text-2xl font-bold text-[#24211D] mt-1">
                    {stats?.standardSubscribers || 0} <span className="text-xs text-[#767067]">{t('peopleUnit', 'คน')}</span>
                  </div>
                  <span className="text-[10px] text-[#767067] font-medium mt-1 block">
                    ฿{((stats?.standardSubscribers || 0) * 150).toLocaleString()} {t('perMonthShort', '/ ด.')}
                  </span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white border border-[#EAE3D9] rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-4 bg-[#FAF8F5] border-b border-[#EAE3D9] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#C86A39]" />
                    <h4 className="font-editorial text-sm font-bold text-[#24211D]">
                      {t('recentTransactionsTitle', 'ประวัติการชำระเงินของลูกค้าล่าสุด')} ({stats?.transactions?.length || 0} {t('itemsUnit', 'รายการ')})
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                    ● Real-Time Log
                  </span>
                </div>

                <div className="divide-y divide-[#EAE3D9]">
                  {stats?.transactions && stats.transactions.length > 0 ? (
                    stats.transactions.map((tx: any) => (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF5F0] border border-[#EAE3D9] flex items-center justify-center font-bold text-xs text-[#C86A39]">
                            {tx.paymentMethod === 'STRIPE_CARD' ? '💳' : '📱'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#24211D]">{tx.customerName}</span>
                              <span className="text-[10px] bg-[#FAF8F5] border border-[#EAE3D9] px-1.5 py-0.2 rounded-full text-[#767067]">
                                {tx.planTier}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#767067] block">{tx.customerEmail}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-bold text-sm text-[#2E7D32]">+฿{tx.amountThb}</span>
                            <span className="text-[10px] text-[#767067] block">
                              {tx.paymentMethod === 'STRIPE_CARD' ? t('stripeCardLabel', 'บัตร Stripe') : 'PromptPay QR'}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#767067] hidden sm:inline">
                            {tx.createdAt}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#767067]">
                      {t('noTransactionsYet', 'ยังไม่มีรายการชำระเงินเข้ามา')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT & PAYOUT SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 text-xs text-[#524B43]">
                💡 <strong>{t('promptpayTipLabel', 'เคล็ดลับ:')}</strong> {t('promptpayTipDesc', 'ลูกค้าในไทยกว่า 80% นิยมสแกน PromptPay QR Code บนมือถือ เมื่อลูกค้าโอนเงินเข้าบัญชีของคุณ ระบบจะเปิดสิทธิ์การใช้งานให้ลูกค้าทันที')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#24211D] block mb-1">
                    {t('promptpayIdLabel', 'เบอร์พร้อมเพย์ หรือ เลขบัตรประชาชน (PromptPay ID)')}
                  </label>
                  <input
                    type="text"
                    value={formPromptpayId}
                    onChange={(e) => setFormPromptpayId(e.target.value)}
                    placeholder={t('promptpayIdPlaceholder', 'เช่น 0812345678 หรือ 1100400123456')}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2.5 text-xs text-[#24211D] font-medium outline-none"
                    required
                  />
                  <span className="text-[10px] text-[#767067] mt-1 block">
                    {t('promptpayIdDesc', 'เบอร์ที่ผูกพร้อมเพย์ไว้สำหรับให้ลูกค้าสแกนจ่ายเงินตรง')}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#24211D] block mb-1">
                    {t('accountNameLabel', 'ชื่อบัญชีพร้อมเพย์ (Account Name)')}
                  </label>
                  <input
                    type="text"
                    value={formPromptpayName}
                    onChange={(e) => setFormPromptpayName(e.target.value)}
                    placeholder={t('accountNamePlaceholder', 'เช่น เกริกพล โพธิ์แสง')}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2.5 text-xs text-[#24211D] font-medium outline-none"
                    required
                  />
                  <span className="text-[10px] text-[#767067] mt-1 block">
                    {t('accountNameDesc', 'ชื่อที่แสดงให้ลูกค้าตรวจสอบความถูกต้องตอนสแกน')}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#24211D] block mb-1">
                    {t('bankNameLabel', 'ธนาคาร (สำหรับรับโอนเงิน)')}
                  </label>
                  <input
                    type="text"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    placeholder={t('bankNamePlaceholder', 'เช่น ธนาคารกสิกรไทย, ไทยพาณิชย์')}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2.5 text-xs text-[#24211D] font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#24211D] block mb-1">
                    {t('bankAccountNumberLabel', 'เลขที่บัญชีธนาคาร')}
                  </label>
                  <input
                    type="text"
                    value={formBankAccountNumber}
                    onChange={(e) => setFormBankAccountNumber(e.target.value)}
                    placeholder={t('bankAccountNumberPlaceholder', 'เช่น 045-8-12345-6')}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2.5 text-xs text-[#24211D] font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#24211D] block mb-1">
                    {t('standardPriceMonthlyLabel', 'ราคาแพ็กเกจ Standard (บาท/เดือน)')}
                  </label>
                  <input
                    type="number"
                    value={formStandardPrice}
                    onChange={(e) => setFormStandardPrice(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2.5 text-xs text-[#24211D] font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#24211D] block mb-1">
                    {t('proPriceMonthlyLabel', 'ราคาแพ็กเกจ Pro (บาท/เดือน)')}
                  </label>
                  <input
                    type="number"
                    value={formProPrice}
                    onChange={(e) => setFormProPrice(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2.5 text-xs text-[#24211D] font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE3D9]">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-terracotta text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? t('savingSettings', 'กำลังบันทึก...') : t('savePayoutSettingsBtn', 'บันทึกการตั้งค่ารับเงิน')}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: READY-TO-USE MARKETING KIT */}
          {activeTab === 'marketing' && (
            <div className="space-y-6">
              {/* Tool 1: Copy-Paste Facebook / Social Media Post */}
              <div className="bg-white border border-[#EAE3D9] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C86A39]" />
                    <h4 className="font-editorial text-sm sm:text-base font-bold text-[#24211D]">
                      {t('marketingFacebookTitle', 'แคปชันโพสต์ Facebook & กลุ่มนายหน้าอสังหาฯ (Copy ไปโพสต์ได้ทันที)')}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(facebookPostCopy, 'fb')}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F4EFEB] border border-[#EAE3D9] text-[#24211D] text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'fb' ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C86A39]" />}
                    <span>{copiedKey === 'fb' ? t('copiedText', 'คัดลอกแล้ว!') : t('copyPostTextBtn', 'คัดลอกข้อความโพสต์')}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-xs text-[#24211D] whitespace-pre-line leading-relaxed font-sans select-all">
                  {facebookPostCopy}
                </div>
              </div>

              {/* Tool 2: Short Script for TikTok / Reels (30 seconds) */}
              <div className="bg-white border border-[#EAE3D9] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#C86A39]" />
                    <h4 className="font-editorial text-sm sm:text-base font-bold text-[#24211D]">
                      {t('marketingVideoTitle', 'สคริปต์ถ่ายคลิปสั้น TikTok / Reels ความยาว 30 วินาที')}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(videoScript, 'video')}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F4EFEB] border border-[#EAE3D9] text-[#24211D] text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'video' ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C86A39]" />}
                    <span>{copiedKey === 'video' ? t('copiedText', 'คัดลอกแล้ว!') : t('copyScriptBtn', 'คัดลอกสคริปต์')}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-xs text-[#24211D] whitespace-pre-line leading-relaxed font-sans">
                  {videoScript}
                </div>
              </div>

              {/* Tool 3: LINE Chat Promo Text */}
              <div className="bg-white border border-[#EAE3D9] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#2E7D32]" />
                    <h4 className="font-editorial text-sm sm:text-base font-bold text-[#24211D]">
                      {t('marketingLineTitle', 'ข้อความแชร์ใน LINE กลุ่มนายหน้าและเพื่อนร่วมงาน')}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(linePostCopy, 'line')}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F4EFEB] border border-[#EAE3D9] text-[#24211D] text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'line' ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C86A39]" />}
                    <span>{copiedKey === 'line' ? t('copiedText', 'คัดลอกแล้ว!') : t('copyLineTextBtn', 'คัดลอกข้อความ LINE')}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-xs text-[#24211D] whitespace-pre-line leading-relaxed font-sans select-all">
                  {linePostCopy}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#EAE3D9] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#767067]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('ownerExclusiveAccessNotice', 'สิทธิ์เข้าถึงเฉพาะบัญชีเจ้าของระบบ: kerdphon.posea@gmail.com')}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-[#F4EFEB] text-[#24211D] border border-[#EAE3D9] rounded-xl font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            {t('closeModal', 'ปิดหน้าต่าง')}
          </button>
        </div>
      </div>
    </div>
  );
};
