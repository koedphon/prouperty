export type UserRole = 'ADMIN' | 'MEMBER';
export type PlanTier = 'FREE' | 'STANDARD' | 'PRO';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  joinedAt: string;
  scansCount: number;
}

export interface TeamBilling {
  planTier: PlanTier;
  planName: string;
  basePriceThb: number; // 0 for FREE, 150 for STANDARD, 299 for PRO
  extraSeatPriceThb: number; // 150 THB per seat (PRO only)
  baseQuota: number; // 10 for FREE, 100 for STANDARD, 400 for PRO
  quotaPerSeat: number; // 100 photos per seat
  currentMemberSeats: number;
  totalMonthlyThb: number; // base + extra seats
  currency: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeSeatItemId: string;
  nextBillingDate: string;
  prorationEnabled: boolean;
  canInviteMembers: boolean;
  isUnlimitedVip?: boolean;
}

export interface TeamQuota {
  baseQuota: number;
  seatsQuota: number;
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
}

export interface TeamData {
  id: string;
  name: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  googleSheetId?: string;
  googleSheetUrl?: string;
  members: TeamMember[];
  billing: TeamBilling;
  quota: TeamQuota;
  activeUserId: string; // Current simulated / active user
  activeUserRole: UserRole;
  activeUserName: string;
  activeUserEmail: string;
}
