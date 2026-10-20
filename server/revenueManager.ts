import fs from 'fs';
import path from 'path';

export interface PaymentSettings {
  promptpayId: string; // Phone or Citizen ID (e.g. 0812345678)
  promptpayName: string; // Account Holder Name
  bankName: string; // Bank name (e.g. ธนาคารกสิกรไทย, ไทยพาณิชย์)
  bankAccountNumber: string; // Account Number
  bankAccountHolder: string; // Account Name
  enablePromptPay: boolean;
  enableStripe: boolean;
  standardPriceThb: number; // 150
  proPriceThb: number; // 299
  referralCommissionPercent: number; // 20%
}

export interface TransactionRecord {
  id: string;
  customerEmail: string;
  customerName: string;
  planTier: 'STANDARD' | 'PRO';
  amountThb: number;
  paymentMethod: 'STRIPE_CARD' | 'PROMPTPAY_QR' | 'BANK_TRANSFER';
  status: 'COMPLETED' | 'PENDING_VERIFICATION';
  slipImage?: string;
  referenceNo: string;
  createdAt: string;
  referrerEmail?: string;
}

export interface RevenueData {
  settings: PaymentSettings;
  transactions: TransactionRecord[];
}

const REVENUE_FILE = path.resolve(process.cwd(), 'server', 'revenue_store.json');

const defaultRevenueData: RevenueData = {
  settings: {
    promptpayId: '081-234-5678',
    promptpayName: 'คุณเกริกพล (PropInvest Admin)',
    bankName: 'ธนาคารกสิกรไทย (KBANK)',
    bankAccountNumber: '045-8-12345-6',
    bankAccountHolder: 'เกริกพล โพธิ์แสง (Posea Kerdphon)',
    enablePromptPay: true,
    enableStripe: true,
    standardPriceThb: 150,
    proPriceThb: 299,
    referralCommissionPercent: 20,
  },
  transactions: [
    {
      id: 'tx_demo_01',
      customerEmail: 'somying.realtor@gmail.com',
      customerName: 'สมหญิง อสังหาฯ พระราม 9',
      planTier: 'PRO',
      amountThb: 299,
      paymentMethod: 'STRIPE_CARD',
      status: 'COMPLETED',
      referenceNo: 'TXN-STRIPE-8921',
      createdAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString('th-TH'),
    },
    {
      id: 'tx_demo_02',
      customerEmail: 'wittaya.agent@gmail.com',
      customerName: 'วิทยา ที่ดินชลบุรี-ระยอง',
      planTier: 'STANDARD',
      amountThb: 150,
      paymentMethod: 'PROMPTPAY_QR',
      status: 'COMPLETED',
      referenceNo: 'TXN-PP-4512',
      createdAt: new Date(Date.now() - 86400000 * 1).toLocaleDateString('th-TH'),
    },
    {
      id: 'tx_demo_03',
      customerEmail: 'chutima.estate@gmail.com',
      customerName: 'ชุติมา Property Consultant',
      planTier: 'PRO',
      amountThb: 299,
      paymentMethod: 'PROMPTPAY_QR',
      status: 'COMPLETED',
      referenceNo: 'TXN-PP-9901',
      createdAt: new Date().toLocaleDateString('th-TH'),
    },
  ],
};

function loadRevenueData(): RevenueData {
  try {
    if (fs.existsSync(REVENUE_FILE)) {
      const raw = fs.readFileSync(REVENUE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read revenue_store.json, using defaults:', e);
  }
  return defaultRevenueData;
}

function saveRevenueData(data: RevenueData): void {
  try {
    fs.writeFileSync(REVENUE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write revenue_store.json:', e);
  }
}

let revenueState: RevenueData = loadRevenueData();

export const getPaymentSettings = (): PaymentSettings => {
  return revenueState.settings;
};

export const updatePaymentSettings = (newSettings: Partial<PaymentSettings>): PaymentSettings => {
  revenueState.settings = {
    ...revenueState.settings,
    ...newSettings,
  };
  saveRevenueData(revenueState);
  return revenueState.settings;
};

export const recordTransaction = (tx: Omit<TransactionRecord, 'id' | 'createdAt'>): TransactionRecord => {
  const newTx: TransactionRecord = {
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toLocaleDateString('th-TH'),
  };
  revenueState.transactions.unshift(newTx);
  saveRevenueData(revenueState);
  return newTx;
};

export const getRevenueStats = () => {
  const totalRevenue = revenueState.transactions.reduce((sum, tx) => sum + tx.amountThb, 0);
  const completedTx = revenueState.transactions.filter((tx) => tx.status === 'COMPLETED');
  const proSubscribers = completedTx.filter((tx) => tx.planTier === 'PRO').length;
  const standardSubscribers = completedTx.filter((tx) => tx.planTier === 'STANDARD').length;
  const mrr = proSubscribers * revenueState.settings.proPriceThb + standardSubscribers * revenueState.settings.standardPriceThb;

  return {
    totalRevenue,
    mrr,
    proSubscribers,
    standardSubscribers,
    totalSubscribers: proSubscribers + standardSubscribers,
    transactions: revenueState.transactions,
    settings: revenueState.settings,
  };
};
