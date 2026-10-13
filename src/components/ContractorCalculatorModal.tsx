import React, { useState } from 'react';
import { X, Calculator, Building2, Coins, TrendingUp, ShieldCheck } from 'lucide-react';
import type { ParcelFeature, ContractorParams } from '../types/parcel';

interface ContractorCalculatorModalProps {
  parcel: ParcelFeature;
  initialParams?: ContractorParams;
  onClose: () => void;
  onSaveParams: (parcelId: string, params: ContractorParams) => void;
}

export const ContractorCalculatorModal: React.FC<ContractorCalculatorModalProps> = ({
  parcel,
  initialParams,
  onClose,
  onSaveParams,
}) => {
  const p = parcel.properties;

  const [emsal, setEmsal] = useState<number>(initialParams?.emsal ?? 2.07);
  const [taks, setTaks] = useState<number>(initialParams?.taks ?? 0.30);
  const [katAdeti, setKatAdeti] = useState<number>(initialParams?.katAdeti ?? 6);
  const [ortalamaDaireM2, setOrtalamaDaireM2] = useState<number>(initialParams?.ortalamaDaireM2 ?? 110);
  const [insaatBirimMaliyetTL, setInsaatBirimMaliyetTL] = useState<number>(
    initialParams?.insaatBirimMaliyetTL ?? 24000
  );
  const [ortalamaSatisM2TL, setOrtalamaSatisM2TL] = useState<number>(
    initialParams?.ortalamaSatisM2TL ?? 65000
  );
  const [malSahibiOran, setMalSahibiOran] = useState<number>(50); // %50 kat karşılığı

  // Calculations
  const arsaAlani = p.alan;
  const tabanAlani = Math.round(arsaAlani * taks * 100) / 100;
  const toplamInsaatAlani = Math.round(arsaAlani * emsal * 100) / 100;
  const tahminiDaireSayisi = Math.max(1, Math.floor(toplamInsaatAlani / ortalamaDaireM2));
  const toplamMaliyetTL = Math.round(toplamInsaatAlani * insaatBirimMaliyetTL);
  const toplamHasiatTL = Math.round(toplamInsaatAlani * ortalamaSatisM2TL);
  const muteahhitHasiatTL = Math.round((toplamHasiatTL * (100 - malSahibiOran)) / 100);
  const tahminiNetKarTL = muteahhitHasiatTL - toplamMaliyetTL;
  const roiYuzde = toplamMaliyetTL > 0 ? Math.round((tahminiNetKarTL / toplamMaliyetTL) * 100) : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);

  const handleSave = () => {
    onSaveParams(p.id, {
      emsal,
      taks,
      katAdeti,
      ortalamaDaireM2,
      insaatBirimMaliyetTL,
      ortalamaSatisM2TL,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Müteahhitlik İmar ve Fizibilite Simülatörü
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {p.ilAd} / {p.ilceAd} · Ada {p.adaNo} / Parsel {p.parselNo} ({p.alanFormatted})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emsal (KAKS)</label>
              <input
                type="number"
                step="0.05"
                value={emsal}
                onChange={(e) => setEmsal(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">TAKS (Taban Oranı)</label>
              <input
                type="number"
                step="0.05"
                value={taks}
                onChange={(e) => setTaks(parseFloat(e.target.value) || 0.3)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kat Adeti</label>
              <input
                type="number"
                value={katAdeti}
                onChange={(e) => setKatAdeti(parseInt(e.target.value, 10) || 5)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ortalama Daire Net (m²)</label>
              <input
                type="number"
                value={ortalamaDaireM2}
                onChange={(e) => setOrtalamaDaireM2(parseInt(e.target.value, 10) || 100)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kaba İnşaat Maliyet (TL/m²)</label>
              <input
                type="number"
                step="1000"
                value={insaatBirimMaliyetTL}
                onChange={(e) => setInsaatBirimMaliyetTL(parseFloat(e.target.value) || 20000)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ortalama Satış Fiyatı (TL/m²)</label>
              <input
                type="number"
                step="1000"
                value={ortalamaSatisM2TL}
                onChange={(e) => setOrtalamaSatisM2TL(parseFloat(e.target.value) || 50000)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Results Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-blue-700 mb-1 font-medium">
                <Building2 className="w-4 h-4" />
                <span>Toplam İnşaat Alanı</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                {toplamInsaatAlani.toLocaleString('tr-TR')} m²
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Taban: {tabanAlani} m²</div>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-700 mb-1 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Tahmini Bağımsız Bölüm</span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono tabular-nums">
                ~{tahminiDaireSayisi} Daire
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Ort. {ortalamaDaireM2} m² net</div>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-amber-700 mb-1 font-medium">
                <Coins className="w-4 h-4" />
                <span>Toplam İnşaat Maliyeti</span>
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono tabular-nums truncate">
                {formatCurrency(toplamMaliyetTL)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{insaatBirimMaliyetTL.toLocaleString()} TL/m²</div>
            </div>

            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-purple-700 mb-1 font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>Tahmini Müteahhit Kârı</span>
              </div>
              <div className="text-sm font-bold text-purple-900 font-mono tabular-nums truncate">
                {formatCurrency(tahminiNetKarTL)}
              </div>
              <div className="text-[10px] text-purple-700 mt-0.5 font-semibold">ROI: %{roiYuzde}</div>
            </div>
          </div>

          {/* Kat Karşılığı Paylaşım Özeti */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-800 pb-2">
              <span>Kat Karşılığı Oran Simülasyonu (Arsa Sahibi / Müteahhit)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMalSahibiOran(40)}
                  className={`px-2 py-0.5 rounded text-[11px] ${malSahibiOran === 40 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  %40
                </button>
                <button
                  type="button"
                  onClick={() => setMalSahibiOran(50)}
                  className={`px-2 py-0.5 rounded text-[11px] ${malSahibiOran === 50 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  %50
                </button>
                <button
                  type="button"
                  onClick={() => setMalSahibiOran(60)}
                  className={`px-2 py-0.5 rounded text-[11px] ${malSahibiOran === 60 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  %60
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Mal Sahibi Hissesi (%{malSahibiOran})</span>
                <span className="font-mono text-sm font-bold text-white">
                  ~{Math.round(tahminiDaireSayisi * (malSahibiOran / 100))} Daire ({formatCurrency((toplamHasiatTL * malSahibiOran) / 100)})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Müteahhit Hissesi (%{100 - malSahibiOran})</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  ~{Math.round(tahminiDaireSayisi * ((100 - malSahibiOran) / 100))} Daire ({formatCurrency(muteahhitHasiatTL)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            * Hesaplamalar yaklaşık piyasa birim maliyetleri ve emsal baz alınarak simüle edilmiştir.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Parametreleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
