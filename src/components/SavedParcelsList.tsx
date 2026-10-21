import React, { useState } from 'react';
import { Star, Trash2, MapPin, Download, Search, History, FolderDown, Calculator } from 'lucide-react';
import type { ParcelFeature, SavedParcelItem } from '../types/parcel';
import { exportAsGeoJSON } from '../services/tkgmService';

interface SavedParcelsListProps {
  mode: 'favorites' | 'history';
  items: SavedParcelItem[];
  activeParcelId?: string;
  onSelectParcel: (feature: ParcelFeature) => void;
  onToggleFavorite: (feature: ParcelFeature) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onSwitchToInquiry: () => void;
  onOpenContractorModalForParcel: (feature: ParcelFeature) => void;
}

export const SavedParcelsList: React.FC<SavedParcelsListProps> = ({
  mode,
  items,
  activeParcelId,
  onSelectParcel,
  onToggleFavorite,
  onDeleteItem,
  onClearHistory,
  onSwitchToInquiry,
  onOpenContractorModalForParcel,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = items
    .filter((item) => (mode === 'favorites' ? item.isFavorite : true))
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const p = item.feature?.properties;
      if (!p) return false;
      const note = item.customNote || '';
      return (
        String(p.ilAd || '').toLowerCase().includes(q) ||
        String(p.ilceAd || '').toLowerCase().includes(q) ||
        String(p.mahalleAd || '').toLowerCase().includes(q) ||
        String(p.adaNo || '').toLowerCase().includes(q) ||
        String(p.parselNo || '').toLowerCase().includes(q) ||
        String(p.nitelik || '').toLowerCase().includes(q) ||
        note.toLowerCase().includes(q)
      );
    });

  if (filteredItems.length === 0) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
          {mode === 'favorites' ? <Star className="w-5 h-5" /> : <History className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {mode === 'favorites' ? 'Favori Parsel Listeniz Boş' : 'Geçmiş Kayıt Bulunamadı'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'favorites'
              ? 'Sorguladığınız parselleri favorilere ekleyerek müteahhitlik projeleriniz için kolayca saklayın.'
              : 'Yaptığınız tüm Ada/Parsel sorgulamaları ve harita aramaları burada saklanır.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToInquiry}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          Hemen Parsel Sorgula
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search & Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İlçe, mahalle, ada/parsel ara..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            const collection = {
              type: 'FeatureCollection',
              features: filteredItems.map((i) => i.feature),
            };
            const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/geo+json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tkgm_parsel_koleksiyonu_${filteredItems.length}_adet.geojson`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0"
          title="Toplu GeoJSON İndir"
        >
          <FolderDown className="w-3.5 h-3.5 text-blue-600" />
          <span>Toplu İndir</span>
        </button>

        {mode === 'history' && items.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="px-2.5 py-2 text-xs font-medium text-red-600 bg-white border border-slate-200 hover:bg-red-50 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            Temizle
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filteredItems.map((item) => {
          const p = item.feature.properties;
          const isSelected = activeParcelId === p.id;
          const formattedDate = new Date(item.savedAt).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              onClick={() => onSelectParcel(item.feature)}
              className={`p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/75 border-blue-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                    <span className="font-semibold text-blue-600">{p.ilAd}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.ilceAd}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-slate-700">{p.mahalleAd}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    Ada {p.adaNo} / Parsel {p.parselNo}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onOpenContractorModalForParcel(item.feature)}
                    className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Müteahhit İmar Hesapla"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(item.feature)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => exportAsGeoJSON(item.feature)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                <span className="font-mono tabular-nums font-semibold text-blue-700">{p.alanFormatted}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{p.nitelik}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[11px] text-slate-400">{formattedDate}</span>
              </div>

              {item.customNote && (
                <p className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  Not: {item.customNote}
                </p>
              )}

              {item.contractorParams && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-3 text-[11px] text-emerald-700 font-medium">
                  <span>Emsal: {item.contractorParams.emsal}</span>
                  <span>·</span>
                  <span>Kat: {item.contractorParams.katAdeti}</span>
                  <span>·</span>
                  <span className="font-mono">~{Math.round((p.alan * item.contractorParams.emsal) / item.contractorParams.ortalamaDaireM2)} Daire</span>
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-blue-600 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Haritada Sınırları Göster</span>
                </span>
                <span className="font-mono tabular-nums text-slate-400">
                  {p.merkezEnlem.toFixed(4)}°K, {p.merkezBoylam.toFixed(4)}°D
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
