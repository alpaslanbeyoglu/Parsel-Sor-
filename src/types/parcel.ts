import type { Feature, Polygon, MultiPolygon } from 'geojson';

export interface AdminUnit {
  id: number;
  text: string;
  lat: number;
  lng: number;
  zoom?: number;
  parentId?: number;
  isIstanbul?: boolean;
  yaka?: 'Avrupa' | 'Anadolu' | 'Diger';
}

export interface GeotechnicalInfo {
  zeminSinifi: 'ZA (Sağlam Kaya)' | 'ZB (Sağlam Kaya)' | 'ZC (Orta Sıkı Zemin)' | 'ZD (Orta Yumuşak / Alüvyon)' | 'ZE (Yumuşak Zemin / Dolgu)';
  depremBolgesi: string;
  pgaIvm: string; // e.g. 0.42g
  sivilasmaRiski: 'Düşük' | 'Orta' | 'Yüksek';
  zeminEmniyetGerilmesi: string; // e.g. 2.0 kg/cm²
  temelOnerisi: string;
  tavsiyeEdilenIyilestirme: string;
  riskSkoru: number; // 0 - 100
}

export interface ParcelProperties {
  id: string;
  ilId: number;
  ilAd: string;
  ilceId: number;
  ilceAd: string;
  mahalleId: number;
  mahalleAd: string;
  adaNo: string;
  parselNo: string;
  alan: number; // m²
  alanFormatted: string;
  nitelik: string;
  mevkii: string;
  pafta: string;
  zeminKmdurum: string;
  ozet: string;
  cevreUzunlugu: number; // metre
  merkezEnlem: number;
  merkezBoylam: number;
  sorguTarihi: string;
  kaynak: 'TKGM-IBB-Canli' | 'TKGM-Canli' | 'TKGM-CBS-Simulasyon';
  koseKoordinatlari: Array<{ no: number; lat: number; lng: number }>;
  jeoteknik?: GeotechnicalInfo;
  megsisId?: number | string;
  takbisId?: number | string;
  tkgmUrl?: string;
  kentRehberiUrl?: string;
  eplanUrl?: string;
}

export type ParcelFeature = Feature<Polygon | MultiPolygon, ParcelProperties>;

export interface ContractorParams {
  emsal: number; // e.g. 1.5, 2.0, 2.5
  taks: number; // e.g. 0.3, 0.4
  katAdeti: number; // e.g. 5, 8
  ortalamaDaireM2: number; // e.g. 100 m² net
  insaatBirimMaliyetTL: number; // e.g. 24000 TL/m²
  ortalamaSatisM2TL: number; // e.g. 65000 TL/m²
}

export interface SavedParcelItem {
  id: string;
  savedAt: string;
  isFavorite: boolean;
  customNote?: string;
  contractorParams?: ContractorParams;
  feature: ParcelFeature;
}

export type MapBaseLayer = 'osm' | 'satellite' | 'topo' | 'carto-light' | 'carto-dark';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
}
