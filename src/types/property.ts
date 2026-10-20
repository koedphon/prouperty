export interface PropertyMediaItem {
  id: string;
  url: string; // Google Drive webViewLink or direct URL or blob/dataUrl
  type: 'image' | 'video';
  fileId?: string; // Google Drive file ID
  fileName?: string;
  thumbnailUrl?: string; // thumbnail or direct preview
  sizeBytes?: number;
  dateAdded?: string;
  isCover?: boolean;
}

export interface PropertyItem {
  id: string;
  image?: string;
  mediaFiles?: PropertyMediaItem[]; // Up to 10 photos & videos per property
  propertyType: string;
  country: string;
  province: string;
  district: string;
  subDistrict: string;
  village: string;
  houseNumber: string;
  mapLink: string;
  price: number;
  rentalPrice: number;
  appraisedPrice: number;
  areaSize: number; // in sq.wah
  pricePerSqWa: number;
  contactNumber: string;
  highlights?: string;
  ocrRawText?: string;
  dateAdded?: string;
  uploaderName?: string; // Recorded by member / team collaborator
  sheetRowIndex?: number; // for Google Sheets 1-indexed row position
  latitude?: number;
  longitude?: number;
  googleMapData?: GoogleMapData;
}

export interface GoogleMapData {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  roadName: string;
  subDistrict: string;
  district: string;
  province: string;
  satelliteTileUrl: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  streetViewEmbedUrl: string;
  roadBearing: number; // 0 = North, 90 = East, 180 = South, 270 = West
  frontageWidthMeters?: number;
  depthMeters?: number;
  solarAngles?: {
    morning: { azimuth: number; altitude: number; label: string };
    noon: { azimuth: number; altitude: number; label: string };
    afternoon: { azimuth: number; altitude: number; label: string };
    sunset: { azimuth: number; altitude: number; label: string };
  };
  nearbyPOIs: Array<{
    name: string;
    category: 'transit' | 'shopping' | 'road' | 'hospital' | 'school';
    distanceKm: number;
  }>;
  surroundingPlots?: Array<{
    x: number;
    z: number;
    w: number;
    d: number;
    h: number;
    type: 'residential' | 'commercial' | 'greenery' | 'road';
  }>;
}

export interface AreaBenchmark {
  province: string;
  district: string;
  subDistrict: string;
  avgMarketPricePerSqWa: number;
  landDepartmentAppraisalPerSqWa: number;
  households: number;
  populationDensity: string;
  growthTrend: string;
  dominantPropertyType: string;
  targetDemographic: string;
}

export interface ComparableProperty {
  id: string;
  title: string;
  subDistrict: string;
  distanceKm: number;
  propertyType: string;
  areaSize: number;
  price: number;
  pricePerSqWa: number;
  differencePercent: number; // relative to our property: positive means comp is more expensive
  features: string;
}

export interface AIAnalysisResult {
  investmentScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  verdict: string;
  rentalYield: number;
  priceGapAnalysis: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  strategyRecommendation: {
    bestStrategy: string;
    targetNegotiationPrice: number;
    negotiationTactics: string[];
    estimatedHoldingPeriodMonths: number;
    targetAudience: string;
  };
  estimatedRenovationBudget: string;
  investorNotes: string;
  bankLoanAdvice?: {
    recommendedBank: string;
    monthlyInstallment: number;
    netMonthlyCashFlow: number;
    financingTips: string[];
  };
}

export interface BankLoanPackage {
  rank: number;
  bankName: string;
  bankCode: string;
  logoColor: string;
  badge: string;
  packageName: string;
  avgInterestRate3Years: number;
  rateBreakdown: {
    year1: number;
    year2: number;
    year3: number;
    afterYear3: string;
  };
  maxLTV: number;
  maxTermYears: number;
  monthlyInstallmentPromo: number;
  monthlyInstallmentStandard: number;
  netCashFlow: number;
  investorHighlights: string[];
  specialPerks: string;
  lastUpdatedDate: string;
}
