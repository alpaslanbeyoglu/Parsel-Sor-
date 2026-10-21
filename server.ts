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

const ILCELER: AdminRecord[] = [
  // Avrupa (341)
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

  // Anadolu (342)
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

  // Diger
  { id: 601, parentId: 6, text: 'ÇANKAYA', lat: 39.8838, lng: 32.8559, zoom: 13, yaka: 'Diger' },
  { id: 3501, parentId: 35, text: 'KONAK', lat: 38.4189, lng: 27.1287, zoom: 13, yaka: 'Diger' },
];

const DISTRICT_NEIGHBORHOODS: Record<number, string[]> = {
  34116: ['HASEKİ SULTAN', 'AKŞEMSETTİN', 'BALAT', 'CİBALİ', 'FENER', 'İSKENDERPAŞA', 'KARAGÜMRÜK', 'KOCAMUSTAFAPAŞA', 'TOPKAPI', 'YAVUZ SELİM', 'ZEYREK', 'SULTAN AHMET'],
  34205: ['CAFERAĞA', 'FENERBAHÇE', 'CADDEBOSTAN', 'SUADİYE', 'KOZYATAĞI', 'FENERYOLU', 'GÖZTEPE', 'ERENKÖY', 'BOSTANCI', 'ACIBADEM'],
  34108: ['LEVENT', 'BEBEK', 'ETİLER', 'ORTAKÖY', 'ARNAVUTKÖY', 'BALMUMCU', 'GAYRETTEPE', 'ULUS', 'YILDIZ'],
  34124: ['TEŞVİKİYE', 'MECİDİYEKÖY', 'ESENTEPE', 'HARBİYE', 'FULYA', 'BOMONTİ'],
  34214: ['KUZGUNCUK', 'ÇENGELKÖY', 'ACIBADEM', 'BEYLERBEYİ', 'ALTUNİZADE', 'KANDİLLİ', 'ÇAMLICA', 'SALACAK'],
  34110: ['CİHANGİR', 'GALATA', 'KARAKÖY', 'TAKSİM', 'PERA', 'KASIMPAŞA'],
  34105: ['ATAKÖY', 'YEŞİLKÖY', 'YEŞİLYURT', 'FLORYA', 'ZUHURATBABA', 'İNCİRLİ'],
  34121: ['ZEKERİYAKÖY', 'TARABYA', 'İSTİNYE', 'EMİRGAN', 'MASLAK', 'YENİKÖY'],
  34202: ['BARBAROS', 'ATATÜRK', 'KÜÇÜKBAKKALKÖY', 'İÇERENKÖY', 'KAYIŞDAĞI', 'FERHATPAŞA'],
  34213: ['ATAKENT', 'IHLAMURKUYU', 'ÇAKMAK', 'YAMANEVLER', 'ALTINŞEHİR', 'DUDULLU', 'SARAY'],
};

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
  return { areaSqm: Math.max(120, areaSqm), perimeterM: Math.max(45, perimeterM) };
}

function generateGeotechnicalData(ilceName: string, lat: number, lng: number) {
  const seed = hashString(`${ilceName}-${lat}-${lng}`);
  const isCoastalOrAlluvial =
    ilceName.includes('BAKIRKÖY') ||
    ilceName.includes('ZEYTİNBURNU') ||
    ilceName.includes('FATİH') ||
    ilceName.includes('KADIKÖY') ||
    ilceName.includes('KARTAL') ||
    ilceName.includes('MALTEPE') ||
    ilceName.includes('AVCILAR') ||
    ilceName.includes('BÜYÜKÇEKMECE');

  const zeminSiniflari: Array<'ZA (Sağlam Kaya)' | 'ZB (Sağlam Kaya)' | 'ZC (Orta Sıkı Zemin)' | 'ZD (Orta Yumuşak / Alüvyon)' | 'ZE (Yumuşak Zemin / Dolgu)'> =
    isCoastalOrAlluvial ? ['ZD (Orta Yumuşak / Alüvyon)', 'ZE (Yumuşak Zemin / Dolgu)'] : ['ZA (Sağlam Kaya)', 'ZB (Sağlam Kaya)', 'ZC (Orta Sıkı Zemin)'];

  const zeminSinifi = zeminSiniflari[seed % zeminSiniflari.length];
  const sivilasmaRiski = isCoastalOrAlluvial ? (seed % 2 === 0 ? 'Yüksek' : 'Orta') : 'Düşük';
  const zeminEmniyetGerilmesi = isCoastalOrAlluvial ? '1.2 - 1.6 kg/cm²' : '2.2 - 3.5 kg/cm²';
  const temelOnerisi = isCoastalOrAlluvial ? 'Radye Temel + Fore Kazık İyileştirmesi' : 'Radye Temel (Münferit / Mat Temel)';
  const tavsiyeEdilenIyilestirme = isCoastalOrAlluvial ? 'Jet Grout / Zemin Enjeksiyonu ve Kompaksiyon' : 'Standart Temel Kazısı Yeterli';
  const riskSkoru = isCoastalOrAlluvial ? 65 + (seed % 25) : 20 + (seed % 35);

  return {
    zeminSinifi,
    depremBolgesi: '1. Derece Deprem Kuşağı (TBDY-2018)',
    pgaIvm: isCoastalOrAlluvial ? '0.45g - 0.52g (Yüksek İvme)' : '0.38g - 0.42g',
    sivilasmaRiski,
    zeminEmniyetGerilmesi,
    temelOnerisi,
    tavsiyeEdilenIyilestirme,
    riskSkoru,
  };
}

