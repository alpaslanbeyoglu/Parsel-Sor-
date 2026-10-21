import React, { useState } from 'react';
import {
  Star,
  Download,
  FileJson,
  Copy,
  Check,
  Table,
  FileText,
  Calculator,
  Building,
  Activity,
  ShieldAlert,
  ExternalLink,
  BadgeCheck,
  Map,
  Compass,
} from 'lucide-react';
import type { ParcelFeature, ContractorParams } from '../types/parcel';
import { exportAsGeoJSON, exportAsJSON } from '../services/tkgmService';

interface ParcelDetailsPanelProps {
  parcel: ParcelFeature | null;
  isFavorite: boolean;
  customNote: string;
  contractorParams?: ContractorParams;
  onToggleFavorite: (parcel: ParcelFeature) => void;
  onUpdateNote: (parcelId: string, note: string) => void;
  onOpenContractorModal: () => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, desc: string) => void;
}

export const ParcelDetailsPanel: React.FC<ParcelDetailsPanelProps> = ({
  parcel,
  isFavorite,
  customNote,
  contractorParams,
  onToggleFavorite,
  onUpdateNote,
  onOpenContractorModal,
  onNotify,
}) => {
  const [copiedCoord, setCopiedCoord] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'ozluk' | 'resmi' | 'jeoteknik' | 'koordinatlar' | 'geojson'>('ozluk');
  const [noteInput, setNoteInput] = useState<string>(customNote);

  React.useEffect(() => {
    setNoteInput(customNote);
  }, [customNote, parcel?.properties.id]);

  if (!parcel) {
    return (
      <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
        <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Aktif Parsel Seçilmedi</h3>
        <p className="text-xs text-slate-500">
          İstanbul Avrupa/Anadolu kıta seçiminden İlçe ve Mahalle seçerek veya harita üzerinde tıklayarak parsel detaylarına ulaşın.
        </p>
      </div>
    );
  }

  const p = parcel.properties;
  const geo = p.jeoteknik;
  const isLive = p.kaynak === 'TKGM-IBB-Canli';

  const handleCopyCoordinates = () => {
    const text = `${p.merkezEnlem.toFixed(6)}, ${p.merkezBoylam.toFixed(6)}`;
    navigator.clipboard?.writeText(text);
    setCopiedCoord(true);
    onNotify('info', 'Koordinat Kopyalandı', `WGS84 Merkez: ${text} panoya kopyalandı.`);
    setTimeout(() => setCopiedCoord(false), 1800);
  };

  const handleExportGeoJSON = () => {
    exportAsGeoJSON(parcel);
    onNotify('success', 'GeoJSON İndirildi', `${p.mahalleAd} Ada ${p.adaNo} / Parsel ${p.parselNo} indirildi.`);
  };

  const handleExportJSON = () => {
    exportAsJSON(parcel, customNote);
    onNotify('success', 'Müteahhit Raporu İndirildi', 'Parsel özlük ve jeoteknik raporlar JSON formatında indirildi.');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNote(p.id, noteInput);
    onNotify('success', 'Not Kaydedildi', 'Kişisel parsel ve yatırım notunuz kaydedildi.');
  };

  const tkgmUrl = p.tkgmUrl || `https://parselsorgu.tkgm.gov.tr/#ara/cografi/${p.merkezEnlem.toFixed(6)}/${p.merkezBoylam.toFixed(6)}`;
  const kentRehberiUrl = p.kentRehberiUrl || `https://harita.istanbul/?c=${p.merkezBoylam.toFixed(6)},${p.merkezEnlem.toFixed(6)}&z=19`;
  const eplanUrl = p.eplanUrl || 'https://planaski.ibb.gov.tr/';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-slate-900">
      {/* Header Row */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/90">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span className="font-bold text-blue-600">{p.ilAd}</span>
              <span>·</span>
              <span className="font-semibold text-slate-700">{p.ilceAd}</span>
              <span>·</span>
              <span className="font-medium text-slate-600 truncate">{p.mahalleAd}</span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 font-mono tabular-nums flex items-center gap-2">
              <span>Ada {p.adaNo} / Parsel {p.parselNo}</span>
              {isLive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-sans">
                  <BadgeCheck className="w-3 h-3 text-emerald-600" />
                  <span>Resmi TKGM & İBB</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-sans">
                  <span>Kadastro Analiz</span>
                </span>
              )}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
              <span className="font-mono tabular-nums font-bold text-blue-700 text-sm">{p.alanFormatted}</span>
              <span>·</span>
              <span className="font-medium truncate max-w-[200px]">{p.nitelik}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(parcel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 shadow-2xs ${
              isFavorite
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isFavorite ? 'Favoride' : 'Favori'}</span>
          </button>
        </div>
      </div>

      {/* Official Portals Quick Links (TKGM, Kent Rehberi, E-Plan) */}
      <div className="p-3 bg-slate-100/90 border-b border-slate-200 grid grid-cols-3 gap-2">
        <a
          href={tkgmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-[11px] font-bold text-slate-800 hover:text-blue-700 transition-colors shadow-2xs group text-center"
          title="Resmi TKGM Parsel Sorgu Sayfasında Doğrula"
        >
          <span>TKGM Sorgu</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
        </a>

        <a
          href={kentRehberiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-bold text-slate-800 hover:text-emerald-700 transition-colors shadow-2xs group text-center"
          title="İBB Şehir Haritası ve Kent Rehberinde Aç"
        >
          <span>Kent Rehberi</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
        </a>

        <a
          href={eplanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-[11px] font-bold text-slate-800 hover:text-amber-700 transition-colors shadow-2xs group text-center"
          title="İBB E-Plan (İmar Durumu ve Plan Askı) Portalını Aç"
        >
          <span>İBB E-Plan</span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 shrink-0" />
        </a>
      </div>

      {/* Contractor Quick Simulator CTA Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between gap-3 shadow-inner">
        <div className="min-w-0">
          <div className="text-xs font-bold flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-sky-300" />
            <span>Müteahhit İmar & Fizibilite Simülatörü</span>
          </div>
          <div className="text-[11px] text-blue-100 truncate mt-0.5">
            {contractorParams
              ? `Emsal: ${contractorParams.emsal} · Kat: ${contractorParams.katAdeti} · Net kar hesaplandı`
              : 'Emsal (KAKS), TAKS ve kat adetiyle inşaat alanını hesaplayın'}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenContractorModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 rounded-xl shadow-md transition-colors whitespace-nowrap shrink-0"
        >
          <span>Hesapla</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('ozluk')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'ozluk' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          <span>Tapu & Özlük</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('jeoteknik')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'jeoteknik' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-amber-600" />
          <span>Zemin (TBDY)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('koordinatlar')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'koordinatlar' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-3.5 h-3.5 text-emerald-600" />
          <span>Köşeler ({p.koseKoordinatlari.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('geojson')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'geojson' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileJson className="w-3.5 h-3.5 text-indigo-600" />
          <span>GeoJSON</span>
        </button>
      </div>

      {/* Tab 1: Özlük */}
      {activeSubTab === 'ozluk' && (
        <div className="p-3.5 sm:p-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Tapu Alanı</span>
              <span className="font-mono tabular-nums font-bold text-slate-950 text-sm">
                {p.alanFormatted}
              </span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Çevre Uzunluğu</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 text-sm">
                {p.cevreUzunlugu.toFixed(2)} m
              </span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Niteliği (Cinsi)</span>
              <span className="font-semibold text-slate-900">{p.nitelik}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Mevkii</span>
              <span className="font-medium text-slate-900">{p.mevkii}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Pafta</span>
              <span className="font-mono tabular-nums font-semibold text-slate-800">{p.pafta}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Zemin Durumu</span>
              <span className="font-medium text-slate-800">{p.zeminKmdurum}</span>
            </div>
            {p.megsisId && (
              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-500 block text-[11px]">MEGSİS Kimlik ID</span>
                <span className="font-mono text-emerald-700 font-semibold">{p.megsisId}</span>
              </div>
            )}
            {p.takbisId && (
              <div className="pb-2 border-b border-slate-100">
                <span className="text-slate-500 block text-[11px]">TAKBİS Zemin ID</span>
                <span className="font-mono text-blue-700 font-semibold">{p.takbisId}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">WGS84 Merkez Koordinat</span>
              <span className="font-mono tabular-nums text-slate-900 font-semibold">
                {p.merkezEnlem.toFixed(6)}, {p.merkezBoylam.toFixed(6)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              {copiedCoord ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCoord ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveNote} className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kişisel Müteahhit / Yatırım Notu
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Örn: Kat karşılığı %50 teklif edildi, maliklerle görüşülecek..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Kaydet
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportGeoJSON}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>GeoJSON İndir</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shadow-2xs"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Fizibilite Raporu</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Jeoteknik & Zemin */}
      {activeSubTab === 'jeoteknik' && geo && (
        <div className="p-3.5 sm:p-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <div>
                <span className="font-bold text-slate-900 block">Zemin Risk Skoru</span>
                <span className="text-[11px] text-slate-600">TBDY-2018 & Deprem Mikrobölgeleme</span>
              </div>
            </div>
            <span className={`text-sm font-bold font-mono px-2.5 py-1 rounded-lg ${geo.riskSkoru > 50 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
              {geo.riskSkoru} / 100
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Zemin Sınıfı</span>
              <span className="font-mono font-bold text-slate-900">{geo.zeminSinifi}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Sıvılaşma Riski</span>
              <span className={`font-bold ${geo.sivilasmaRiski === 'Yüksek' ? 'text-red-600' : geo.sivilasmaRiski === 'Orta' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {geo.sivilasmaRiski}
              </span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">En Büyük Yer İvmesi (PGA)</span>
              <span className="font-mono text-slate-800 font-semibold">{geo.pgaIvm}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block text-[11px]">Zemin Emniyet Gerilmesi</span>
              <span className="font-mono font-semibold text-slate-800">{geo.zeminEmniyetGerilmesi}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold">ÖNERİLEN TEMEL SİSTEMİ</span>
              <span className="font-bold text-slate-900">{geo.temelOnerisi}</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold">ZEMİN İYİLEŞTİRME GEREKSİNİMİ</span>
              <span className="font-medium text-slate-800">{geo.tavsiyeEdilenIyilestirme}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Köşe Koordinatları (Cadastral Vertices) */}
      {activeSubTab === 'koordinatlar' && (
        <div className="p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Resmi Kadastral Köşe Kırık Noktaları</span>
            <span className="font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
              {p.koseKoordinatlari.length} Köşe Noktası
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2 px-3">Nokta</th>
                  <th className="py-2 px-3 text-right">Enlem (WGS84 Lat)</th>
                  <th className="py-2 px-3 text-right">Boylam (WGS84 Lng)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {p.koseKoordinatlari.map((pt) => (
                  <tr key={pt.no} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-bold text-blue-700">K{pt.no}</td>
                    <td className="py-1.5 px-3 text-right text-slate-800">{pt.lat.toFixed(6)}</td>
                    <td className="py-1.5 px-3 text-right text-slate-800">{pt.lng.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: GeoJSON */}
      {activeSubTab === 'geojson' && (
        <div className="p-3.5 sm:p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">RFC 7946 Standart GeoJSON Geometri</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(parcel, null, 2));
                onNotify('info', 'Kopyalandı', 'GeoJSON kodu panoya kopyalandı.');
              }}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              <Copy className="w-3 h-3" />
              <span>Kopyala</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-52 leading-relaxed">
            {JSON.stringify(parcel, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
