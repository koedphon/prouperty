export interface ContractorReview {
  id: string;
  author: string;
  location: string;
  rating: number; // e.g. 5.0
  comment: string;
  date: string;
  projectType: string; // e.g. 'รีโนเวทบ้านเดี่ยว 2 ชั้น', 'ต่อเติมครัวและโรงรถ'
  verifiedCustomer: boolean;
}

export interface ContractorCompany {
  id: string;
  name: string;
  legalName: string; // ชื่อจดทะเบียน DBD
  registrationNumber: string; // ทะเบียนนิติบุคคล 13 หลัก
  rating: number; // e.g. 4.92
  reviewCount: number; // e.g. 148
  completedProjectsCount: number; // e.g. 260
  warrantyYears: number; // e.g. 5
  warrantyDetails: string; // e.g. 'รับประกันโครงสร้าง 5 ปี งานระบบและสถาปัตย์ 1 ปี'
  specialties: string[];
  highlightBadge: string; // e.g. 'แนะนำอันดับ 1 ในพื้นที่', 'การันตีไม่ทิ้งงาน 100%'
  certifications: string[]; // e.g. ['สมาคมธุรกิจรับสร้างบ้าน (HBA)', 'วิศวกรควบคุม กว. สามัญ', 'ISO 9001:2015']
  guarantees: string[]; // e.g. ['สัญญามาตรฐาน สคบ. ไม่ทิ้งงาน', 'แบ่งจ่าย 6 งวดตามหน้างานจริง', 'ไม่มีเบิกเงินล่วงหน้า']
  priceEstimatePerSqm: {
    renovationMin: number;
    renovationMax: number;
    buildingMin: number;
    buildingMax: number;
  };
  coverageProvinces: string[];
  headquartersProvince: string;
  address: string;
  phone: string;
  secondaryPhone?: string;
  lineId: string;
  websiteUrl: string;
  facebookUrl?: string;
  email: string;
  representative: string;
  workingHours: string;
  currentQueueStatus: 'เปิดรับงานทันที' | 'รับงานได้ใน 7 วัน' | 'รับงานได้ใน 14 วัน';
  lastUpdated: string;
  topReviews: ContractorReview[];
}

export interface ContractorInquiry {
  contractorId: string;
  contractorName: string;
  customerName: string;
  customerPhone: string;
  customerLineId?: string;
  propertyLocation: string;
  propertyType: string;
  areaSizeSqWa?: number;
  scopeOfWork: 'renovation_full' | 'kitchen_extension' | 'interior_turnkey' | 'system_repair' | 'new_build';
  budgetEstimate?: string;
  preferredContactTime: string;
  notes?: string;
}
