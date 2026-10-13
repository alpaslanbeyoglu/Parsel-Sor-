import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

interface AdminRecord {
  id: number;
  text: string;
  lat: number;
  lng: number;
  zoom: number;
  parentId?: number;
  isIstanbul?: boolean;
  yaka?: 'Avrupa' | 'Anadolu' | 'Diger';
}

const ILLER: AdminRecord[] = [
  { id: 341, text: 'İSTANBUL - AVRUPA YAKASI', lat: 41.015, lng: 28.950, zoom: 12, isIstanbul: true, yaka: 'Avrupa' },
  { id: 342, text: 'İSTANBUL - ANADOLU YAKASI', lat: 40.990, lng: 29.100, zoom: 12, isIstanbul: true, yaka: 'Anadolu' },
  { id: 6, text: 'ANKARA', lat: 39.9208, lng: 32.8541, zoom: 10, yaka: 'Diger' },
  { id: 35, text: 'İZMİR', lat: 38.4237, lng: 27.1428, zoom: 10, yaka: 'Diger' },
];

// All 39 Districts categorized into Avrupa (341) and Anadolu (342)
const ILCELER: AdminRecord[] = [
  // --- İSTANBUL AVRUPA YAKASI (parentId: 341) ---
  { id: 34101, parentId: 341, text: 'ARNAVUTKÖY', lat: 41.1833, lng: 28.7333, zoom: 12, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34102, parentId: 341, text: 'AVCILAR', lat: 40.9781, lng: 28.7214, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34103, parentId: 341, text: 'BAĞCILAR', lat: 41.0361, lng: 28.8553, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34104, parentId: 341, text: 'BAHÇELİEVLER', lat: 40.9981, lng: 28.8592, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34105, parentId: 341, text: 'BAKIRKÖY', lat: 40.9791, lng: 28.8742, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34106, parentId: 341, text: 'BAŞAKŞEHİR', lat: 41.0940, lng: 28.8020, zoom: 12, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34107, parentId: 341, text: 'BAYRAMPAŞA', lat: 41.0478, lng: 28.9083, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34108, parentId: 341, text: 'BEŞİKTAŞ', lat: 41.0602, lng: 29.0227, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34109, parentId: 341, text: 'BEYLİKDÜZÜ', lat: 41.0028, lng: 28.6425, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34110, parentId: 341, text: 'BEYOĞLU', lat: 41.0369, lng: 28.9775, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34111, parentId: 341, text: 'BÜYÜKÇEKMECE', lat: 41.0222, lng: 28.5833, zoom: 12, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34112, parentId: 341, text: 'ÇATALCA', lat: 41.4428, lng: 28.4611, zoom: 11, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34113, parentId: 341, text: 'ESENLER', lat: 41.0500, lng: 28.8833, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34114, parentId: 341, text: 'ESENYURT', lat: 41.0264, lng: 28.6781, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34115, parentId: 341, text: 'EYÜPSULTAN', lat: 41.0475, lng: 28.9333, zoom: 12, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34116, parentId: 341, text: 'FATİH', lat: 41.0092, lng: 28.9481, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34117, parentId: 341, text: 'GAZİOSMANPAŞA', lat: 41.0667, lng: 28.9000, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34118, parentId: 341, text: 'GÜNGÖREN', lat: 41.0222, lng: 28.8750, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34119, parentId: 341, text: 'KAĞITHANE', lat: 41.0833, lng: 28.9667, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34120, parentId: 341, text: 'KÜÇÜKÇEKMECE', lat: 41.0000, lng: 28.7833, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34121, parentId: 341, text: 'SARIYER', lat: 41.1668, lng: 29.0500, zoom: 12, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34122, parentId: 341, text: 'SİLİVRİ', lat: 41.0747, lng: 28.2431, zoom: 11, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34123, parentId: 341, text: 'SULTANGAZİ', lat: 41.1000, lng: 28.8667, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34124, parentId: 341, text: 'ŞİŞLİ', lat: 41.0605, lng: 28.9872, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },
  { id: 34125, parentId: 341, text: 'ZEYTİNBURNU', lat: 40.9902, lng: 28.9032, zoom: 13, isIstanbul: true, yaka: 'Avrupa' },

  // --- İSTANBUL ANADOLU (ASYA) YAKASI (parentId: 342) ---
  { id: 34201, parentId: 342, text: 'ADALAR', lat: 40.8767, lng: 29.1292, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34202, parentId: 342, text: 'ATAŞEHİR', lat: 40.9923, lng: 29.1136, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34203, parentId: 342, text: 'BEYKOZ', lat: 41.1214, lng: 29.0983, zoom: 12, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34204, parentId: 342, text: 'ÇEKMEKÖY', lat: 41.0333, lng: 29.1722, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34205, parentId: 342, text: 'KADIKÖY', lat: 40.9819, lng: 29.0576, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34206, parentId: 342, text: 'KARTAL', lat: 40.8894, lng: 29.1856, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34207, parentId: 342, text: 'MALTEPE', lat: 40.9258, lng: 29.1311, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34208, parentId: 342, text: 'PENDİK', lat: 40.8796, lng: 29.2581, zoom: 12, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34209, parentId: 342, text: 'SANCAKTEPE', lat: 41.0000, lng: 29.2333, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34210, parentId: 342, text: 'SULTANBEYLİ', lat: 40.9667, lng: 29.2667, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34211, parentId: 342, text: 'ŞİLE', lat: 41.1744, lng: 29.6128, zoom: 11, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34212, parentId: 342, text: 'TUZLA', lat: 40.8147, lng: 29.3039, zoom: 12, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34213, parentId: 342, text: 'ÜMRANİYE', lat: 41.0232, lng: 29.1158, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },
  { id: 34214, parentId: 342, text: 'ÜSKÜDAR', lat: 41.0256, lng: 29.0427, zoom: 13, isIstanbul: true, yaka: 'Anadolu' },

  // --- DİĞER İLLER ---
  { id: 601, parentId: 6, text: 'ÇANKAYA', lat: 39.8838, lng: 32.8559, zoom: 13, yaka: 'Diger' },
  { id: 3501, parentId: 35, text: 'KONAK', lat: 38.4189, lng: 27.1287, zoom: 13, yaka: 'Diger' },
];

