import type { Feature, Polygon, MultiPolygon } from 'geojson';

export interface AdminUnit {
  id: number;
  text: string;
  lat: number;
  lng: number;
  zoom?: number;
  parentId?: number;
  isIstanbul?: boolean;
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
  kaynak: 'TKGM-Canli' | 'TKGM-CBS-Simulasyon';
  koseKoordinatlari: Array<{ no: number; lat: number; lng: number }>;
}

export type ParcelFeature = Feature<Polygon | MultiPolygon, ParcelProperties>;

export interface ContractorParams {
  emsal: number; // e.g. 1.5, 2.0, 2.5
  taks: number; // e.g. 0.3, 0.4
  katAdeti: number; // e.g. 5, 8
  ortalamaDaireM2: number; // e.g. 100 m² net
  insaatBirimMaliyetTL: number; // e.g. 22000 TL/m²
  ortalamaSatisM2TL: number; // e.g. 55000 TL/m²
  arsaMaliyetiTL?: number;
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