// ==========================================
// LIVE TKGM / İBB KENT REHBERİ GATEWAY CLIENT
// ==========================================
let cachedIbbToken: string | null = null;
let tokenExpiresAt = 0;
let cachedParselServiceUrl = 'https://sehirharitasigateway.ibb.gov.tr/api/mfQG/arcgis/rest/services/Parsel/MapServer/0/query?f=geojson';

async function getIbbGatewayToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedIbbToken && now < tokenExpiresAt) {
    return cachedIbbToken;
  }

  try {
    const res = await fetch('https://sehirharitasigateway.ibb.gov.tr/auth/anonim?lang=tr', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data['ABC-3903258-571632'];
    if (token) {
      cachedIbbToken = token;
      tokenExpiresAt = now + 40 * 60 * 1000; // cache for 40 mins
      if (data.generalServices?.parselGeometry?.url) {
        cachedParselServiceUrl = data.generalServices.parselGeometry.url;
      }
      return token;
    }
  } catch (err) {
    console.warn('IBB gateway token fetch error:', err);
  }
  return null;
}

// Convert live IBB/MEGSIS feature to our ParcelFeature structure
function formatLiveIbbFeature(rawFeature: any, queryLat?: number, queryLng?: number) {
  const p = rawFeature.properties || {};
  const geom = rawFeature.geometry;
  if (!geom || !geom.coordinates || geom.coordinates.length === 0) return null;

  // Geometry is Polygon: coordinates[0] is outer ring
  const ring: number[][] = geom.type === 'MultiPolygon' ? geom.coordinates[0][0] : geom.coordinates[0];
  if (!ring || ring.length < 3) return null;

  // Calculate polygon metrics
  const { areaSqm, perimeterM } = computePolygonMetrics(ring);

  // Compute centroid
  let sumLat = 0;
  let sumLng = 0;
  const numPts = ring.length - 1 || 1;
  for (let i = 0; i < numPts; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }
  const centerLat = Number((sumLat / numPts).toFixed(6));
  const centerLng = Number((sumLng / numPts).toFixed(6));

  const ilceAd = String(p.ILCE_TEXT || p.ILCE_ADI || 'KADIKÖY').toUpperCase();
  const mahalleAd = String(p.MAHALLE_ADI || p.TAPUMAHADI || 'MERKEZ').toUpperCase();
  const adaNo = String(p.ADA || '100');
  const parselNo = String(p.PARSEL || '1');

  const rawArea = Number(p.TAPUALAN || p.KADASTROALAN) || areaSqm;
  const alanFormatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rawArea) + ' m²';

  const nitelik = p.TAPUCINSI ? String(p.TAPUCINSI).trim() : 'Arsa (İmar Parseli)';
  const pafta = p.PAFTA || p.SE_ANNO_CAD_DATA || `PAFTA-${adaNo}`;
  const mevkii = `${mahalleAd} Mevkii`;
  const zeminKmdurum = p.KMDURUM === 1 ? 'Kat Mülkiyeti Kurulmuş' : 'Kat İrtifakı / Zemin';

  const koseKoordinatlari = ring.slice(0, -1).map(([lng, lat], idx) => ({
    no: idx + 1,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  }));

  const jeoteknik = generateGeotechnicalData(ilceAd, centerLat, centerLng);

  const tkgmUrl = `https://parselsorgu.tkgm.gov.tr/#ara/cografi/${centerLat}/${centerLng}`;
  const kentRehberiUrl = `https://harita.istanbul/?c=${centerLng},${centerLat}&z=19`;
  const eplanUrl = 'https://planaski.ibb.gov.tr/';

  return {
    type: 'Feature' as const,
    geometry: geom,
    properties: {
      id: `${adaNo}-${parselNo}-${p.OBJECTID || Date.now()}`,
      ilId: 341,
      ilAd: 'İSTANBUL',
      ilceId: Number(p.ILCE_ADI) || 34100,
      ilceAd,
      mahalleId: Number(p.TAPUMAHID) || 3410001,
      mahalleAd,
      adaNo,
      parselNo,
      alan: rawArea,
      alanFormatted,
      nitelik,
      mevkii,
      pafta,
      zeminKmdurum,
      ozet: `İSTANBUL / ${ilceAd} / ${mahalleAd} - Ada: ${adaNo} Parsel: ${parselNo}`,
      cevreUzunlugu: perimeterM,
      merkezEnlem: centerLat,
      merkezBoylam: centerLng,
      sorguTarihi: new Date().toISOString(),
      kaynak: 'TKGM-IBB-Canli' as const,
      koseKoordinatlari,
      jeoteknik,
      megsisId: p.MEGSISID || undefined,
      takbisId: p.TAKBISID || undefined,
      tkgmUrl,
      kentRehberiUrl,
      eplanUrl,
    },
  };
}

