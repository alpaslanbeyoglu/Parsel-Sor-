import type { AdminUnit, ParcelFeature, SavedParcelItem } from '../types/parcel';

const STORAGE_KEY = 'tkgm_parsel_pro_saved_v2';

export async function fetchIller(): Promise<AdminUnit[]> {
  const res = await fetch('/api/tkgm/iller');
  if (!res.ok) throw new Error('İl listesi alınamadı.');
  const json = await res.json();
  return json.data || [];
}

export async function fetchIlceler(ilId: number): Promise<AdminUnit[]> {
  const res = await fetch(`/api/tkgm/ilceler/${ilId}`);
  if (!res.ok) throw new Error('İlçe listesi alınamadı.');
  const json = await res.json();
  return json.data || [];
}

export async function fetchMahalleler(ilceId: number): Promise<AdminUnit[]> {
  const res = await fetch(`/api/tkgm/mahalleler/${ilceId}`);
  if (!res.ok) throw new Error('Mahalle listesi alınamadı.');
  const json = await res.json();
  return json.data || [];
}

export async function queryParcelByAdaParsel(
  mahalleId: number,
  ada: string,
  parsel: string
): Promise<ParcelFeature> {
  const cleanAda = ada.trim() || '124';
  const cleanParsel = parsel.trim() || '8';
  const res = await fetch(
    `/api/tkgm/parsel/${mahalleId}/${encodeURIComponent(cleanAda)}/${encodeURIComponent(cleanParsel)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Parsel sorgulama sırasında hata oluştu.');
  }
  const json = await res.json();
  return json.feature;
}

export async function queryParcelByCoordinate(lat: number, lng: number): Promise<ParcelFeature> {
  const res = await fetch(`/api/tkgm/koordinat?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`);
  if (!res.ok) {
    throw new Error('Seçilen koordinatta parsel verisi çözümlenemedi.');
  }
  const json = await res.json();
  return json.feature;
}

export function loadSavedParcels(): SavedParcelItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveParcelsToStorage(items: SavedParcelItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export function exportAsGeoJSON(feature: ParcelFeature): void {
  const collection = {
    type: 'FeatureCollection',
    name: `TKGM_Parsel_${feature.properties.ilAd}_${feature.properties.adaNo}_${feature.properties.parselNo}`,
    features: [feature],
  };
  const blob = new Blob([JSON.stringify(collection, null, 2)], {
    type: 'application/geo+json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `parsel_${feature.properties.mahalleAd.toLowerCase().replace(/\s+/g, '_')}_ada_${feature.properties.adaNo}_parsel_${feature.properties.parselNo}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAsJSON(feature: ParcelFeature, contractorNote?: string): void {
  const payload = {
    kurum: 'TKGM Parsel Pro - Müteahhitlik & CBS Raporu',
    olusturmaTarihi: new Date().toISOString(),
    parselDetaylari: feature.properties,
    koseKoordinatlari: feature.properties.koseKoordinatlari,
    notlar: contractorNote || '',
    geometri: feature.geometry,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `müteahhit_raporu_ada_${feature.properties.adaNo}_parsel_${feature.properties.parselNo}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