// Explicit authentic neighborhood mappings for major districts
const DISTRICT_NEIGHBORHOODS: Record<number, string[]> = {
  // Fatih (34116)
  34116: [
    'HASEKİ SULTAN MAHALLESİ',
    'AKŞEMSETTİN MAHALLESİ',
    'ALİ KUŞÇU MAHALLESİ',
    'BALAT MAHALLESİ',
    'AYVANSARAY MAHALLESİ',
    'CİBALİ MAHALLESİ',
    'FENER MAHALLESİ',
    'HIRKA-İ ŞERİF MAHALLESİ',
    'İSKENDERPAŞA MAHALLESİ',
    'KARAGÜMRÜK MAHALLESİ',
    'KOCAMUSTAFAPAŞA MAHALLESİ',
    'MEVLANAKAPI MAHALLESİ',
    'MOLLA GÜRANİ MAHALLESİ',
    'NİŞANCA MAHALLESİ',
    'SEYYİD ÖMER MAHALLESİ',
    'SULTAN AHMET MAHALLESİ',
    'ŞEHREMİNİ MAHALLESİ',
    'TOPKAPI MAHALLESİ',
    'YAVUZ SELİM MAHALLESİ',
    'ZEYREK MAHALLESİ',
    'TAHTAKALE MAHALLESİ',
  ],
  // Kadıköy (34205)
  34205: [
    'CAFERAĞA (MODA) MAHALLESİ',
    'FENERBAHÇE MAHALLESİ',
    'CADDEBOSTAN MAHALLESİ',
    'SUADİYE MAHALLESİ',
    'KOZYATAĞI MAHALLESİ',
    'FENERYOLU MAHALLESİ',
    'GÖZTEPE MAHALLESİ',
    'ERENKÖY MAHALLESİ',
    'BOSTANCI MAHALLESİ',
    'ACIBADEM MAHALLESİ',
    'OSMANAĞA MAHALLESİ',
    'RASİMPAŞA MAHALLESİ',
    'MERDİVENKÖY MAHALLESİ',
    'SAHRAYICEDİT MAHALLESİ',
  ],
  // Beşiktaş (34108)
  34108: [
    'LEVENT MAHALLESİ',
    'BEBEK MAHALLESİ',
    'ETİLER MAHALLESİ',
    'CİHANGİR / BARBAROS MAHALLESİ',
    'ORTAKÖY MAHALLESİ',
    'ARNAVUTKÖY MAHALLESİ',
    'BALMUMCU MAHALLESİ',
    'LEVAZIM MAHALLESİ',
    'GAYRETTEPE MAHALLESİ',
    'KURUÇEŞME MAHALLESİ',
    'ULUS MAHALLESİ',
    'VİŞNEZADE MAHALLESİ',
    'YILDIZ MAHALLESİ',
  ],
  // Şişli (34124)
  34124: [
    'TEŞVİKİYE MAHALLESİ',
    'MECİDİYEKÖY MAHALLESİ',
    'ESENTEPE MAHALLESİ',
    'HARBİYE MAHALLESİ',
    'HALASKARGAZİ MAHALLESİ',
    '19 MAYIS MAHALLESİ',
    'FULYA MAHALLESİ',
    'GÜLBAHAR MAHALLESİ',
    'KURTULUŞ (PANGALTI) MAHALLESİ',
    'BOMONTİ MAHALLESİ',
  ],
  // Üsküdar (34214)
  34214: [
    'KUZGUNCUK MAHALLESİ',
    'ÇENGELKÖY MAHALLESİ',
    'ACIBADEM MAHALLESİ',
    'BEYLERBEYİ MAHALLESİ',
    'ALTUNİZADE MAHALLESİ',
    'BULGURLU MAHALLESİ',
    'KANDİLLİ MAHALLESİ',
    'ÇAMLICA MAHALLESİ',
    'BURHANİYE MAHALLESİ',
    'SALACAK MAHALLESİ',
    'İCADİYE MAHALLESİ',
    'KISIKLI MAHALLESİ',
  ],
  // Beyoğlu (34110)
  34110: [
    'CİHANGİR MAHALLESİ',
    'GALATA (ARAPCAMİ) MAHALLESİ',
    'KARAKÖY MAHALLESİ',
    'TAKSİM (GÜMÜŞSUYU) MAHALLESİ',
    'PERA (TEPEBAŞI) MAHALLESİ',
    'TOMTOM MAHALLESİ',
    'ASMALIMESCİT MAHALLESİ',
    'KASIMPAŞA MAHALLESİ',
    'ÖRNEKTEPE MAHALLESİ',
    'HALICIOĞLU MAHALLESİ',
  ],
  // Bakırköy (34105)
  34105: [
    'ATAKÖY 1-2-5. KISIM MAHALLESİ',
    'ATAKÖY 3-4-11. KISIM MAHALLESİ',
    'YEŞİLKÖY MAHALLESİ',
    'YEŞİLYURT MAHALLESİ',
    'FLORYA (ŞENLİKKÖY) MAHALLESİ',
    'ZUHURATBABA MAHALLESİ',
    'KARTALTEPE MAHALLESİ',
    'İNCİRLİ MAHALLESİ',
    'ZEYTİNLİK MAHALLESİ',
  ],
  // Sarıyer (34121)
  34121: [
    'ZEKERİYAKÖY MAHALLESİ',
    'TARABYA MAHALLESİ',
    'İSTİNYE MAHALLESİ',
    'EMİRGAN MAHALLESİ',
    'MASLAK MAHALLESİ',
    'RUMELİHİSARI MAHALLESİ',
    'YENİKÖY MAHALLESİ',
    'KILYOS (KISIRKAYA) MAHALLESİ',
  ],
  // Ataşehir (34202)
  34202: [
    'BARBAROS (FİNANS MERKEZİ) MAHALLESİ',
    'ATATÜRK MAHALLESİ',
    'ESATPAŞA MAHALLESİ',
    'KÜÇÜKKAKKALKÖY MAHALLESİ',
    'İÇERENKÖY MAHALLESİ',
    'KAYIŞDAĞI MAHALLESİ',
    'ÖRNEK MAHALLESİ',
    'FERHATPAŞA MAHALLESİ',
  ],
  // Ümraniye (34213)
  34213: [
    'ATAKENT MAHALLESİ',
    'IHLAMURKUYU MAHALLESİ',
    'ÇAKMAK MAHALLESİ',
    'YAMANEVLER MAHALLESİ',
    'ALTINŞEHİR MAHALLESİ',
    'DUDULLU MAHALLESİ',
    'ESENŞEHİR MAHALLESİ',
    'PARSELLER MAHALLESİ',
    'SARAY MAHALLESİ',
  ],
};

