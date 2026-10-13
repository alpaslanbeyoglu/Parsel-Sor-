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
  const [activeSubTab, setActiveSubTab] = useState<'ozluk' | 'koordinatlar' | 'geojson'>('ozluk');
  const [noteInput, setNoteInput] = useState<string>(customNote);

  React.useEffect(() => {
    setNoteInput(customNote);
  }, [customNote, parcel?.properties.id]);

  if (!parcel) {
    return (
      <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
        <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Aktif Parsel Seçilmedi</h3>
        <p className="text-xs text-slate-500">
          İstanbul öncelikli açılır menülerden İlçe ve Mahalle seçerek, Ada/Parsel girerek veya haritadan tıklayarak parsel detaylarına ulaşın.
        </p>
      </div>
    );
  }

  const p = parcel.properties;

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
    onNotify('success', 'Müteahhit Raporu İndirildi', 'Parsel özlük ve notlar JSON formatında indirildi.');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateNote(p.id, noteInput);
    onNotify('success', 'Not Kaydedildi', 'Kişisel parsel ve yatırım notunuz kaydedildi.');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header Row */}
      <div className="p-4 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/80">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <span className="font-semibold text-blue-600">{p.ilAd}</span>
            <span aria-hidden="true">·</span>
            <span>{p.ilceAd}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700">{p.mahalleAd}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5 font-mono tabular-nums">
            Ada {p.adaNo} / Parsel {p.parselNo}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="font-mono tabular-nums font-semibold text-blue-700">{p.alanFormatted}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{p.nitelik}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(parcel)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
            isFavorite
              ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
          <span>{isFavorite ? 'Favoride' : 'Favori'}</span>
        </button>
      </div>

      {/* Contractor Quick Simulator CTA Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold">Müteahhit İmar & Fizibilite Analizi</div>
          <div className="text-[11px] text-blue-100 truncate">
            {contractorParams
              ? `Emsal: ${contractorParams.emsal} · Kat: ${contractorParams.katAdeti} · Hesap aktif`
              : 'Emsal, maliyet ve tahmini daire sayısını simüle edin'}
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenContractorModal}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white text-blue-900 hover:bg-blue-50 rounded-xl shadow-md transition-colors whitespace-nowrap shrink-0"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-600" />
          <span>Hesapla</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('ozluk')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'ozluk' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Özlük Bilgileri</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('koordinatlar')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'koordinatlar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Köşeler ({p.koseKoordinatlari.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('geojson')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeSubTab === 'geojson' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>GeoJSON</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeSubTab === 'ozluk' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block">Tapu Alanı</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 text-sm">
                {p.alanFormatted}
              </span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block">Çevre Uzunluğu</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 text-sm">
                {p.cevreUzunlugu.toFixed(2)} m
              </span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block">Niteliği</span>
              <span className="font-medium text-slate-900">{p.nitelik}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block">Mevkii</span>
              <span className="font-medium text-slate-900">{p.mevkii}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block">Pafta</span>
              <span className="font-mono tabular-nums text-slate-800">{p.pafta}</span>
            </div>
            <div className="pb-2 border-b border-slate-100">
              <span className="text-slate-500 block">Zemin Durumu</span>
              <span className="font-medium text-slate-800">{p.zeminKmdurum}</span>
            </div>
          </div>

          {/* Coordinate copy */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-xs">
              <span className="text-slate-500 block">Merkez Koordinat (WGS84)</span>
              <span className="font-mono tabular-nums text-slate-800 font-medium">
                {p.merkezEnlem.toFixed(6)}, {p.merkezBoylam.toFixed(6)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCoordinates}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              {copiedCoord ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCoord ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
          </div>

          {/* Note Form */}
          <form onSubmit={handleSaveNote} className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Müteahhit / Yatırım Notu (Malik Beklentisi, Emsal vb.)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Örn: %50 kat karşılığı, maliklerle görüşülecek..."
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Kaydet
              </button>
            </div>
          </form>

          {/* Export buttons */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportGeoJSON}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>GeoJSON İndir</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>JSON Rapor</span>
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'koordinatlar' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Poligon Köşe Koordinatları (WGS84)</span>
            <span className="text-xs font-mono text-slate-500">{p.koseKoordinatlari.length} Nokta</span>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3 font-medium">Nokta</th>
                  <th className="py-2 px-3 font-medium text-right">Enlem (Lat)</th>
                  <th className="py-2 px-3 font-medium text-right">Boylam (Lng)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                {p.koseKoordinatlari.map((pt) => (
                  <tr key={pt.no} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-800">K{pt.no}</td>
                    <td className="py-2 px-3 text-right text-slate-700">{pt.lat.toFixed(6)}</td>
                    <td className="py-2 px-3 text-right text-slate-700">{pt.lng.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'geojson' && (
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">RFC 7946 GeoJSON Feature</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(parcel, null, 2));
                onNotify('info', 'Kopyalandı', 'GeoJSON panoya kopyalandı.');
              }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              <Copy className="w-3 h-3" />
              <span>Kodu Kopyala</span>
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