async function queryLiveIbbParcelByCoordinate(lat: number, lng: number) {
  const token = await getIbbGatewayToken();
  if (!token) return null;

  try {
    const delta = 0.00015;
    const env = `${(lng - delta).toFixed(6)},${(lat - delta).toFixed(6)},${(lng + delta).toFixed(6)},${(lat + delta).toFixed(6)}`;
    const url = `${cachedParselServiceUrl}&geometry=${env}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'ABC-3903258-571632': token,
        'Referer': 'https://harita.istanbul/',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return formatLiveIbbFeature(data.features[0], lat, lng);
    }
  } catch (err) {
    console.warn('Live IBB coordinate query error:', err);
  }
  return null;
}

async function queryLiveIbbParcelByAdaParsel(ada: string, parsel: string, ilceText?: string) {
  const token = await getIbbGatewayToken();
  if (!token) return null;

  try {
    // Attempt 1: Filter with Ada, Parsel, and District
    let whereClause = `ADA='${ada.trim()}' AND PARSEL='${parsel.trim()}'`;
    if (ilceText) {
      whereClause += ` AND ILCE_TEXT='${ilceText.trim().toUpperCase()}'`;
    }

    let url = `${cachedParselServiceUrl}&where=${encodeURIComponent(whereClause)}&outFields=*`;
    let res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'ABC-3903258-571632': token,
        'Referer': 'https://harita.istanbul/',
      },
    });

    if (res.ok) {
      let data = await res.json();
      if (data.features && data.features.length > 0) {
        return formatLiveIbbFeature(data.features[0]);
      }
    }

    // Attempt 2: If district didn't match, query just Ada and Parsel
    if (ilceText) {
      const fallbackWhere = `ADA='${ada.trim()}' AND PARSEL='${parsel.trim()}'`;
      const fallbackUrl = `${cachedParselServiceUrl}&where=${encodeURIComponent(fallbackWhere)}&outFields=*`;
      const fbRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'ABC-3903258-571632': token,
          'Referer': 'https://harita.istanbul/',
        },
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData.features && fbData.features.length > 0) {
          return formatLiveIbbFeature(fbData.features[0]);
        }
      }
    }
  } catch (err) {
    console.warn('Live IBB Ada/Parsel query error:', err);
  }
  return null;
}

// High-fidelity fallback Cadastral Parcel Generator with realistic multi-point irregular boundary
function generateRealisticCadastralParcelFeature(
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

  const baseWidth = 24 + (seed % 34);
  const baseHeight = 28 + ((seed >> 3) % 38);
  const angleDeg = (seed % 40) - 20;
  const angleRad = (angleDeg * Math.PI) / 180;

  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

  const hw = baseWidth / 2;
  const hh = baseHeight / 2;

  // Realistic irregular 8-to-10 corner polygon shape representing real Turkish cadastre
  const cornerJitterA = ((seed % 7) - 3);
  const cornerJitterB = (((seed >> 2) % 6) - 3);
  const cornerJitterC = (((seed >> 4) % 8) - 4);

  const localCorners: Array<[number, number]> = [
    [-hw, -hh],
    [-hw * 0.3, -hh - cornerJitterA], // road frontage curve break
    [hw * 0.6, -hh + 2],
    [hw + cornerJitterB, -hh * 0.2],
    [hw - 2, hh * 0.5],
    [hw * 0.7, hh + cornerJitterC],
    [-hw * 0.2, hh + 3],
    [-hw - 1, hh * 0.4],
    [-hw + 1, -hh * 0.3],
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
  const jeoteknik = generateGeotechnicalData(ilce.text, centerLat, centerLng);

  const nitelikList = [
    'Arsa (İmar Parseli)',
    'Kargir Apartman ve Arsası',
    'Ticari İmarlı Arsa (Emsal 2.50)',
    'Konut İmarlı Arsa (Emsal 2.07)',
    'Rezidans / Ticaret İmarlı',
    'Bahçeli Kargir İki Katlı Ev',
  ];
  const mevkiiList = [
    `${mahalle.text} Caddesi Mevkii`,
    'Tarihi Yarımada İmar Sahası',
    'Bağdat Caddesi Prestij Aksı',
    'Kentsel Dönüşüm Bölgesi',
  ];

  const nitelik = nitelikList[seed % nitelikList.length];
  const mevkii = mevkiiList[(seed >> 2) % mevkiiList.length];
  const pafta = `F${21 + (il.id % 5)}C-${12 + (adaNum % 18)}B-4D`;

  const koseKoordinatlari = ring.slice(0, -1).map(([lng, lat], idx) => ({
    no: idx + 1,
    lat,
    lng,
  }));

  const tkgmUrl = `https://parselsorgu.tkgm.gov.tr/#ara/cografi/${centerLat}/${centerLng}`;
  const kentRehberiUrl = `https://harita.istanbul/?c=${centerLng},${centerLat}&z=19`;
  const eplanUrl = 'https://planaski.ibb.gov.tr/';

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
      zeminKmdurum: 'Kat Mülkiyetli / Müteahhitlik Parseli',
      ozet: `${il.text} / ${ilce.text} / ${mahalle.text} - Ada: ${ada} Parsel: ${parsel}`,
      cevreUzunlugu: perimeterM,
      merkezEnlem: centerLat,
      merkezBoylam: centerLng,
      sorguTarihi: new Date().toISOString(),
      kaynak: 'TKGM-CBS-Simulasyon' as const,
      koseKoordinatlari,
      jeoteknik,
      megsisId: 600000000 + (seed % 9999999),
      takbisId: 10000000 + (seed % 999999),
      tkgmUrl,
      kentRehberiUrl,
      eplanUrl,
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

  // Query parcel by Ada and Parsel (Tries Live TKGM/IBB Gateway first, falls back gracefully)
  app.get('/api/tkgm/parsel/:mahalleId/:ada/:parsel', async (req, res) => {
    const mahalleId = Number(req.params.mahalleId);
    const ada = String(req.params.ada || '124').trim();
    const parsel = String(req.params.parsel || '8').trim();

    if (!mahalleId || !ada || !parsel) {
      res.status(400).json({ status: 'error', message: 'Mahalle, Ada ve Parsel zorunludur.' });
      return;
    }

    const mahalle = MAHALLELER.find((m) => m.id === mahalleId);
    const ilce = mahalle ? ILCELER.find((c) => c.id === mahalle.parentId) : undefined;

    // 1. Try Live IBB / MEGSIS / TAKBIS Gateway
    try {
      const liveFeature = await queryLiveIbbParcelByAdaParsel(ada, parsel, ilce?.text);
      if (liveFeature) {
        res.json({ status: 'ok', feature: liveFeature, source: 'live' });
        return;
      }
    } catch (e) {
      console.warn('Live parcel query failed, falling back to cadastral simulation:', e);
    }

    // 2. High-fidelity Realistic Cadastral Fallback
    const feature = generateRealisticCadastralParcelFeature(mahalleId, ada, parsel);
    res.json({ status: 'ok', feature, source: 'fallback' });
  });

  // Query parcel by coordinate (Tries Live TKGM/IBB Gateway first, falls back gracefully)
  app.get('/api/tkgm/koordinat', async (req, res) => {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ status: 'error', message: 'Geçerli enlem ve boylam gerekli.' });
      return;
    }

    // 1. Try Live IBB / MEGSIS / TAKBIS Gateway
    try {
      const liveFeature = await queryLiveIbbParcelByCoordinate(lat, lng);
      if (liveFeature) {
        res.json({ status: 'ok', feature: liveFeature, source: 'live' });
        return;
      }
    } catch (e) {
      console.warn('Live coordinate query failed, falling back to cadastral simulation:', e);
    }

    // 2. High-fidelity Realistic Cadastral Fallback
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

    const feature = generateRealisticCadastralParcelFeature(nearestMahalle.id, ada, parsel, lat, lng);
    res.json({ status: 'ok', feature, source: 'fallback' });
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
