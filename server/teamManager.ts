import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TeamData, TeamMember, PlanTier } from '../src/types/team';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'workspace_store.json');

// Tier definitions per user brief
export const PLAN_SPECS: Record<PlanTier, {
  name: string;
  price: number;
  baseQuota: number;
  canInviteMembers: boolean;
  desc: string;
}> = {
  FREE: {
    name: 'แบบฟรี (Free Tier)',
    price: 0,
    baseQuota: 10,
    canInviteMembers: false,
    desc: 'บันทึกโดย AI และวิเคราะห์ด้วย AI 10 ครั้ง/เดือน (หลัง Login Gmail)',
  },
  STANDARD: {
    name: 'Standard Plan',
    price: 150,
    baseQuota: 100,
    canInviteMembers: false,
    desc: 'บันทึกโดย AI และวิเคราะห์ด้วย AI 100 ครั้ง/เดือน (150 บาท/เดือน)',
  },
  PRO: {
    name: 'Pro Plan (Admin & Team Collaboration)',
    price: 299,
    baseQuota: 400,
    canInviteMembers: true,
    desc: 'บันทึกและวิเคราะห์ 400 ครั้ง/เดือน (299 บาท/เดือน) สิทธิ์ Admin + เพิ่มลูกทีม Extra Seat และใช้ไฟล์ร่วมกันได้',
  },
};

// Default initial state for guest / unauthenticated visitor
const defaultTeamState: TeamData = {
  id: 'team_propinvest_thai_01',
  name: 'PropInvest Real Estate Workspace',
  adminId: 'usr_guest',
  adminEmail: '',
  adminName: 'ผู้ใช้งานทั่วไป',
  googleSheetId: '',
  googleSheetUrl: '',
  members: [
    {
      id: 'usr_mem_01',
      name: 'สมชาย สายตรวจภาคสนาม',
      email: 'somchai.scout@propinvest.co',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '01/10/2026',
      scansCount: 0,
    },
    {
      id: 'usr_mem_02',
      name: 'กานดา สำรวจที่ดินโซนตะวันออก',
      email: 'kanda.survey@propinvest.co',
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '02/10/2026',
      scansCount: 0,
    },
  ],
  billing: {
    planTier: 'FREE',
    planName: 'แบบฟรี (10 ครั้ง/เดือน)',
    basePriceThb: 0,
    extraSeatPriceThb: 150,
    baseQuota: 10,
    quotaPerSeat: 100,
    currentMemberSeats: 0,
    totalMonthlyThb: 0,
    currency: 'THB',
    stripeCustomerId: '',
    stripeSubscriptionId: '',
    stripeSeatItemId: '',
    nextBillingDate: '01/11/2026',
    prorationEnabled: true,
    canInviteMembers: false,
    isUnlimitedVip: false,
  },
  quota: {
    baseQuota: 10,
    seatsQuota: 0,
    totalQuota: 10,
    usedQuota: 0,
    remainingQuota: 10,
  },
  activeUserId: 'usr_guest',
  activeUserRole: 'ADMIN',
  activeUserName: 'ผู้ใช้งานทั่วไป',
  activeUserEmail: '',
};

// Load saved state or default
let teamState: TeamData = (() => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read workspace store, using default state:', e);
  }
  return defaultTeamState;
})();

const saveState = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(teamState, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save workspace store:', e);
  }
};

// Initialize Stripe if environment key is provided
const getStripeClient = (): Stripe | null => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16' as any,
  });
};

// VIP Unlimited Access for the Owner (Kerdphon.posea@gmail.com is the ONLY account with unlimited access, all others pay normally)
export const UNLIMITED_VIP_EMAIL = 'kerdphon.posea@gmail.com';

export const isUnlimitedVipUser = (email?: string): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === UNLIMITED_VIP_EMAIL.toLowerCase();
};

