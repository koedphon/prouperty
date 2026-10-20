import { BankLoanPackage } from '../types/property';

// Monthly amortization payment calculator
export const calculateMonthlyPayment = (
  principal: number,
  annualInterestRatePercent: number,
  years: number
): number => {
  if (principal <= 0 || years <= 0) return 0;
  if (annualInterestRatePercent <= 0) return Math.round(principal / (years * 12));

  const monthlyRate = annualInterestRatePercent / 100 / 12;
  const numberOfPayments = years * 12;

  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return Math.round(payment);
};

// Raw database of all major Thai commercial and state banks with latest 2026 mortgage packages
export const THAI_BANKS_DATABASE = [
  {
    bankName: 'ธนาคารอาคารสงเคราะห์ (ธอส.)',
    bankCode: 'ghb',
    logoColor: 'from-amber-500 to-orange-600',
    packageName: 'สินเชื่อบ้านสุขใจ เพื่อการลงทุน & ที่อยู่อาศัย',
    avgInterestRate3Years: 2.89,
    rateBreakdown: {
      year1: 1.99,
      year2: 2.99,
      year3: 3.70,
      afterYear3: 'MRR - 1.00% (ปัจจุบัน ~5.90%)',
    },
    maxLTV: 100,
    maxTermYears: 40,
    investorHighlights: [
      'ค่างวดผ่อนต่อเดือนต่ำที่สุดในระบบธนาคารไทย ช่วยดัน Net Cash Flow ให้เป็นบวกสูงสุด',
      'เกณฑ์ประเมินวงเงินยืดหยุ่นสูง รองรับทั้งบ้านเดี่ยว คอนโด และทรัพย์มือสอง',
      'ยกเว้นค่าธรรมเนียมการยื่นกู้ และค่าประเมินราคาหลักทรัพย์ตามโปรโมชัน',
    ],
    specialPerks: 'ผ่อนชำระได้นานสูงสุด 40 ปี ค่างวดล้านละ ~3,600 บาท ในปีแรก',
  },
  {
    bankName: 'ธนาคารออมสิน (GSB)',
    bankCode: 'gsb',
    logoColor: 'from-pink-500 to-rose-600',
    packageName: 'สินเชื่อเคหะ My Home My Love / บ้านเพื่ออนาคต',
    avgInterestRate3Years: 2.99,
    rateBreakdown: {
      year1: 2.19,
      year2: 2.99,
      year3: 3.80,
      afterYear3: 'MRR - 1.25% (ปัจจุบัน ~5.84%)',
    },
    maxLTV: 100,
    maxTermYears: 40,
    investorHighlights: [
      'ฟรีค่าธรรมเนียมจดจำนอง 1% (สูงสุด 200,000 บาท เมื่อทำประกัน MRTA)',
      'อัตราดอกเบี้ยปีแรกคงที่ต่ำ ช่วยล็อกต้นทุนผ่อนชำระในช่วงตั้งตัว 12 เดือนแรก',
      'ไม่คิดค่าธรรมเนียมการจัดการเงินกู้ และให้วงเงินกู้สูงสุด 100% ของราคาประเมิน',
    ],
    specialPerks: 'ฟรีค่าจดจำนอง + ฟรีค่าประเมินหลักทรัพย์ ประหยัดค่าใช้จ่ายวันโอน',
  },
  {
    bankName: 'ธนาคารทหารไทยธนชาต (ttb)',
    bankCode: 'ttb',
    logoColor: 'from-blue-600 to-cyan-600',
    packageName: 'สินเชื่อบ้าน ttb home loan + วงเงินตกแต่ง Top-up',
    avgInterestRate3Years: 3.19,
    rateBreakdown: {
      year1: 2.75,
      year2: 3.10,
      year3: 3.72,
      afterYear3: 'MRR - 1.63% (ปัจจุบัน ~6.20%)',
    },
    maxLTV: 100,
    maxTermYears: 35,
    investorHighlights: [
      'มีวงเงินกู้เสริมเพื่อการตกแต่ง / รีโนเวท (Top-up loan) สูงสุด 10% ของราคาซื้อขาย',
      'เหมาะกับสาย Flipping และ Value-Add ที่ต้องการเงินทุนปรับปรุงบ้านให้ปล่อยเช่าได้ราคาสูงขึ้น',
      'อนุมัติเบื้องต้นรวดเร็วภายใน 3 วันทำการ พร้อมบริการรับเอกสารตรวจสถานที่ถึงที่',
    ],
    specialPerks: 'ได้วงเงินรีโนเวทเพิ่มทันที 10% อนุมัติไว ฟรีค่าเบี้ยประกันอัคคีภัย',
  },
  {
    bankName: 'ธนาคารกรุงไทย (KTB)',
    bankCode: 'ktb',
    logoColor: 'from-sky-500 to-blue-600',
    packageName: 'สินเชื่อบ้าน Krungthai Home Easy / สินเชื่อเพื่อนักลงทุน',
    avgInterestRate3Years: 3.25,
    rateBreakdown: {
      year1: 2.80,
      year2: 3.20,
      year3: 3.75,
      afterYear3: 'MLR - 1.25%',
    },
    maxLTV: 95,
    maxTermYears: 35,
    investorHighlights: [
      'ดอกเบี้ยสม่ำเสมอ ผ่อนสบาย สามารถยื่นกู้ร่วมได้สูงสุดถึง 3 คน',
      'รองรับผู้มีรายได้จากหลายทาง ทั้งงานประจำ อาชีพอิสระ และค่าเช่าทรัพย์เดิม',
    ],
    specialPerks: 'วงเงินกู้สูง ผ่อนนาน 35 ปี ฐานเงินเดือนขั้นต่ำยืดหยุ่น',
  },
  {
    bankName: 'ธนาคารกสิกรไทย (KBank)',
    bankCode: 'kbank',
    logoColor: 'from-emerald-600 to-green-700',
    packageName: 'สินเชื่อบ้านกสิกรไทย (K-Home Loan)',
    avgInterestRate3Years: 3.45,
    rateBreakdown: {
      year1: 2.99,
      year2: 3.40,
      year3: 3.95,
      afterYear3: 'MRR - 1.00%',
    },
    maxLTV: 95,
    maxTermYears: 30,
    investorHighlights: [
      'ระบบอนุมัติเร็ว ประเมินวงเงินเบื้องต้นผ่านแอป K PLUS ได้ทันที',
      'สะสมคะแนน K Point พิเศษเมื่ออนุมัติสินเชื่อบ้าน',
    ],
    specialPerks: 'รู้ผลพรีแอปพรูฟเร็วใน 3 วัน เชื่อมต่อบัญชีสินเชื่อบน K PLUS ได้ตลอด 24 ชม.',
  },
  {
    bankName: 'ธนาคารไทยพาณิชย์ (SCB)',
    bankCode: 'scb',
    logoColor: 'from-purple-600 to-indigo-700',
    packageName: 'สินเชื่อบ้าน SCB Home Loan',
    avgInterestRate3Years: 3.55,
    rateBreakdown: {
      year1: 3.10,
      year2: 3.50,
      year3: 4.05,
      afterYear3: 'MRR - 1.10%',
    },
    maxLTV: 90,
    maxTermYears: 30,
    investorHighlights: [
      'ความคุ้มครองครบวงจร ให้คำปรึกษาด้านการวางแผนภาษีและการถือครองทรัพย์สิน',
      'อัตราดอกเบี้ยทางเลือกคงที่และลอยตัวตามความต้องการบริหารความเสี่ยง',
    ],
    specialPerks: 'สิทธิพิเศษบัตรเครดิต SCB และอัตราดอกเบี้ยพิเศษสำหรับลูกค้า SCB Wealth',
  },
];

