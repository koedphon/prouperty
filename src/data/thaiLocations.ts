import { AreaBenchmark, ComparableProperty, PropertyItem } from '../types/property';

export const THAI_PROVINCES: string[] = [
  'กรุงเทพมหานคร',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'สมุทรสาคร',
  'นครปฐม',
  'ชลบุรี',
  'ระยอง',
  'เชียงใหม่',
  'ภูเก็ต',
  'ขอนแก่น',
  'นครราชสีมา',
  'สงขลา',
  'สุราษฎร์ธานี',
  'ประจวบคีรีขันธ์',
  'พระนครศรีอยุธยา',
];

// Comprehensive benchmark data across key provinces and popular investment districts
export const DEFAULT_PROVINCE_BENCHMARKS: Record<string, Partial<AreaBenchmark>> = {
  'กรุงเทพมหานคร': {
    avgMarketPricePerSqWa: 95000,
    landDepartmentAppraisalPerSqWa: 75000,
    households: 2840000,
    populationDensity: 'หนาแน่นสูงมาก (3,600 คน/ตร.กม.)',
    growthTrend: 'การเติบโตต่อเนื่องตามแนวรถไฟฟ้าและศูนย์กลางธุรกิจ',
    dominantPropertyType: 'คอนโดมิเนียม / ทาวน์โฮม',
    targetDemographic: 'พนักงานบริษัทเอกชน, นักลงทุน, ผู้บริหารรุ่นใหม่',
  },
  'นนทบุรี': {
    avgMarketPricePerSqWa: 48000,
    landDepartmentAppraisalPerSqWa: 38000,
    households: 560000,
    populationDensity: 'หนาแน่นสูง (2,050 คน/ตร.กม.)',
    growthTrend: 'การขยายตัวของชุมชนเมืองตามแนวรถไฟฟ้าสายสีม่วงและสีชมพู',
    dominantPropertyType: 'บ้านเดี่ยว / ทาวน์โฮม',
    targetDemographic: 'ครอบครัวขยาย, คนทำงานในเมืองที่ต้องการพื้นที่พักอาศัย',
  },
  'ปทุมธานี': {
    avgMarketPricePerSqWa: 32000,
    landDepartmentAppraisalPerSqWa: 24000,
    households: 490000,
    populationDensity: 'หนาแน่นปานกลาง-สูง (800 คน/ตร.กม.)',
    growthTrend: 'ศูนย์กลางมหาวิทยาลัย ตลาดไท และนิคมอุตสาหกรรม',
    dominantPropertyType: 'ทาวน์เฮ้าส์ / หอพัก / ที่ดินจัดสรร',
    targetDemographic: 'นักศึกษา, บุคลากรมหาวิทยาลัย, พนักงานโรงงานอุตสาหกรรม',
  },
  'สมุทรปราการ': {
    avgMarketPricePerSqWa: 42000,
    landDepartmentAppraisalPerSqWa: 34000,
    households: 620000,
    populationDensity: 'หนาแน่นสูง (1,300 คน/ตร.กม.)',
    growthTrend: 'โซนสนามบินสุวรรณภูมิ ทางด่วนบูรพาวิถี และรถไฟฟ้าสายสีเขียว',
    dominantPropertyType: 'ทาวน์โฮม / บ้านเดี่ยว / โกดังคลังสินค้า',
    targetDemographic: 'คนทำงานสายการบิน, นิคมบางปู/บางพลี, พลเมืองชานเมือง',
  },
  'ชลบุรี': {
    avgMarketPricePerSqWa: 45000,
    landDepartmentAppraisalPerSqWa: 35000,
    households: 710000,
    populationDensity: 'หนาแน่นปานกลาง (350 คน/ตร.กม.)',
    growthTrend: 'เขตพัฒนาพิเศษภาคตะวันออก (EEC) นิคมอุตสาหกรรมและการท่องเที่ยว',
    dominantPropertyType: 'คอนโดตากอากาศ / ทาวน์โฮม / บ้านเดี่ยว',
    targetDemographic: 'วิศวกรโรงงาน, ชาวต่างชาติ (Expat), นักท่องเที่ยว',
  },
  'เชียงใหม่': {
    avgMarketPricePerSqWa: 38000,
    landDepartmentAppraisalPerSqWa: 28000,
    households: 750000,
    populationDensity: 'ปานกลาง (85 คน/ตร.กม.)',
    growthTrend: 'เมืองท่องเที่ยว ศูนย์กลางภาคเหนือ ดิจิทัลโนแมด',
    dominantPropertyType: 'บ้านเดี่ยวสไตล์รีสอร์ต / พูลวิลล่า / คอนโด',
    targetDemographic: 'ผู้เกษียณอายุ, นักท่องเที่ยวระยะยาว, นักธุรกิจท้องถิ่น',
  },
  'ระยอง': {
    avgMarketPricePerSqWa: 35000,
    landDepartmentAppraisalPerSqWa: 26000,
    households: 340000,
    populationDensity: 'ปานกลาง (210 คน/ตร.กม.)',
    growthTrend: 'ศูนย์กลางปิโตรเคมีและอุตสาหกรรมยานยนต์ EV',
    dominantPropertyType: 'ทาวน์โฮม / บ้านเดี่ยว',
    targetDemographic: 'พนักงานกลุ่ม ปตท., โรงกลั่น, นิคมมาบตาพุด',
  },
  'ภูเก็ต': {
    avgMarketPricePerSqWa: 82000,
    landDepartmentAppraisalPerSqWa: 62000,
    households: 250000,
    populationDensity: 'หนาแน่น (780 คน/ตร.กม.)',
    growthTrend: 'เมืองท่องเที่ยวระดับโลก กำลังซื้อต่างชาติสูง',
    dominantPropertyType: 'พูลวิลล่าหรู / ลักชัวรี่คอนโด',
    targetDemographic: 'นักลงทุนต่างชาติ (ยุโรป/รัสเซีย/จีน), กลุ่มผู้มีรายได้สูง',
  },
  'ขอนแก่น': {
    avgMarketPricePerSqWa: 28000,
    landDepartmentAppraisalPerSqWa: 20000,
    households: 620000,
    populationDensity: 'ปานกลาง (165 คน/ตร.กม.)',
    growthTrend: 'Medical Hub และ Smart City ศูนย์กลางการศึกษาอีสาน',
    dominantPropertyType: 'บ้านเดี่ยว / ทาวน์โฮม',
    targetDemographic: 'แพทย์ บุคลากร ม.ขอนแก่น ข้าราชการ',
  },
};