function recalculateTeam() {
  const isVip = isUnlimitedVipUser(teamState.adminEmail) || isUnlimitedVipUser(teamState.activeUserEmail);

  if (isVip) {
    teamState.billing.planTier = 'PRO';
    teamState.billing.planName = '👑 Owner VIP (ใช้งานได้ไม่จำกัด)';
    teamState.billing.basePriceThb = 0;
    teamState.billing.totalMonthlyThb = 0;
    teamState.billing.canInviteMembers = true;
    teamState.billing.isUnlimitedVip = true;

    teamState.quota.baseQuota = 999999;
    teamState.quota.seatsQuota = teamState.members.length * 100;
    teamState.quota.totalQuota = 999999;
    teamState.quota.usedQuota = teamState.quota.usedQuota || 0;
    teamState.quota.remainingQuota = 999999;
    saveState();
    return;
  }

  teamState.billing.isUnlimitedVip = false;
  const currentTier = teamState.billing.planTier || 'PRO';
  const spec = PLAN_SPECS[currentTier] || PLAN_SPECS.PRO;

  teamState.billing.planTier = currentTier;
  teamState.billing.basePriceThb = spec.price;
  teamState.billing.baseQuota = spec.baseQuota;
  teamState.billing.canInviteMembers = spec.canInviteMembers;

  if (!spec.canInviteMembers) {
    // Single user plans (FREE / STANDARD)
    teamState.billing.currentMemberSeats = 0;
    teamState.billing.totalMonthlyThb = spec.price;
    teamState.billing.planName = spec.name;
    teamState.quota.baseQuota = spec.baseQuota;
    teamState.quota.seatsQuota = 0;
    teamState.quota.totalQuota = spec.baseQuota;
    teamState.quota.remainingQuota = Math.max(0, spec.baseQuota - teamState.quota.usedQuota);
  } else {
    // PRO plan with team seats
    const memberSeats = teamState.members.length;
    const seatsQuota = memberSeats * teamState.billing.quotaPerSeat;
    const totalQuota = spec.baseQuota + seatsQuota;
    const totalMonthlyThb = spec.price + (memberSeats * teamState.billing.extraSeatPriceThb);

    teamState.billing.currentMemberSeats = memberSeats;
    teamState.billing.totalMonthlyThb = totalMonthlyThb;
    teamState.billing.planName = `Pro Plan (400 รูป) + ${memberSeats} Seats`;

    teamState.quota.baseQuota = spec.baseQuota;
    teamState.quota.seatsQuota = seatsQuota;
    teamState.quota.totalQuota = totalQuota;
    teamState.quota.remainingQuota = Math.max(0, totalQuota - teamState.quota.usedQuota);
  }
  saveState();
}

export const getTeam = (): TeamData => {
  recalculateTeam();
  return teamState;
};

// Select Plan Tier (FREE, STANDARD, PRO)
export const selectPlanTier = (tier: PlanTier, resetQuota: boolean = true): TeamData => {
  if (!PLAN_SPECS[tier]) {
    throw new Error('ไม่พบแผนสมาชิกนี้');
  }
  teamState.billing.planTier = tier;
  if (resetQuota) {
    teamState.quota.usedQuota = 0;
  }
  recalculateTeam();
  saveState();
  return teamState;
};

// Update Stripe subscription details upon checkout verification or webhook
export const updateStripeSubscription = (
  tier: PlanTier,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): TeamData => {
  teamState.billing.planTier = tier;
  if (stripeCustomerId) {
    teamState.billing.stripeCustomerId = stripeCustomerId;
  }
  if (stripeSubscriptionId) {
    teamState.billing.stripeSubscriptionId = stripeSubscriptionId;
  }
  teamState.quota.usedQuota = 0;
  recalculateTeam();
  saveState();
  return teamState;
};

// Sync real authenticated Google User with Workspace
export const syncUserWithWorkspace = (profile: { email: string; name?: string; uid?: string }): TeamData => {
  if (!profile.email) return teamState;

  const emailLower = profile.email.toLowerCase().trim();

  // 1. Check if user is an existing MEMBER
  const existingMember = teamState.members.find(m => m.email.toLowerCase() === emailLower);
  if (existingMember) {
    if (profile.name && profile.name !== existingMember.name) {
      existingMember.name = profile.name;
    }
    teamState.activeUserId = existingMember.id;
    teamState.activeUserRole = 'MEMBER';
    teamState.activeUserName = existingMember.name;
    teamState.activeUserEmail = existingMember.email;
    recalculateTeam();
    saveState();
    return teamState;
  }

  // 2. Otherwise user is the ADMIN of their Workspace
  teamState.adminEmail = profile.email;
  teamState.adminName = profile.name || profile.email.split('@')[0];
  if (profile.uid) {
    teamState.adminId = profile.uid;
  }
  if (teamState.activeUserRole === 'ADMIN') {
    teamState.activeUserId = teamState.adminId;
    teamState.activeUserName = teamState.adminName;
    teamState.activeUserEmail = teamState.adminEmail;
  }

  recalculateTeam();
  saveState();
  return teamState;
};

// Reset active user on logout
export const resetUserWorkspace = (): TeamData => {
  teamState.adminId = 'usr_guest';
  teamState.adminEmail = '';
  teamState.adminName = 'ผู้ใช้งานทั่วไป';
  teamState.activeUserId = 'usr_guest';
  teamState.activeUserRole = 'ADMIN';
  teamState.activeUserName = 'ผู้ใช้งานทั่วไป';
  teamState.activeUserEmail = '';
  teamState.billing.planTier = 'FREE';
  teamState.billing.isUnlimitedVip = false;
  teamState.quota.usedQuota = 0;
  recalculateTeam();
  saveState();
  return teamState;
};