// Returns the Top 3 best bank loans ranked specifically for real estate investors on the analysis date
export const getTop3InvestorBanks = (
  propertyPrice: number,
  rentalPrice: number,
  loanPercent: number = 90,
  termYears: number = 30
): {
  top3: BankLoanPackage[];
  allBanks: BankLoanPackage[];
  loanAmount: number;
  currentDateFormatted: string;
} => {
  // Current analysis date format in Thai (e.g. 28 กันยายน 2569)
  const now = new Date();
  const currentDateFormatted = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const baseLoanAmount = Math.round((propertyPrice * loanPercent) / 100);

  const processedBanks = THAI_BANKS_DATABASE.map((bank) => {
    const finalTerm = Math.min(termYears, bank.maxTermYears);
    const effectiveLoan = Math.min(baseLoanAmount, Math.round((propertyPrice * bank.maxLTV) / 100));

    // Calculate monthly payment for promo period (using 3-year avg rate)
    const monthlyInstallmentPromo = calculateMonthlyPayment(
      effectiveLoan,
      bank.avgInterestRate3Years,
      finalTerm
    );

    // Calculate monthly payment after promo (standard rate, estimated ~5.8% - 6.2%)
    const monthlyInstallmentStandard = calculateMonthlyPayment(
      effectiveLoan,
      5.95,
      finalTerm
    );

    // Net Cash Flow: Rental - Monthly Installment
    const netCashFlow = rentalPrice > 0 ? rentalPrice - monthlyInstallmentPromo : -monthlyInstallmentPromo;

    return {
      rank: 0,
      bankName: bank.bankName,
      bankCode: bank.bankCode,
      logoColor: bank.logoColor,
      badge: '',
      packageName: bank.packageName,
      avgInterestRate3Years: bank.avgInterestRate3Years,
      rateBreakdown: bank.rateBreakdown,
      maxLTV: bank.maxLTV,
      maxTermYears: bank.maxTermYears,
      monthlyInstallmentPromo,
      monthlyInstallmentStandard,
      netCashFlow,
      investorHighlights: bank.investorHighlights,
      specialPerks: bank.specialPerks,
      lastUpdatedDate: currentDateFormatted,
    };
  });

  // Sort by lowest 3-year average interest rate (best for investor cash flow)
  processedBanks.sort((a, b) => a.avgInterestRate3Years - b.avgInterestRate3Years);

  // Assign ranks and tailored badges to Top 3
  const top3 = processedBanks.slice(0, 3).map((bank, index) => {
    let badge = '';
    if (index === 0) badge = 'อันดับ 1: ดอกเบี้ยต่ำสุด ผ่อนสบายสุด (Best Cash Flow)';
    else if (index === 1) badge = 'อันดับ 2: ฟรีค่าจดจำนอง วงเงินกู้สูง (Best Value)';
    else if (index === 2) badge = 'อันดับ 3: อนุมัติไว มีวงเงินตกแต่ง Top-up (Best for Renovation)';

    return {
      ...bank,
      rank: index + 1,
      badge,
    };
  });

  return {
    top3,
    allBanks: processedBanks,
    loanAmount: baseLoanAmount,
    currentDateFormatted,
  };
};