// Fallback generator for districts not explicitly detailed above
const STANDARD_MAHALLE_NAMES = [
  'MERKEZ MAHALLE',
  'CUMHURİYET MAHALLESİ',
  'ATATÜRK MAHALLESİ',
  'YENİ MAHALLE',
  'BAHÇELİEVLER MAHALLESİ',
  'FEVZİ ÇAKMAK MAHALLESİ',
  'SANAYİ MAHALLESİ',
  'İNÖNÜ MAHALLESİ',
  'YAVUZ SELİM MAHALLESİ',
  'SAHİL / YALI MAHALLESİ',
  'BARBAROS MAHALLESİ',
];

const MAHALLELER: AdminRecord[] = [];
ILCELER.forEach((ilce) => {
  const customList = DISTRICT_NEIGHBORHOODS[ilce.id] || STANDARD_MAHALLE_NAMES;
  customList.forEach((name, idx) => {
    const latOffset = ((idx % 3) - 1) * 0.0035;
    const lngOffset = (Math.floor(idx / 3) - 1.5) * 0.004;
    MAHALLELER.push({
      id: ilce.id * 100 + idx + 1,
      parentId: ilce.id,
      text: name,
      lat: Number((ilce.lat + latOffset).toFixed(5)),
      lng: Number((ilce.lng + lngOffset).toFixed(5)),
      zoom: 16,
      isIstanbul: ilce.isIstanbul,
      yaka: ilce.yaka,
    });
  });
});

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function computePolygonMetrics(coords: number[][]): { areaSqm: number; perimeterM: number } {
  if (coords.length < 4) return { areaSqm: 850, perimeterM: 120 };
  const R = 6378137;
  const refLatRad = (coords[0][1] * Math.PI) / 180;
  const cosLat = Math.cos(refLatRad);

  const pts = coords.map(([lng, lat]) => {
    const x = ((lng - coords[0][0]) * Math.PI * R * cosLat) / 180;
    const y = ((lat - coords[0][1]) * Math.PI * R) / 180;
    return [x, y];
  });

  let area2 = 0;
  let perimeter = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    area2 += x1 * y2 - x2 * y1;
    perimeter += Math.hypot(x2 - x1, y2 - y1);
  }
  const areaSqm = Math.round(Math.abs(area2 / 2) * 100) / 100;
  const perimeterM = Math.round(perimeter * 100) / 100;
  return { areaSqm: Math.max(250, areaSqm), perimeterM: Math.max(65, perimeterM) };
}

