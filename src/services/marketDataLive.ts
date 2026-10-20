export interface LiveBankPackage {
  rank: number;
  bankCode: string;
  bankName: string;
  packageName: string;
  avgInterestRate3Years: number;
  rateBreakdown?: {
    year1: number;
    year2: number;
    year3: number;
    afterYear3: string;
  };
  maxLTV: number;
  maxTermYears: number;
  badge: string;
  specialPerks: string;
  investorHighlights: string[];
}

export interface BankRateReference {
  bankName: string;
  bankCode: string;
  mrr: number;
  mlr: number;
  mor: number;
  effectiveDate: string;
}

export interface BotLtvRule {
  contract: string;
  label: string;
  priceUnder10M: string;
  priceOver10M: string;
  topupLoanAllowed: string;
  notes: string;
}

export interface LiveMarketData {
  province: string;
  lastUpdated: string;
  botPolicyRate: number;
  botStatusText: string;
  avgMarketPricePerSqWa: number;
  landDepartmentAppraisalPerSqWa: number;
  growthTrend: string;
  populationDensity: string;
  households: number;
  targetDemographic: string;
  dominantPropertyType: string;
  rentalYieldBenchmark: {
    singleHouse: number;
    townhome: number;
    condo: number;
  };
  topBanks: LiveBankPackage[];
  allBanks: LiveBankPackage[];
  bankRateReferences: BankRateReference[];
  botLtvRules: BotLtvRule[];
  dsrThreshold: {
    salaryUnder30k: string;
    salaryOver30k: string;
    investorPortfolioCriteria: string;
  };
  autoUpdated: boolean;
  sourceVerified: string;
}

const CACHE_KEY_PREFIX = 'prop_live_market_v2_';

/**
 * Automatically fetch live market benchmark and mortgage data from server
 */
export async function fetchLiveMarketData(
  province: string = 'กรุงเทพมหานคร',
  forceRefresh: boolean = false
): Promise<LiveMarketData> {
  const cacheKey = `${CACHE_KEY_PREFIX}${province}`;

  // Check client cache if not forcing refresh (cache for 10 minutes)
  if (!forceRefresh) {
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
          return cached.data as LiveMarketData;
        }
      }
    } catch {
      // ignore
    }
  }

  const response = await fetch('/api/market-data/live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ province, forceRefresh }),
  });

  if (!response.ok) {
    throw new Error('ไม่สามารถอัปเดตข้อมูลตลาดและสินเชื่อล่าสุดได้');
  }

  const result = await response.json();
  if (result.success && result.data) {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: result.data, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }
    return result.data as LiveMarketData;
  }

  throw new Error(result.error || 'ข้อมูลตอบกลับไม่ถูกต้อง');
}