export const addTeamMember = async (name: string, email: string): Promise<{ team: TeamData; member: TeamMember; prorationInfo: any }> => {
  if (teamState.billing.planTier !== 'PRO') {
    throw new Error('การเพิ่มลูกทีมและแชร์โควตา/Google Sheet ร่วมกัน รองรับเฉพาะแพ็กเกจ Pro (299 บาท/เดือน) กรุณาอัปเกรดเป็น Pro');
  }

  if (!name || !email) {
    throw new Error('กรุณาระบุชื่อและอีเมลของลูกทีม');
  }

  const existing = teamState.members.find(m => m.email.toLowerCase() === email.toLowerCase());
  if (existing || teamState.adminEmail.toLowerCase() === email.toLowerCase()) {
    throw new Error('อีเมลนี้เป็นสมาชิกในทีมเรียบร้อยแล้ว');
  }

  const stripe = getStripeClient();
  const nextQuantity = teamState.members.length + 1;
  let stripeResult: any = null;

  if (stripe && teamState.billing.stripeSubscriptionId) {
    try {
      // Call Stripe API to update seat quantity with proration
      stripeResult = await stripe.subscriptions.update(teamState.billing.stripeSubscriptionId, {
        items: [
          {
            id: teamState.billing.stripeSeatItemId,
            quantity: nextQuantity,
          },
        ],
        proration_behavior: 'create_prorations',
      });
    } catch (stripeErr: any) {
      console.warn('Stripe Subscription Update Note:', stripeErr.message);
    }
  }

  const newMember: TeamMember = {
    id: `usr_mem_${Date.now()}`,
    name,
    email,
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: new Date().toLocaleDateString('th-TH'),
    scansCount: 0,
  };

  teamState.members.push(newMember);
  recalculateTeam();

  const prorationInfo = {
    addedSeats: 1,
    seatRate: 150,
    newTotalMonthly: teamState.billing.totalMonthlyThb,
    stripeSubscriptionId: teamState.billing.stripeSubscriptionId,
    prorationNotice: 'Stripe คำนวณยอดเงินตามสัดส่วนวันที่เหลือในรอบบิลนี้เรียบร้อยแล้ว (Prorated)',
  };

  return { team: teamState, member: newMember, prorationInfo };
};

export const removeTeamMember = async (memberId: string): Promise<{ team: TeamData; removedName: string }> => {
  const memberIndex = teamState.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    throw new Error('ไม่พบข้อมูลลูกทีมคนนี้');
  }

  const removedName = teamState.members[memberIndex].name;
  teamState.members.splice(memberIndex, 1);

  const stripe = getStripeClient();
  const nextQuantity = teamState.members.length;

  if (stripe && teamState.billing.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.update(teamState.billing.stripeSubscriptionId, {
        items: [
          {
            id: teamState.billing.stripeSeatItemId,
            quantity: nextQuantity,
          },
        ],
        proration_behavior: 'create_prorations',
      });
    } catch (stripeErr: any) {
      console.warn('Stripe Subscription Decrement Note:', stripeErr.message);
    }
  }

  // If active user was the removed member, switch back to Admin
  if (teamState.activeUserId === memberId) {
    teamState.activeUserId = teamState.adminId;
    teamState.activeUserRole = 'ADMIN';
    teamState.activeUserName = teamState.adminName;
    teamState.activeUserEmail = teamState.adminEmail;
  }

  recalculateTeam();
  return { team: teamState, removedName };
};

export const switchActiveUser = (userId: string): TeamData => {
  if (userId === teamState.adminId) {
    teamState.activeUserId = teamState.adminId;
    teamState.activeUserRole = 'ADMIN';
    teamState.activeUserName = teamState.adminName;
    teamState.activeUserEmail = teamState.adminEmail;
    return teamState;
  }

  const member = teamState.members.find(m => m.id === userId);
  if (!member) {
    throw new Error('ไม่พบผู้ใช้งานนี้ในทีม');
  }

  teamState.activeUserId = member.id;
  teamState.activeUserRole = 'MEMBER';
  teamState.activeUserName = member.name;
  teamState.activeUserEmail = member.email;

  return teamState;
};

export const consumeSharedQuota = (count: number = 1): { allowed: boolean; remainingQuota: number; team: TeamData } => {
  recalculateTeam();

  const isVip = isUnlimitedVipUser(teamState.adminEmail) || isUnlimitedVipUser(teamState.activeUserEmail);
  if (isVip) {
    teamState.quota.usedQuota += count;
    teamState.quota.remainingQuota = 999999;
    saveState();
    return {
      allowed: true,
      remainingQuota: 999999,
      team: teamState,
    };
  }

  if (teamState.quota.usedQuota + count > teamState.quota.totalQuota) {
    return {
      allowed: false,
      remainingQuota: teamState.quota.remainingQuota,
      team: teamState,
    };
  }

  teamState.quota.usedQuota += count;
  teamState.quota.remainingQuota = Math.max(0, teamState.quota.totalQuota - teamState.quota.usedQuota);

  // Increment scansCount for active user if member
  if (teamState.activeUserRole === 'MEMBER') {
    const member = teamState.members.find(m => m.id === teamState.activeUserId);
    if (member) member.scansCount += count;
  }

  return {
    allowed: true,
    remainingQuota: teamState.quota.remainingQuota,
    team: teamState,
  };
};

export const updateTeamGoogleSheet = (sheetId: string, sheetUrl: string): TeamData => {
  teamState.googleSheetId = sheetId;
  teamState.googleSheetUrl = sheetUrl;
  return teamState;
};
