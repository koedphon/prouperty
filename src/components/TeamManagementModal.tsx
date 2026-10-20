import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  CreditCard,
  UserPlus,
  Trash2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Crown,
  Lock,
  ArrowRight,
  UserCheck,
  Mail,
  Calendar,
  Layers,
  ExternalLink,
  QrCode,
  Smartphone,
} from 'lucide-react';
import { TeamData, TeamMember, PlanTier } from '../types/team';
import { isUnlimitedVipUser } from '../utils/vip';
import { useLanguage } from '../i18n/LanguageContext';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamData | null;
  onAddMember: (name: string, email: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onSwitchUser: (userId: string) => Promise<void>;
  onSelectPlan?: (tier: 'FREE' | 'STANDARD' | 'PRO') => Promise<void>;
  user?: any;
  onLogin?: () => void;
  isLoading?: boolean;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  team,
  onAddMember,
  onRemoveMember,
  onSwitchUser,
  onSelectPlan,
  user,
  onLogin,
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingPlan, setIsSwitchingPlan] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    configured: boolean;
    mode: string;
    currency: string;
    acceptedCards: string[];
  } | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<{
    promptpayId: string;
    promptpayName: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    standardPriceThb: number;
    proPriceThb: number;
  } | null>(null);
  const [promptpayModalTier, setPromptpayModalTier] = useState<'STANDARD' | 'PRO' | null>(null);
  const [isConfirmingPromptPay, setIsConfirmingPromptPay] = useState(false);
  const [copiedPP, setCopiedPP] = useState(false);

  useEffect(() => {
    fetch('/api/stripe/status')
      .then((r) => r.json())
      .then((d) => setStripeStatus(d))
      .catch(console.warn);

    fetch('/api/revenue/payment-options')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPaymentOptions(d);
      })
      .catch(console.warn);
  }, []);

  if (!isOpen || !team) return null;

  // Account Kerdphon.posea@gmail.com is the ONLY account with UNLIMITED access (VIP)
  // All other accounts pay normally
  const isVip = isUnlimitedVipUser(user?.email);
  const currentTier: PlanTier = isVip ? 'PRO' : (team.billing.planTier || 'FREE');
  const totalQuota = isVip ? 999999 : (team.quota.totalQuota || (currentTier === 'FREE' ? 10 : currentTier === 'STANDARD' ? 100 : 400));
  const usedQuota = team.quota.usedQuota || 0;
  const remainingQuota = isVip ? 999999 : Math.max(0, totalQuota - usedQuota);
  const quotaPercent = isVip ? 100 : Math.min(100, Math.round((usedQuota / totalQuota) * 100));

  // Plan switch handler
  const handlePlanSelect = async (tier: PlanTier) => {
    // Check Gmail login requirement for ALL packages
    if (!user) {
      setErrorMsg('กรุณาเข้าสู่ระบบด้วยบัญชี Gmail ก่อนสมัครสมาชิกทุกแพ็กเกจ');
      if (onLogin) onLogin();
      return;
    }

    if (isVip) {
      setSuccessMsg('บัญชี kerdphon.posea@gmail.com ได้รับสิทธิ์ VIP ใช้งานได้ไม่จำกัดตลอดชีพอยู่แล้ว');
      setTimeout(() => setSuccessMsg(null), 4000);
      return;
    }

    if (tier === currentTier) return;

    setIsSwitchingPlan(true);
    setErrorMsg(null);
    try {
      if (onSelectPlan) {
        await onSelectPlan(tier);
      } else {
        const res = await fetch('/api/workspace/select-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planTier: tier, email: user.email }),
        });
        const d = await res.json();
        if (!res.ok || !d.success) throw new Error(d.error || 'Failed to select plan');
      }
      setSuccessMsg(`เปลี่ยนเป็นแพ็กเกจ ${tier} สำเร็จ! โควตาวิเคราะห์และบันทึกด้วย AI ปรับเป็น ${tier === 'FREE' ? 10 : tier === 'STANDARD' ? 100 : 400} ครั้ง/เดือน`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'ไม่สามารถเปลี่ยนแพ็กเกจได้');
    } finally {
      setIsSwitchingPlan(false);
    }
  };

  // Stripe Checkout or Sandbox activation handler
  const handleCheckoutPlan = async (tier: 'STANDARD' | 'PRO') => {
    // Check Gmail login requirement for ALL packages
    if (!user) {
      setErrorMsg('กรุณาเข้าสู่ระบบด้วยบัญชี Gmail ก่อนสมัครสมาชิกทุกแพ็กเกจ');
      if (onLogin) onLogin();
      return;
    }

    if (isVip) {
      setSuccessMsg('บัญชี kerdphon.posea@gmail.com ได้รับสิทธิ์ VIP ใช้งานได้ไม่จำกัดตลอดชีพอยู่แล้ว ไม่ต้องชำระเงิน');
      setTimeout(() => setSuccessMsg(null), 4000);
      return;
    }

    setIsCheckingOut(tier);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: team.id,
          adminEmail: user?.email,
          adminName: user?.displayName || user?.email?.split('@')[0],
          planTier: tier,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to checkout');

      if (data.url && !data.team) {
        setSuccessMsg(`กำลังเชื่อมต่อไปยังหน้าชำระเงินที่ปลอดภัยของ Stripe (${tier} Plan)...`);
        setTimeout(() => {
          window.location.href = data.url;
        }, 700);
      } else if (data.team) {
        if (onSelectPlan) {
          await onSelectPlan(tier);
        }
        setSuccessMsg(data.message || `สมัครสมาชิกแพ็กเกจ ${tier === 'STANDARD' ? 'Standard (100 ครั้ง - 150 บาท/เดือน)' : 'Pro (400 ครั้ง - 299 บาท/เดือน)'} เรียบร้อยแล้ว! โควตาพร้อมใช้งานทันที`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเชื่อมต่อระบบชำระเงินได้');
    } finally {
      setIsCheckingOut(null);
    }
  };

  // Open Stripe Customer Portal
  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to open customer portal');
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเปิดหน้าจัดการ Stripe Portal ได้');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleConfirmPromptPay = async () => {
    if (!promptpayModalTier) return;
    if (!user) {
      setErrorMsg('กรุณาเข้าสู่ระบบด้วยบัญชี Gmail ก่อนทำรายการ');
      if (onLogin) onLogin();
      return;
    }
    setIsConfirmingPromptPay(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/payment/promptpay-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          name: user?.displayName || user?.email?.split('@')[0],
          planTier: promptpayModalTier,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to confirm PromptPay');
      if (onSelectPlan) {
        await onSelectPlan(promptpayModalTier);
      }
      setSuccessMsg(data.message || `เปิดใช้งานแพ็กเกจ ${promptpayModalTier} เรียบร้อยแล้ว! โควตาพร้อมใช้งานทันที`);
      setPromptpayModalTier(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'ยืนยันการชำระเงินไม่สำเร็จ');
    } finally {
      setIsConfirmingPromptPay(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) {
      setErrorMsg('กรุณากรอกชื่อและอีเมลของลูกทีม');
      return;
    }

    if (currentTier !== 'PRO') {
      setErrorMsg('การเพิ่มลูกทีมและแชร์ไฟล์ Google Sheet กลาง รองรับเฉพาะแพ็กเกจ Pro (299 บาท/เดือน) กรุณาอัปเกรดเป็น Pro');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await onAddMember(nameInput.trim(), emailInput.trim());
      setSuccessMsg(`เพิ่มที่นั่งลูกทีมสำเร็จ! Stripe ปรับยอดรายเดือนเป็น ฿${team.billing.totalMonthlyThb + 150} บาท/เดือน และเพิ่มโควตากลาง +100 รูป`);
      setNameInput('');
      setEmailInput('');
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถเพิ่มลูกทีมได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!window.confirm(`คุณต้องการนำ "${member.name}" ออกจากทีมหรือไม่?\n- ที่นั่งใน Stripe จะปรับลดลง 1 ที่นั่ง (-150 บาท/เดือน)\n- โควตากองกลางของทีมจะปรับลดลง 100 รูป`)) {
      return;
    }

    setRemovingId(member.id);
    setErrorMsg(null);
    try {
      await onRemoveMember(member.id);
      setSuccessMsg(`นำ ${member.name} ออกจากทีมเรียบร้อยแล้ว (อัปเดต Stripe Quantity เรียบร้อย)`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'ไม่สามารถลบลูกทีมได้');
    } finally {
      setRemovingId(null);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/?joinTeam=${team.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden overscroll-contain animate-in fade-in duration-200">
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#C86A39] text-white flex items-center justify-center shadow-luxe-sm shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-editorial text-base sm:text-xl font-bold text-[#24211D]">
                  {t('teamManagementTitle', 'การสมัครสมาชิก & จัดการทีม (SaaS Subscription & Team)')}
                </h2>
                <span className="text-[10px] font-bold text-[#C86A39] bg-[#F4EFEB] px-2 py-0.5 rounded-full border border-[#EAE3D9]">
                  3 {t('homeCtaPlanBtn', 'แพ็กเกจสมาชิก')}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#767067] truncate">
                {t('teamManagementSubtitle', 'เลือกแพ็กเกจ ฟรี, Standard หรือ Pro (Admin เพิ่มโควต้าลูกทีมและใช้ไฟล์ร่วมกันได้)')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#767067] hover:text-[#24211D] p-2 rounded-xl bg-white hover:bg-[#F4EFEB] border border-[#EAE3D9] transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 shadow-xs shrink-0"
            title={t('closeModal', 'ปิดหน้าต่าง')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* Notifications */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20] px-4 py-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Gmail Login Requirement Notice Banner for All Packages */}
          {!user ? (
            <div className="bg-gradient-to-r from-[#FFF8F3] to-[#FAF5F0] border-2 border-[#C86A39]/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#EAE3D9] flex items-center justify-center p-2.5 shadow-xs shrink-0">
                  <svg className="w-full h-full" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-bold text-[#C86A39] bg-[#FDF6F0] px-2 py-0.5 rounded-full border border-[#F0DFD1]">
                      {t('importantRequirementBadge', 'ข้อกำหนดสำคัญ')}
                    </span>
                    <h4 className="font-editorial text-sm sm:text-base font-bold text-[#24211D]">
                      {t('loginGmailBeforeAllPlansTitle', 'เข้าสู่ระบบบัญชี Gmail ก่อนสมัครสมาชิกทุกแพ็กเกจ')}
                    </h4>
                  </div>
                  <p className="text-xs text-[#767067] mt-0.5">
                    {t('loginGmailAllPlansDesc', 'ทุกแพ็กเกจ (แบบฟรี, Standard, Pro) จำเป็นต้องผูกกับบัญชี Gmail เพื่อรับสิทธิ์โควตา AI และเชื่อมต่อ Google Sheet')}
                  </p>
                </div>
              </div>

              {onLogin && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="btn-terracotta text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
                >
                  <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5">
                    <svg className="w-full h-full" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <span>{t('loginWithGmailNow', 'เข้าสู่ระบบด้วย Gmail ทันที')}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[#E8F5E9]/70 border border-[#C8E6C9] rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                <span className="truncate">
                  {t('loggedInGmailPrefix', 'บัญชี Gmail ที่เข้าสู่ระบบ:')} <strong>{user.displayName || user.email}</strong> ({user.email})
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#2E7D32] bg-white px-2 py-0.5 rounded-full border border-[#C8E6C9] shrink-0 hidden sm:inline">
                {t('accountReadyBadge', '✓ บัญชีพร้อมใช้งาน')}
              </span>
            </div>
          )}

          {/* Owner Unlimited VIP Exclusive Banner */}
          {isVip && (
            <div className="bg-gradient-to-r from-[#8C4A26] via-[#B55B2C] to-[#8C4A26] rounded-3xl p-5 text-white shadow-lg space-y-2 border border-[#EAE3D9]/30 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                    👑
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full inline-block">
                      {t('founderVipAccessBadge', 'Owner Exclusive VIP Access • สิทธิ์ผู้ก่อตั้ง')}
                    </span>
                    <h3 className="font-editorial text-lg sm:text-xl font-bold leading-tight">
                      {t('specialAccountTitle', 'บัญชีสิทธิ์พิเศษ:')} {user?.email || team.adminEmail}
                    </h3>
                  </div>
                </div>

                <span className="text-xs font-bold bg-white text-[#C86A39] px-3.5 py-1.5 rounded-full shadow-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-[#C86A39]" />
                  <span>{t('unlimitedFreeAccessBadge', 'ใช้งานได้ไม่จำกัด (Unlimited Free)')}</span>
                </span>
              </div>

              <p className="text-xs text-white/90 leading-relaxed">
                {t('founderSpecialAccountDetailDesc', 'บัญชี')} <strong>{user?.email || team.adminEmail}</strong> {t('founderSpecialAccountDetailTail', 'เป็นบัญชีเดียวที่ได้รับสิทธิ์พิเศษใช้งาน AI Vision สแกนป้าย, บันทึก Google Sheet, วิเคราะห์การลงทุน และบริหารทีมได้ ไม่จำกัดจำนวนครั้ง ฟรีตลอดชีพ โดยไม่มีค่าใช้จ่าย (บัญชีอื่นคิดค่าบริการตามแพ็กเกจปกติ)')}
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. THREE-TIER PRICING & MEMBERSHIP CARDS (ไฮไลต์ตามคำขอผู้ใช้) */}
          {/* ======================================================== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-editorial text-base sm:text-lg font-bold text-[#24211D] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C86A39]" />
                  <span>{t('subscriptionPlansTitle', 'ตัวเลือกการสมัครสมาชิก (Subscription Plans)')}</span>
                </h3>
                <p className="text-xs text-[#767067]">
                  {t('subscriptionPlansSubtitle', 'โควตารวมการบันทึกโดย AI และวิเคราะห์ด้วย AI ต่อเดือน (ต้องเข้าสู่ระบบบัญชี Gmail ก่อนทุกแพ็กเกจ)')}
                </p>
              </div>

              {/* Current Active Plan Pill */}
              <div className="hidden sm:flex items-center gap-1.5 bg-[#FAF8F5] border border-[#EAE3D9] px-3 py-1.5 rounded-full text-xs">
                <span className="text-[#767067]">{t('yourStatusLabel', 'สถานะของคุณ:')}</span>
                <span className="font-bold text-[#C86A39]">
                  {isVip ? t('vipUnlimitedLabel', '👑 VIP ไม่จำกัด') : currentTier === 'FREE' ? t('freeTier10Times', 'แบบฟรี (10 ครั้ง)') : currentTier === 'STANDARD' ? t('standardTier100Times', 'Standard (100 ครั้ง)') : t('proAdminTier400Times', 'Pro Admin (400+ ครั้ง)')}
                </span>
              </div>
            </div>

            {/* Exclusive VIP & Normal Billing Rule Clarification */}
            <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl px-4 py-2.5 mb-4 text-xs text-[#524B43] flex items-center justify-between flex-wrap gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#C86A39] bg-[#FDF6F0] px-2 py-0.5 rounded-md border border-[#F0DFD1] shrink-0">
                  {t('usageRightsLabel', 'สิทธิ์การใช้งาน')}
                </span>
                <span>
                  {t('billingRuleFounderDesc', 'สำหรับบัญชี Kerdphon.posea@gmail.com เป็น Mail ที่ใช้ได้ไม่จำกัดเพียงบัญชีเดียว ส่วนบัญชีอื่นๆ ชำระค่าบริการตามแพ็กเกจปกติ')}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#C86A39] shrink-0">
                {t('gmailRequiredBeforeAllPlans', '✓ สมัครสมาชิกต้องเข้า Gmail ก่อนทุกแพ็กเกจ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PLAN 1: แบบฟรี (Free Tier) */}
              <div
                className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  !isVip && currentTier === 'FREE'
                    ? 'bg-[#F9FAF8] border-[#2E7D32] ring-2 ring-[#2E7D32]/20 shadow-md'
                    : 'bg-white border-[#EAE3D9] hover:border-[#C86A39]/50 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D32] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full">
                      {t('startFreeBadge', 'เริ่มต้นใช้งานฟรี')}
                    </span>
                    {!isVip && currentTier === 'FREE' && user && (
                      <span className="text-[10px] font-bold text-[#2E7D32] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('currentlyActiveBadge', 'ใช้งานอยู่')}
                      </span>
                    )}
                  </div>

                  <h4 className="font-editorial text-xl font-bold text-[#24211D] mt-2">
                    {t('planFreeTitle', '1. แบบฟรี (Free)')}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-editorial text-3xl font-bold text-[#24211D]">฿0</span>
                    <span className="text-xs text-[#767067]">{t('perMonthUnit', '/ เดือน')}</span>
                  </div>

                  <div className="mt-3 py-2 px-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-xs font-semibold text-[#24211D] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#2E7D32] shrink-0" />
                    <span>{t('quotaPrefix', 'โควตา')} <strong>10 {t('timesPerMonth', 'ครั้ง / เดือน')}</strong></span>
                  </div>

                  <p className="text-[11px] text-[#767067] mt-2 leading-relaxed">
                    {t('freePlanDetailDesc', 'บันทึกโดย AI และวิเคราะห์ด้วย AI เดือนละ 10 ครั้ง หลัง Login Gmail')}
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-[#524B43]">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('freeFeature1', 'สแกนป้ายและดึงข้อมูลด้วย AI 10 ครั้ง/ด.')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('freeFeature2', 'วิเคราะห์การลงทุนและเงินกู้ AI 10 ครั้ง/ด.')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('freeFeature3', 'เข้าสู่ระบบด้วย Gmail เพื่อเปิดใช้งาน')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-[#9A9389]">
                      <X className="w-4 h-4 text-[#B5ABA0] shrink-0 mt-0.5" />
                      <span>{t('freeFeature4', 'ใช้งานคนเดียว (ไม่สามารถเพิ่มลูกทีมได้)')}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  {isVip ? (
                    <div className="w-full py-2.5 bg-[#FAF5F0] text-[#C86A39] font-bold text-center rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#F0DFD1]">
                      <Crown className="w-4 h-4 text-[#C86A39]" />
                      <span>{t('vipAlreadyCovered', 'สิทธิ์ VIP ครอบคลุมแล้ว')}</span>
                    </div>
                  ) : currentTier === 'FREE' && user ? (
                    <div className="w-full py-2.5 bg-[#E8F5E9] text-[#1B5E20] font-bold text-center rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#C8E6C9]">
                      <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                      <span>{t('currentlyActivePlan', 'กำลังใช้งานแพ็กเกจนี้')}</span>
                    </div>
                  ) : !user ? (
                    <button
                      type="button"
                      onClick={onLogin}
                      className="w-full py-2.5 bg-white hover:bg-[#F4EFEB] text-[#24211D] border-2 border-[#C86A39]/40 hover:border-[#C86A39] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      title={t('loginGmailBeforeFree', 'เข้าสู่ระบบด้วยบัญชี Gmail ก่อนสมัคร')}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      </div>
                      <span>{t('loginGmailToStartFree', 'เข้าสู่ระบบ Gmail ก่อนสมัครฟรี')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlanSelect('FREE')}
                      disabled={isSwitchingPlan}
                      className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#F4EFEB] text-[#24211D] border border-[#EAE3D9] hover:border-[#2E7D32] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSwitchingPlan ? t('switchingPlanStatus', 'กำลังสลับ...') : t('selectFreePlanBtn', 'เลือกใช้งานแบบฟรี (10 ครั้ง/ด.)')}
                    </button>
                  )}
                </div>
              </div>

              {/* PLAN 2: Standard Plan (150 บาท/เดือน) */}
              <div
                className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  !isVip && currentTier === 'STANDARD'
                    ? 'bg-[#FDFBFA] border-[#C86A39] ring-2 ring-[#C86A39]/20 shadow-md'
                    : 'bg-white border-[#EAE3D9] hover:border-[#C86A39]/50 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C86A39] bg-[#FDF6F0] px-2.5 py-0.5 rounded-full border border-[#F0DFD1]">
                      {t('forSoloAgentsBadge', 'สำหรับเดี่ยวลุยงาน')}
                    </span>
                    {!isVip && currentTier === 'STANDARD' && user && (
                      <span className="text-[10px] font-bold text-[#C86A39] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('currentlyActiveBadge', 'ใช้งานอยู่')}
                      </span>
                    )}
                  </div>

                  <h4 className="font-editorial text-xl font-bold text-[#24211D] mt-2">
                    {t('standardPlanTitle', '2. Standard Plan')}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-editorial text-3xl font-bold text-[#C86A39]">฿150</span>
                    <span className="text-xs text-[#767067]">{t('perMonthUnit', '/ เดือน')}</span>
                  </div>

                  <div className="mt-3 py-2 px-3 bg-[#FAF8F5] rounded-xl border border-[#EAE3D9] text-xs font-semibold text-[#24211D] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C86A39] shrink-0" />
                    <span>{t('quotaPrefix', 'โควตา')} <strong>100 {t('timesPerMonth', 'ครั้ง / เดือน')}</strong></span>
                  </div>

                  <p className="text-[11px] text-[#767067] mt-2 leading-relaxed">
                    {t('standardPlanDetailDesc', 'บันทึกโดย AI และวิเคราะห์ด้วย AI เดือนละ 100 ครั้ง ราคา 150 บาท')}
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-[#524B43]">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('standardFeature1', 'สแกนป้ายและดึงข้อมูลด้วย AI 100 ครั้ง/ด.')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('standardFeature2', 'วิเคราะห์เจาะลึกผลตอบแทน & สินเชื่อ 100 ครั้ง')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('standardFeature3', 'บันทึกลง Google Sheet ส่วนตัวอัตโนมัติ')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-[#9A9389]">
                      <X className="w-4 h-4 text-[#B5ABA0] shrink-0 mt-0.5" />
                      <span>{t('standardFeature4', 'สิทธิ์เดี่ยว (ไม่สามารถเพิ่มลูกทีมได้)')}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  {isVip ? (
                    <div className="w-full py-2.5 bg-[#FAF5F0] text-[#C86A39] font-bold text-center rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#F0DFD1]">
                      <Crown className="w-4 h-4 text-[#C86A39]" />
                      <span>{t('vipUnlimitedAlready', 'สิทธิ์ VIP ใช้งานได้ไม่จำกัดแล้ว')}</span>
                    </div>
                  ) : currentTier === 'STANDARD' && user ? (
                    <div className="w-full py-2.5 bg-[#FDF6F0] text-[#C86A39] font-bold text-center rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#F0DFD1]">
                      <CheckCircle2 className="w-4 h-4 text-[#C86A39]" />
                      <span>{t('currentlyActiveStandard', 'กำลังใช้งาน Standard')}</span>
                    </div>
                  ) : !user ? (
                    <button
                      type="button"
                      onClick={onLogin}
                      className="w-full py-2.5 bg-white hover:bg-[#FDF6F0] text-[#C86A39] border-2 border-[#C86A39]/40 hover:border-[#C86A39] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      title={t('loginGmailBeforeStandard', 'เข้าสู่ระบบด้วยบัญชี Gmail ก่อนสมัคร')}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      </div>
                      <span>{t('loginGmailToSubscribeStandard', 'เข้าสู่ระบบ Gmail เพื่อสมัคร Standard')}</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleCheckoutPlan('STANDARD')}
                        disabled={isCheckingOut === 'STANDARD'}
                        className="btn-terracotta w-full py-2 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isCheckingOut === 'STANDARD' ? t('connectingStripe', 'กำลังเชื่อมต่อ...') : t('payStripe150', 'ตัดบัตร Stripe ฿150/ด.')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPromptpayModalTier('STANDARD')}
                        className="w-full py-2 bg-white hover:bg-[#FAF8F5] text-[#24211D] border border-[#EAE3D9] hover:border-[#C86A39] text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#003D6B]" />
                        <span>{t('scanPromptPay150', 'สแกน QR พร้อมเพย์ ฿150')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PLAN 3: Pro Plan (299 บาท/เดือน - Admin + Team Extra Seat + Shared File) */}
              <div
                className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  !isVip && currentTier === 'PRO'
                    ? 'bg-gradient-to-b from-[#FAF5F0] to-white border-[#C86A39] ring-2 ring-[#C86A39]/30 shadow-lg'
                    : 'bg-gradient-to-b from-[#FCFBF9] to-white border-[#D5C9B8] hover:border-[#C86A39] shadow-sm'
                }`}
              >
                {/* Popular Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C86A39] text-white px-3 py-0.5 rounded-full text-[10px] font-bold shadow-xs uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-200" />
                  <span>{t('recommendedForTeamsBadge', 'แนะนำ • ทำงานเป็นทีม')}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#C86A39] bg-[#FDF6F0] px-2.5 py-0.5 rounded-full border border-[#F0DFD1]">
                      {t('adminAndTeamBadge', 'Admin & ทีม')}
                    </span>
                    {!isVip && currentTier === 'PRO' && user && (
                      <span className="text-[10px] font-bold text-[#C86A39] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('fullAccessBadge', 'สิทธิ์เต็ม')}
                      </span>
                    )}
                  </div>

                  <h4 className="font-editorial text-xl font-bold text-[#24211D] mt-2 flex items-center gap-1.5">
                    <span>{t('proPlanTitle', '3. Pro Plan')}</span>
                    <Crown className="w-4 h-4 text-[#C86A39]" />
                  </h4>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-editorial text-3xl font-bold text-[#C86A39]">฿299</span>
                    <span className="text-xs text-[#767067]">{t('perMonthUnit', '/ เดือน')}</span>
                  </div>

                  <div className="mt-3 py-2 px-3 bg-[#FDF6F0] rounded-xl border border-[#F0DFD1] text-xs font-semibold text-[#24211D] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#C86A39] shrink-0" />
                    <span>{t('startingQuota', 'โควตาเริ่มต้น')} <strong>400 {t('timesPerMonth', 'ครั้ง / เดือน')}</strong></span>
                  </div>

                  <p className="text-[11px] text-[#767067] mt-2 leading-relaxed">
                    {t('proPlanDetailDesc', 'บันทึกและวิเคราะห์ด้วย AI 400 ครั้ง/ด. เป็น Admin และสามารถ เพิ่มโควต้าลูกทีมได้ใช้ไฟล์ร่วมกันได้')}
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-[#24211D]">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('scanAi400PerMonth', 'บันทึกและวิเคราะห์ด้วย AI 400 ครั้ง/ด.')}</span>
                    </li>
                    <li className="flex items-start gap-2 font-semibold text-[#C86A39]">
                      <Crown className="w-4 h-4 text-[#C86A39] shrink-0 mt-0.5" />
                      <span>{t('adminWorkspaceOwnership', 'สิทธิ์ ADMIN เป็นเจ้าของ Workspace')}</span>
                    </li>
                    <li className="flex items-start gap-2 font-medium">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('addTeamQuotaFeature', 'เพิ่มโควต้าลูกทีมได้: +150 บ./คน (+100 โควตากลาง)')}</span>
                    </li>
                    <li className="flex items-start gap-2 font-medium">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('sharedFilesFeature', 'ใช้ไฟล์ร่วมกันได้: ลูกทีมส่งงานเข้า Sheet ของ Admin')}</span>
                    </li>
                    <li className="flex items-start gap-2 text-[#767067]">
                      <Check className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>{t('stripeProrationFeature', 'Stripe Proration คิดเงินตามวันจริง')}</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  {isVip ? (
                    <div className="w-full py-2.5 bg-[#FAF5F0] text-[#C86A39] font-bold text-center rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#F0DFD1]">
                      <Crown className="w-4 h-4 text-[#C86A39]" />
                      <span>{t('founderVipUnlimited', 'สิทธิ์ VIP ผู้ก่อตั้ง (ใช้งานได้ไม่จำกัด)')}</span>
                    </div>
                  ) : currentTier === 'PRO' && user ? (
                    <div className="w-full py-2.5 bg-[#FAF5F0] text-[#C86A39] font-bold text-center rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#F0DFD1]">
                      <CheckCircle2 className="w-4 h-4 text-[#C86A39]" />
                      <span>{t('activeProAdmin', 'กำลังใช้งาน Pro (Admin)')}</span>
                    </div>
                  ) : !user ? (
                    <button
                      type="button"
                      onClick={onLogin}
                      className="btn-terracotta w-full py-2.5 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      title={t('loginGmailBeforePro', 'เข้าสู่ระบบด้วยบัญชี Gmail ก่อนสมัคร')}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shrink-0">
                        <svg className="w-full h-full" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      </div>
                      <span>{t('loginGmailToSubscribePro', 'เข้าสู่ระบบ Gmail เพื่อสมัคร Pro')}</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleCheckoutPlan('PRO')}
                        disabled={isCheckingOut === 'PRO'}
                        className="btn-terracotta w-full py-2 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isCheckingOut === 'PRO' ? t('connectingStripe', 'กำลังเชื่อมต่อ...') : t('payStripe299', 'ตัดบัตร Stripe ฿299/ด.')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPromptpayModalTier('PRO')}
                        className="w-full py-2 bg-white hover:bg-[#FAF8F5] text-[#24211D] border border-[#EAE3D9] hover:border-[#C86A39] text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#003D6B]" />
                        <span>{t('scanPromptPay299', 'สแกน QR พร้อมเพย์ ฿299')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. SHARED QUOTA & PROGRESS BAR */}
          {/* ======================================================== */}
          <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-xs sm:text-sm text-[#24211D] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#C86A39]" />
                <span>{t('monthlyAiQuotaStatus', 'สถานะโควตาการบันทึกและวิเคราะห์ด้วย AI ประจำเดือน')}</span>
              </span>
              <span className="text-xs font-bold text-[#C86A39]">
                {isVip
                  ? `${t('quotaUsedLabel', 'ใช้งานไปแล้ว')} ${usedQuota} ${t('timesLabel', 'ครั้ง')} (${t('specialQuotaUnlimited', 'สิทธิ์พิเศษ: ไม่จำกัด ∞')})`
                  : `${t('quotaUsedLabel', 'ใช้ไปแล้ว')} ${usedQuota} / ${totalQuota} ${t('timesLabel', 'ครั้ง')} (${t('quotaRemainingLabel', 'คงเหลือ')} ${remainingQuota} ${t('timesLabel', 'ครั้ง')})`}
              </span>
            </div>

            <div className="w-full bg-white rounded-full h-3.5 overflow-hidden border border-[#EAE3D9] p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isVip
                    ? 'bg-gradient-to-r from-[#C86A39] to-amber-500'
                    : quotaPercent >= 90
                    ? 'bg-rose-500'
                    : quotaPercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-[#C86A39]'
                }`}
                style={{ width: `${Math.max(4, quotaPercent)}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-[#767067] pt-0.5">
              {isVip ? (
                <>
                  <span className="text-[#2E7D32] font-semibold">
                    {t('founderVipBenefit', '✓ บัญชีผู้ก่อตั้ง kerdphon.posea@gmail.com ได้รับสิทธิ์ใช้งานไม่จำกัด')}
                  </span>
                  <span className="font-bold text-[#C86A39]">
                    {t('totalQuotaUnlimited', 'โควตารวม: ไม่จำกัด (Unlimited Free)')}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {t('baseTierQuota', 'แพ็กเกจฐาน:')} <strong>{currentTier === 'FREE' ? `10 ${t('timesLabel', 'ครั้ง')}` : currentTier === 'STANDARD' ? `100 ${t('timesLabel', 'ครั้ง')}` : `400 ${t('timesLabel', 'ครั้ง')}`}</strong>
                  </span>
                  {currentTier === 'PRO' && (
                    <span>
                      {t('teamSeatsQuotaPrefix', 'โควตาลูกทีม')} ({team.members.length} {t('seatsUnit', 'ที่นั่ง')}): <strong>+{team.quota.seatsQuota} {t('timesLabel', 'ครั้ง')}</strong>
                    </span>
                  )}
                  <span className="font-bold text-[#24211D]">
                    {t('totalMonthlyQuotaLabel', 'โควตารวมทั้งสิ้น:')} {totalQuota} {t('timesPerMonth', 'ครั้ง/เดือน')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. TEAM COLLABORATION & SHARED GOOGLE SHEET SECTION */}
          {/* (Exclusive for PRO Plan, or locked preview for Free/Standard) */}
          {/* ======================================================== */}
          {currentTier === 'PRO' ? (
            <div className="space-y-5">
              {/* Pro Feature Header */}
              <div className="bg-white border border-[#EAE3D9] rounded-3xl p-5 shadow-luxe space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3D9] pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#C86A39] uppercase tracking-wider block">
                      Admin Workspace & Team Collaboration
                    </span>
                    <h3 className="font-editorial text-lg sm:text-xl font-bold text-[#24211D]">
                      {team.name}
                    </h3>
                    <p className="text-xs text-[#767067] mt-0.5">
                      {t('teamAdminPrefix', 'ผู้ดูแลระบบ (Admin):')} <strong>{team.adminName}</strong> ({team.adminEmail})
                    </p>
                  </div>

                  <div className="bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE3D9] text-right">
                    <span className="text-[10px] text-[#767067] uppercase block font-semibold">{t('totalStripeBilled', 'ยอดเรียกเก็บรวมใน Stripe')}</span>
                    <div className="text-lg font-bold text-[#C86A39] font-editorial">
                      ฿{team.billing.totalMonthlyThb.toLocaleString()} <span className="text-xs font-normal text-[#767067]">{t('perMonthUnit', '/ เดือน')}</span>
                    </div>
                    <span className="text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Base 299 + {team.billing.currentMemberSeats} Seats (฿{team.billing.currentMemberSeats * 150})
                    </span>
                  </div>
                </div>

                {/* Add Team Member Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-editorial text-sm sm:text-base font-bold text-[#24211D] flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-[#C86A39]" />
                        <span>{t('addNewTeamMemberPrompt', 'เพิ่มลูกทีมใหม่ (+1 ที่นั่งใน Stripe 150 บาท/เดือน)')}</span>
                      </h4>
                      <p className="text-xs text-[#767067] mt-0.5">
                        {t('prorationNotice', 'ระบบจะคิดเงินใน Stripe ตามสัดส่วนวัน (Proration) และเพิ่มโควตากลางเข้าบัญชีทันที +100 รูป/เดือน')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F4EFEB] border border-[#EAE3D9] text-[#24211D] text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title={t('copyTeamInviteLink', 'คัดลอกลิงก์เชิญลูกทีม')}
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C86A39]" />}
                      <span>{copiedLink ? t('copiedLabel', 'คัดลอกแล้ว!') : t('copyInviteLink', 'คัดลอกลิงก์เชิญ')}</span>
                    </button>
                  </div>

                  <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder={t('teamMemberNamePlaceholder', 'ชื่อ-นามสกุล หรือ ฉายาลูกทีม (เช่น สมชาย สายสำรวจ)')}
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2 text-xs text-[#24211D] font-medium outline-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <input
                        type="email"
                        placeholder={t('teamMemberEmailPlaceholder', 'อีเมลลูกทีม (เช่น somchai@team.com)')}
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#EAE3D9] focus:border-[#C86A39] rounded-xl px-3.5 py-2 text-xs text-[#24211D] outline-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-terracotta w-full text-xs font-bold py-2 rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isSubmitting ? t('addingMemberButton', 'กำลังบันทึก...') : t('addMemberButton', '+ เพิ่มลูกทีม')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Role Simulator */}
              <div className="bg-white border border-[#EAE3D9] rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#C86A39]" />
                    <h4 className="text-xs sm:text-sm font-bold text-[#24211D]">
                      {t('roleSimulatorHeader', 'ทดสอบมุมมองการทำงาน (Role Simulator)')}
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#767067]">
                    {t('currentlyRolePlaying', 'กำลังสวมบทบาท:')} <strong className="text-[#C86A39]">{team.activeUserName}</strong> ({team.activeUserRole})
                  </span>
                </div>

                <p className="text-xs text-[#767067]">
                  {t('memberScanToAdminSheetNotice', 'เมื่อลูกทีม (Member) สแกนป้าย ข้อมูลจะถูกบันทึกลง Google Sheet กลางของ Admin พร้อมระบุชื่อลูกทีมในคอลัมน์ทันที')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Admin Button */}
                  <button
                    type="button"
                    onClick={() => onSwitchUser(team.adminId)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      team.activeUserId === team.adminId
                        ? 'border-[#C86A39] bg-[#F4EFEB] ring-2 ring-[#C86A39]/20 shadow-xs'
                        : 'border-[#EAE3D9] bg-[#FAF8F5] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#24211D]">{team.adminName}</span>
                      <span className="text-[10px] font-bold text-[#C86A39] bg-white px-2 py-0.5 rounded-full border border-[#EAE3D9]">
                        ADMIN
                      </span>
                    </div>
                    <span className="text-[10px] text-[#767067] block mt-0.5">{t('linkedCentralSheet', 'ผูก Google Sheet กลาง')}</span>
                  </button>

                  {/* Members Buttons */}
                  {team.members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSwitchUser(m.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        team.activeUserId === m.id
                          ? 'border-[#C86A39] bg-[#F4EFEB] ring-2 ring-[#C86A39]/20 shadow-xs'
                          : 'border-[#EAE3D9] bg-[#FAF8F5] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#24211D] truncate">{m.name}</span>
                        <span className="text-[10px] font-bold text-[#2E7D32] bg-white px-2 py-0.5 rounded-full border border-[#EAE3D9]">
                          MEMBER
                        </span>
                      </div>
                      <span className="text-[10px] text-[#767067] block mt-0.5">
                        {t('scannedAlready', 'สแกนแล้ว')} {m.scansCount} {t('propertyUnit', 'ทรัพย์')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-white border border-[#EAE3D9] rounded-3xl overflow-hidden shadow-xs">
                <div className="p-4 bg-[#FAF8F5] border-b border-[#EAE3D9] flex items-center justify-between">
                  <h4 className="font-editorial text-sm font-bold text-[#24211D] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C86A39]" />
                    <span>{t('sharedMembersListTitle', 'รายชื่อสมาชิกที่ใช้ไฟล์ร่วมกัน')} ({team.members.length + 1} {t('personUnit', 'คน')})</span>
                  </h4>
                  <span className="text-xs font-bold text-[#C86A39]">
                    {t('centralQuotaTotal', 'โควตากลางรวม:')} {totalQuota} {t('timesLabel', 'ครั้ง')}
                  </span>
                </div>

                <div className="divide-y divide-[#EAE3D9]">
                  {/* Admin Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3 bg-[#FAF8F5]/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#C86A39] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                        👑
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#24211D]">{team.adminName}</span>
                          <span className="text-[10px] font-bold text-[#C86A39] bg-[#F4EFEB] px-1.5 py-0.2 rounded-full border border-[#EAE3D9]">
                            ADMIN
                          </span>
                        </div>
                        <span className="text-[11px] text-[#767067] block">{team.adminEmail}</span>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[10px] text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                        {t('linkedSheetOwner', 'ผูก Google Sheet เจ้าของทีม')}
                      </span>
                    </div>
                  </div>

                  {/* Members */}
                  {team.members.map((member, idx) => (
                    <div key={member.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE3D9] text-[#24211D] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#24211D]">{member.name}</span>
                            <span className="text-[10px] font-bold text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.2 rounded-full">
                              MEMBER
                            </span>
                          </div>
                          <span className="text-[11px] text-[#767067] block">{member.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <span className="text-[10px] text-[#767067] block">{t('quotaAddedToTeam', 'โควตาที่เพิ่มให้ทีม')}</span>
                          <span className="font-bold text-[#C86A39]">+{100} {t('photosUnit', 'รูป')}</span>
                        </div>

                        <div className="text-right text-xs">
                          <span className="text-[10px] text-[#767067] block">{t('scannedAlready', 'สแกนไปแล้ว')}</span>
                          <span className="font-bold text-[#24211D]">{member.scansCount} {t('propertyUnit', 'ทรัพย์')}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(member)}
                          disabled={removingId === member.id}
                          className="p-1.5 text-[#767067] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title={t('removeMemberTooltip', 'นำออกจากทีม (ลดที่นั่งใน Stripe)')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Locked Team Feature Showcase for Free & Standard */
            <div className="bg-gradient-to-r from-[#FAF8F5] to-[#F4EFEB] border border-[#EAE3D9] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#C86A39]/10 flex items-center justify-center text-[#C86A39]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h4 className="font-editorial text-sm sm:text-base font-bold text-[#24211D]">
                    {t('wantToAddTeamQuestion', 'ต้องการเพิ่มลูกทีมและใช้ไฟล์ Google Sheet ร่วมกัน?')}
                  </h4>
                </div>
                <p className="text-xs text-[#767067] max-w-xl">
                  {t('upgradeToProExplanation', 'แพ็กเกจปัจจุบันของคุณคือสิทธิ์ใช้งานเดี่ยว หากต้องการเพิ่มที่นั่งลูกทีม (+150 บาท/คน ได้โควตากลางเพิ่ม 100 รูป/ที่นั่ง) และให้ลูกทีมบันทึกข้อมูลเข้า Google Sheet ของคุณอัตโนมัติ กรุณาอัปเกรดเป็นแพ็กเกจ Pro')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCheckoutPlan('PRO')}
                disabled={isCheckingOut === 'PRO'}
                className="btn-terracotta text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                <Crown className="w-4 h-4" />
                <span>{isCheckingOut === 'PRO' ? t('connectingStripe', 'กำลังเชื่อมต่อ...') : t('upgradeToProBtn', 'อัปเกรดเป็น Pro (299 บ./ด.)')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#EAE3D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#767067]">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
            <span>{t('securityStripePromptPayNotice', 'เชื่อมต่อระบบความปลอดภัยและชำระเงินตามมาตรฐาน Stripe & PromptPay Thailand')}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-white hover:bg-[#F4EFEB] text-[#24211D] border border-[#EAE3D9] rounded-xl font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            {t('closeDialog', 'ปิดหน้าต่าง')}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PROMPTPAY QR CODE PAYMENT POPUP DIALOG */}
      {/* ======================================================== */}
      {promptpayModalTier && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#EAE3D9] space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#003D6B] text-white flex items-center justify-center font-bold text-xs">
                  PP
                </div>
                <div>
                  <h4 className="font-editorial text-base font-bold text-[#24211D]">
                    {t('scanQrPromptPayTitle', 'สแกน QR พร้อมเพย์ (PromptPay)')}
                  </h4>
                  <span className="text-[10px] text-[#767067]">
                    {t('subscribeTierTitle', 'สมัครแพ็กเกจ')} {promptpayModalTier === 'STANDARD' ? `Standard (100 ${t('photosUnit', 'รูป')})` : `Pro (400 ${t('photosUnit', 'รูป')} + ${t('teamUnit', 'ทีม')})`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPromptpayModalTier(null)}
                className="p-1.5 text-[#767067] hover:text-[#24211D] hover:bg-[#FAF8F5] rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-[#FAF8F5] border border-[#EAE3D9] rounded-2xl p-4 text-center space-y-2.5">
              <div className="inline-block bg-white p-3 rounded-2xl border border-[#EAE3D9] shadow-xs">
                <img
                  src={`https://promptpay.io/${(paymentOptions?.promptpayId || '0812345678').replace(/[^0-9]/g, '')}/${promptpayModalTier === 'STANDARD' ? (paymentOptions?.standardPriceThb || 150) : (paymentOptions?.proPriceThb || 299)}.png`}
                  alt="PromptPay QR Code"
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-[#767067] block">{t('totalPaymentAmount', 'ยอดชำระเงิน')}</span>
                <div className="font-editorial text-2xl font-bold text-[#003D6B]">
                  ฿{promptpayModalTier === 'STANDARD' ? (paymentOptions?.standardPriceThb || 150) : (paymentOptions?.proPriceThb || 299)} {t('thb', 'บาท')}
                </div>
                <span className="text-[11px] font-semibold text-[#24211D] block">
                  {t('accountNameLabel', 'ชื่อบัญชี:')} {paymentOptions?.promptpayName || 'เกริกพล โพธิ์แสง'}
                </span>
              </div>
            </div>

            {/* Bank Transfer Details with Copy */}
            <div className="bg-white border border-[#EAE3D9] rounded-xl p-3 text-xs space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#767067]">{t('promptpayNumberLabel', 'เบอร์พร้อมเพย์:')}</span>
                <div className="flex items-center gap-1.5 font-bold text-[#24211D]">
                  <span>{paymentOptions?.promptpayId || '081-234-5678'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText((paymentOptions?.promptpayId || '0812345678').replace(/[^0-9]/g, ''));
                      setCopiedPP(true);
                      setTimeout(() => setCopiedPP(false), 2000);
                    }}
                    className="p-1 hover:bg-[#FAF8F5] rounded cursor-pointer"
                  >
                    {copiedPP ? <Check className="w-3.5 h-3.5 text-[#2E7D32]" /> : <Copy className="w-3.5 h-3.5 text-[#C86A39]" />}
                  </button>
                </div>
              </div>

              {paymentOptions?.bankAccountNumber && (
                <div className="flex items-center justify-between text-[11px] border-t border-[#EAE3D9]/60 pt-1.5">
                  <span className="text-[#767067]">{t('bankLabel', 'ธนาคาร:')}</span>
                  <span className="font-medium text-[#24211D]">
                    {paymentOptions.bankName} ({paymentOptions.bankAccountNumber})
                  </span>
                </div>
              )}
            </div>

            {/* Confirmation Action */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmPromptPay}
                disabled={isConfirmingPromptPay}
                className="btn-terracotta w-full py-2.5 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{isConfirmingPromptPay ? t('checkingStatus', 'กำลังตรวจสอบ...') : t('confirmPromptPayBtn', 'โอนเงินแล้ว ยืนยันและเปิดใช้งานทันที')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPromptpayModalTier(null)}
                className="w-full py-2 bg-white hover:bg-[#FAF8F5] text-[#767067] text-xs font-medium rounded-xl cursor-pointer"
              >
                {t('cancel', 'ยกเลิก')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