function generateCadastralParcelFeature(
  mahalleId: number,
  ada: string,
  parsel: string,
  customLat?: number,
  customLng?: number
) {
  let mahalle = MAHALLELER.find((m) => m.id === mahalleId);
  if (!mahalle) {
    mahalle = MAHALLELER.find((m) => m.parentId === mahalleId) || MAHALLELER[0];
  }
  const ilce = ILCELER.find((c) => c.id === mahalle.parentId) || ILCELER[0];
  const il = ILLER.find((p) => p.id === ilce.parentId) || ILLER[0];

  const seed = hashString(`${mahalle.id}-${ada}-${parsel}`);
  const adaNum = parseInt(ada, 10) || 124;
  const parselNum = parseInt(parsel, 10) || 8;

  const offsetLat = customLat !== undefined
    ? 0
    : (((seed % 200) - 100) * 0.00003) + ((adaNum % 10) * 0.00012);
  const offsetLng = customLng !== undefined
    ? 0
    : ((((seed >> 8) % 200) - 100) * 0.000035) + ((parselNum % 10) * 0.00014);

  const centerLat = Number(((customLat ?? mahalle.lat) + offsetLat).toFixed(6));
  const centerLng = Number(((customLng ?? mahalle.lng) + offsetLng).toFixed(6));

  const widthMeters = 22 + (seed % 38);
  const heightMeters = 26 + ((seed >> 4) % 42);
  const angleDeg = (seed % 30) - 15;
  const angleRad = (angleDeg * Math.PI) / 180;

  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

  const halfW = widthMeters / 2;
  const halfH = heightMeters / 2;

  const localCorners: Array<[number, number]> = [
    [-halfW, -halfH],
    [halfW, -halfH + (seed % 4)],
    [halfW - 3, halfH],
    [-halfW, halfH],
  ];

  const ring: number[][] = localCorners.map(([x, y]) => {
    const rx = x * Math.cos(angleRad) - y * Math.sin(angleRad);
    const ry = x * Math.sin(angleRad) + y * Math.cos(angleRad);
    const lng = Number((centerLng + rx / metersPerDegLng).toFixed(6));
    const lat = Number((centerLat + ry / metersPerDegLat).toFixed(6));
    return [lng, lat];
  });
  ring.push([...ring[0]]);

  const { areaSqm, perimeterM } = computePolygonMetrics(ring);

  const nitelikList = [
    'Arsa (İmar Parseli)',
    'Kargir Apartman ve Arsası',
    'Ticari İmarlı Arsa',
    'Konut İmarlı Arsa (Emsal 2.00)',
    'Rezidans / Ticaret İmarlı',
  ];
  const mevkiiList = [
    'Merkez İmar Bölgesi',
    'Prestij Cadde Üzeri',
    'Kentsel Dönüşüm Sahası',
    'Ana Arter Cepheli',
  ];

  const nitelik = nitelikList[seed % nitelikList.length];
  const mevkii = mevkiiList[(seed >> 3) % mevkiiList.length];
  const pafta = `J${21 + (il.id % 10)}-C-${12 + (adaNum % 20)}-D`;

  const koseKoordinatlari = ring.slice(0, -1).map(([lng, lat], idx) => ({
    no: idx + 1,
    lat,
    lng,
  }));

  return {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [ring],
    },
    properties: {
      id: `${mahalle.id}-${ada}-${parsel}`,
      ilId: il.id,
      ilAd: il.text,
      ilceId: ilce.id,
      ilceAd: ilce.text,
      mahalleId: mahalle.id,
      mahalleAd: mahalle.text,
      adaNo: String(ada),
      parselNo: String(parsel),
      alan: areaSqm,
      alanFormatted: new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(areaSqm) + ' m²',
      nitelik,
      mevkii,
      pafta,
      zeminKmdurum: 'Kat Mülkiyetli / Müteahhitlik Proje Alanı',
      ozet: `${il.text} / ${ilce.text} / ${mahalle.text} - Ada: ${ada} Parsel: ${parsel}`,
      cevreUzunlugu: perimeterM,
      merkezEnlem: centerLat,
      merkezBoylam: centerLng,
      sorguTarihi: new Date().toISOString(),
      kaynak: 'TKGM-CBS-Simulasyon' as const,
      koseKoordinatlari,
    },
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.use('/api', (_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  app.get('/api/tkgm/iller', (_req, res) => {
    res.json({ status: 'ok', data: ILLER });
  });

  app.get('/api/tkgm/ilceler/:ilId', (req, res) => {
    const ilId = Number(req.params.ilId);
    const matches = ILCELER.filter((c) => c.parentId === ilId);
    res.json({ status: 'ok', data: matches });
  });

  app.get('/api/tkgm/mahalleler/:ilceId', (req, res) => {
    const ilceId = Number(req.params.ilceId);
    let matches = MAHALLELER.filter((m) => m.parentId === ilceId);
    if (matches.length === 0) {
      const parentDist = ILCELER.find((c) => c.id === ilceId);
      matches = [
        {
          id: ilceId * 100 + 1,
          parentId: ilceId,
          text: 'MERKEZ MAHALLE',
          lat: parentDist?.lat || 41.0082,
          lng: parentDist?.lng || 28.9784,
          zoom: 16,
          isIstanbul: true,
        },
      ];
    }
    res.json({ status: 'ok', data: matches });
  });

  app.get('/api/tkgm/parsel/:mahalleId/:ada/:parsel', (req, res) => {
    const mahalleId = Number(req.params.mahalleId);
    const ada = String(req.params.ada || '124').trim();
    const parsel = String(req.params.parsel || '8').trim();

    if (!mahalleId || !ada || !parsel) {
      res.status(400).json({ status: 'error', message: 'Mahalle, Ada ve Parsel zorunludur.' });
      return;
    }

    const feature = generateCadastralParcelFeature(mahalleId, ada, parsel);
    res.json({ status: 'ok', feature });
  });

  app.get('/api/tkgm/koordinat', (req, res) => {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ status: 'error', message: 'Geçerli enlem ve boylam gerekli.' });
      return;
    }

    let nearestMahalle = MAHALLELER[0];
    let minDistance = Infinity;
    for (const m of MAHALLELER) {
      const d = Math.hypot(m.lat - lat, m.lng - lng);
      if (d < minDistance) {
        minDistance = d;
        nearestMahalle = m;
      }
    }

    const gridLat = Math.floor(lat * 3000);
    const gridLng = Math.floor(lng * 3000);
    const seed = Math.abs(gridLat * 37 + gridLng * 19);
    const ada = String(100 + (seed % 900));
    const parsel = String(1 + (seed % 45));

    const feature = generateCadastralParcelFeature(nearestMahalle.id, ada, parsel, lat, lng);
    res.json({ status: 'ok', feature });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TKGM Parsel Pro Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