export const getBenchmarkForProperty = (property: PropertyItem): AreaBenchmark => {
  const province = property.province || 'กรุงเทพมหานคร';
  const found = DEFAULT_PROVINCE_BENCHMARKS[province] || {
    avgMarketPricePerSqWa: 30000,
    landDepartmentAppraisalPerSqWa: 22000,
    households: 350000,
    populationDensity: 'ปานกลาง (250 คน/ตร.กม.)',
    growthTrend: 'การเติบโตตามการขยายตัวของชุมชนและถนนสายหลัก',
    dominantPropertyType: 'บ้านเดี่ยว / อาคารพาณิชย์',
    targetDemographic: 'คนท้องถิ่น, พ่อค้าแม่ค้า, พนักงานองค์กรท้องถิ่น',
  };

  // Adjust slightly based on district/subdistrict if present
  let multiplier = 1.0;
  const locString = `${property.district} ${property.subDistrict} ${property.village}`.toLowerCase();
  if (locString.includes('เมือง') || locString.includes('สาทร') || locString.includes('สุขุมวิท') || locString.includes('พญาไท')) {
    multiplier = 1.35;
  } else if (locString.includes('บาง') || locString.includes('พระราม') || locString.includes('ศรีราชา')) {
    multiplier = 1.15;
  }

  const baseMarket = (found.avgMarketPricePerSqWa || 35000) * multiplier;
  const baseAppraisal = (found.landDepartmentAppraisalPerSqWa || 26000) * multiplier;

  return {
    province: property.province || 'ไม่ระบุ',
    district: property.district || 'ไม่ระบุ',
    subDistrict: property.subDistrict || 'ไม่ระบุ',
    avgMarketPricePerSqWa: Math.round(baseMarket),
    landDepartmentAppraisalPerSqWa: Math.round(baseAppraisal),
    households: found.households || 350000,
    populationDensity: found.populationDensity || 'ปานกลาง',
    growthTrend: found.growthTrend || 'ขยายตัวปานกลาง',
    dominantPropertyType: found.dominantPropertyType || property.propertyType || 'ที่อยู่อาศัย',
    targetDemographic: found.targetDemographic || 'ครอบครัวและผู้พักอาศัยในพื้นที่',
  };
};

// Generates nearby comparable properties for investor market comparison
export const generateNearbyComps = (property: PropertyItem, benchmark: AreaBenchmark): ComparableProperty[] => {
  const currentPricePerSqWa = property.pricePerSqWa || (property.areaSize > 0 ? property.price / property.areaSize : benchmark.avgMarketPricePerSqWa);
  const baseArea = property.areaSize || 50;

  const comps: ComparableProperty[] = [
    {
      id: 'comp-1',
      title: `${property.propertyType || 'บ้าน'} ในโครงการใกล้เคียง (ทำเลติดถนนหลัก)`,
      subDistrict: property.subDistrict || benchmark.subDistrict || 'บริเวณใกล้เคียง',
      distanceKm: 0.8,
      propertyType: property.propertyType || 'บ้านเดี่ยว',
      areaSize: Math.round(baseArea * 1.05),
      price: Math.round(Math.round(baseArea * 1.05) * benchmark.avgMarketPricePerSqWa * 1.08),
      pricePerSqWa: Math.round(benchmark.avgMarketPricePerSqWa * 1.08),
      differencePercent: 0,
      features: 'สภาพพร้อมอยู่ ตกแต่งครบ ใกล้ทางเข้าโครงการ',
    },
    {
      id: 'comp-2',
      title: `${property.propertyType || 'ทรัพย์สิน'} แปลงหัวมุม ซอยถัดไป`,
      subDistrict: property.subDistrict || benchmark.subDistrict || 'บริเวณใกล้เคียง',
      distanceKm: 1.4,
      propertyType: property.propertyType || 'บ้านเดี่ยว',
      areaSize: Math.round(baseArea * 0.95),
      price: Math.round(Math.round(baseArea * 0.95) * benchmark.avgMarketPricePerSqWa * 0.96),
      pricePerSqWa: Math.round(benchmark.avgMarketPricePerSqWa * 0.96),
      differencePercent: 0,
      features: 'บ้านเดิมต้องรีโนเวทบางส่วน เข้าซอย 200 เมตร',
    },
    {
      id: 'comp-3',
      title: `โครงการเปิดใหม่ โซนสถานีรถไฟฟ้า/ถนนใหญ่`,
      subDistrict: property.district || benchmark.district || 'บริเวณใกล้เคียง',
      distanceKm: 2.5,
      propertyType: property.propertyType || 'บ้านเดี่ยว',
      areaSize: Math.round(baseArea * 1.1),
      price: Math.round(Math.round(baseArea * 1.1) * benchmark.avgMarketPricePerSqWa * 1.22),
      pricePerSqWa: Math.round(benchmark.avgMarketPricePerSqWa * 1.22),
      differencePercent: 0,
      features: 'บ้านใหม่มือ 1 มีคลับเฮ้าส์ สระว่ายน้ำ รปภ. 24 ชม.',
    },
  ];

  // Calculate percentage difference relative to our property's price per sq.wah
  return comps.map(c => {
    const diff = currentPricePerSqWa > 0
      ? Math.round(((c.pricePerSqWa - currentPricePerSqWa) / currentPricePerSqWa) * 100)
      : 0;
    return {
      ...c,
      differencePercent: diff,
    };
  });
};
