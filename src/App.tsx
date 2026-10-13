import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Star,
  History,
  Compass,
  Code2,
  X,
  AlertCircle,
  CheckCircle2,
  Info,
  RotateCcw,
  Calculator,
  Building2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type {
  AdminUnit,
  ParcelFeature,
  SavedParcelItem,
  ToastMessage,
  ContractorParams,
} from './types/parcel';
import {
  fetchIller,
  fetchIlceler,
  fetchMahalleler,
  queryParcelByAdaParsel,
  queryParcelByCoordinate,
  loadSavedParcels,
  saveParcelsToStorage,
  exportAsGeoJSON,
} from './services/tkgmService';
import { ParcelMap } from './components/ParcelMap';
import { ParcelDetailsPanel } from './components/ParcelDetailsPanel';
import { SavedParcelsList } from './components/SavedParcelsList';
import { ContractorCalculatorModal } from './components/ContractorCalculatorModal';

const ISTANBUL_CONTRACTOR_PRESETS = [
  {
    label: 'Kadıköy · Caferağa (Moda)',
    ilId: 34,
    ilceId: 3401,
    mahalleId: 340101,
    ada: '124',
    parsel: '8',
    note: 'Bağdat Caddesi/Moda aksı, kentsel dönüşüm potansiyeli yüksek',
  },
  {
    label: 'Beşiktaş · Levent',
    ilId: 34,
    ilceId: 3402,
    mahalleId: 340201,
    ada: '412',
    parsel: '14',
    note: 'Ticari ve prestijli rezidans imarlı arsa',
  },
  {
    label: 'Şişli · Teşvikiye',
    ilId: 34,
    ilceId: 3403,
    mahalleId: 340301,
    ada: '89',
    parsel: '3',
    note: 'Nişantaşı çeperi, kat karşılığı yüksek değerli parsel',
  },
  {
    label: 'Bakırköy · Ataköy',
    ilId: 34,
    ilceId: 3406,
    mahalleId: 340601,
    ada: '512',
    parsel: '22',
    note: 'Sahil hattı lüks konut proje sahası',
  },
];

export function App() {
  const [sidebarTab, setSidebarTab] = useState<'sorgu' | 'favoriler' | 'gecmis'>('sorgu');
  const [inquiryMode, setInquiryMode] = useState<'idari' | 'koordinat'>('idari');
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [showContractorModal, setShowContractorModal] = useState<boolean>(false);

  // Admin Hierarchy State
  const [iller, setIller] = useState<AdminUnit[]>([]);
  const [ilceler, setIlceler] = useState<AdminUnit[]>([]);
  const [mahalleler, setMahalleler] = useState<AdminUnit[]>([]);

  const [selectedIlId, setSelectedIlId] = useState<number>(34); // Istanbul default
  const [selectedIlceId, setSelectedIlceId] = useState<number>(3401); // Kadıköy default
  const [selectedMahalleId, setSelectedMahalleId] = useState<number>(340101); // Caferağa default
  const [adaNo, setAdaNo] = useState<string>('124');
  const [parselNo, setParselNo] = useState<string>('8');

  // Coordinate inputs
  const [latInput, setLatInput] = useState<string>('40.985200');
  const [lngInput, setLngInput] = useState<string>('29.026800');

  // Map & Parcel Data State
  const [activeParcel, setActiveParcel] = useState<ParcelFeature | null>(null);
  const [savedParcels, setSavedParcels] = useState<SavedParcelItem[]>([]);
  const [showAllSavedOnMap, setShowAllSavedOnMap] = useState<boolean>(true);
  const [mapClickMode, setMapClickMode] = useState<boolean>(false);
  const [flyToCenter, setFlyToCenter] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], title: string, description: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const recordQueriedParcel = useCallback(
    (feature: ParcelFeature, defaultFavorite = false, defaultNote?: string, contractorParams?: ContractorParams) => {
      setSavedParcels((prev) => {
        const idx = prev.findIndex((item) => item.feature.properties.id === feature.properties.id);
        let updated: SavedParcelItem[];
        if (idx >= 0) {
          const existing = prev[idx];
          const updatedItem: SavedParcelItem = {
            ...existing,
            savedAt: new Date().toISOString(),
            feature,
            contractorParams: contractorParams || existing.contractorParams,
          };
          updated = [updatedItem, ...prev.slice(0, idx), ...prev.slice(idx + 1)];
        } else {
          const newItem: SavedParcelItem = {
            id: feature.properties.id,
            savedAt: new Date().toISOString(),
            isFavorite: defaultFavorite,
            customNote: defaultNote || '',
            contractorParams,
            feature,
          };
          updated = [newItem, ...prev];
        }
        saveParcelsToStorage(updated);
        return updated;
      });
    },
    []
  );

  // Initialize
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const provinces = await fetchIller();
        if (!mounted) return;
        setIller(provinces);

        const existing = loadSavedParcels();
        if (existing.length > 0) {
          setSavedParcels(existing);
          setActiveParcel(existing[0].feature);
        } else {
          setIsLoading(true);
          const seeded: SavedParcelItem[] = [];
          for (let i = 0; i < ISTANBUL_CONTRACTOR_PRESETS.length; i++) {
            const preset = ISTANBUL_CONTRACTOR_PRESETS[i];
            const feat = await queryParcelByAdaParsel(preset.mahalleId, preset.ada, preset.parsel);
            seeded.push({
              id: feat.properties.id,
              savedAt: new Date(Date.now() - i * 3600_000).toISOString(),
              isFavorite: i < 2,
              customNote: preset.note,
              contractorParams: {
                emsal: 2.07,
                taks: 0.30,
                katAdeti: 6,
                ortalamaDaireM2: 105,
                insaatBirimMaliyetTL: 24000,
                ortalamaSatisM2TL: 65000,
              },
              feature: feat,
            });
          }
          if (!mounted) return;
          setSavedParcels(seeded);
          saveParcelsToStorage(seeded);
          setActiveParcel(seeded[0].feature);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setIsLoading(false);
          addToast('error', 'Hata', err.message || 'Veriler yüklenemedi.');
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [addToast]);

  // Load Districts
  useEffect(() => {
    if (!selectedIlId) return;
    let active = true;
    fetchIlceler(selectedIlId)
      .then((list) => {
        if (!active) return;
        setIlceler(list);
        if (list.length > 0 && !list.some((c) => c.id === selectedIlceId)) {
          setSelectedIlceId(list[0].id);
        }
      })
      .catch(() => {
        if (active) setIlceler([]);
      });
    return () => {
      active = false;
    };
  }, [selectedIlId]);

  // Load Neighborhoods
  useEffect(() => {
    if (!selectedIlceId) return;
    let active = true;
    fetchMahalleler(selectedIlceId)
      .then((list) => {
        if (!active) return;
        setMahalleler(list);
        if (list.length > 0 && !list.some((m) => m.id === selectedMahalleId)) {
          setSelectedMahalleId(list[0].id);
        }
      })
      .catch(() => {
        if (active) setMahalleler([]);
      });
    return () => {
      active = false;
    };
  }, [selectedIlceId]);

  const handleAdministrativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMahalleId || !adaNo.trim() || !parselNo.trim()) {
      addToast('warning', 'Eksik Alan', 'Mahalle, Ada ve Parsel numarası zorunludur.');
      return;
    }

    setIsLoading(true);
    try {
      const feature = await queryParcelByAdaParsel(selectedMahalleId, adaNo, parselNo);
      setActiveParcel(feature);
      recordQueriedParcel(feature);
      addToast(
        'success',
        'Parsel Sorgulandı',
        `${feature.properties.mahalleAd} Ada ${feature.properties.adaNo} / Parsel ${feature.properties.parselNo} (${feature.properties.alanFormatted}) haritada gösteriliyor.`
      );
    } catch (err: any) {
      addToast('error', 'Sorgulama Hatası', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCoordinateQuery = useCallback(
    async (lat: number, lng: number) => {
      setIsLoading(true);
      try {
        const feature = await queryParcelByCoordinate(lat, lng);
        setActiveParcel(feature);
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        recordQueriedParcel(feature);
        addToast(
          'success',
          'Koordinat Tespiti Başarılı',
          `${feature.properties.ilAd} / ${feature.properties.ilceAd} - Ada ${feature.properties.adaNo} / Parsel ${feature.properties.parselNo}`
        );
      } catch (err: any) {
        addToast('error', 'Koordinat Hatası', err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, recordQueriedParcel]
  );

  const handleCoordinateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      addToast('warning', 'Geçersiz Koordinat', 'Geçerli enlem ve boylam girin.');
      return;
    }
    await executeCoordinateQuery(lat, lng);
  };

  const handlePresetClick = async (preset: (typeof ISTANBUL_CONTRACTOR_PRESETS)[number]) => {
    setSelectedIlId(preset.ilId);
    setSelectedIlceId(preset.ilceId);
    setSelectedMahalleId(preset.mahalleId);
    setAdaNo(preset.ada);
    setParselNo(preset.parsel);

    setIsLoading(true);
    try {
      const feature = await queryParcelByAdaParsel(preset.mahalleId, preset.ada, preset.parsel);
      setActiveParcel(feature);
      recordQueriedParcel(feature, false, preset.note);
      addToast('success', 'İstanbul Öne Çıkan Parsel', `${preset.label} yüklendi.`);
    } catch (err: any) {
      addToast('error', 'Hata', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = (feature: ParcelFeature) => {
    const id = feature.properties.id;
    setSavedParcels((prev) => {
      const exists = prev.find((item) => item.id === id);
      let next: SavedParcelItem[];
      if (exists) {
        const nextFav = !exists.isFavorite;
        next = prev.map((item) => (item.id === id ? { ...item, isFavorite: nextFav } : item));
        addToast(
          nextFav ? 'success' : 'info',
          nextFav ? 'Favorilere Eklendi' : 'Favoriden Çıkarıldı',
          `Ada ${feature.properties.adaNo} / Parsel ${feature.properties.parselNo}`
        );
      } else {
        next = [
          {
            id,
            savedAt: new Date().toISOString(),
            isFavorite: true,
            customNote: '',
            feature,
          },
          ...prev,
        ];
        addToast('success', 'Favorilere Eklendi', `Ada ${feature.properties.adaNo} / Parsel ${feature.properties.parselNo}`);
      }
      saveParcelsToStorage(next);
      return next;
    });
  };

  const handleUpdateNote = (parcelId: string, note: string) => {
    setSavedParcels((prev) => {
      const next = prev.map((item) => (item.id === parcelId ? { ...item, customNote: note } : item));
      saveParcelsToStorage(next);
      return next;
    });
  };

  const handleSaveContractorParams = (parcelId: string, params: ContractorParams) => {
    setSavedParcels((prev) => {
      const next = prev.map((item) => (item.id === parcelId ? { ...item, contractorParams: params } : item));
      saveParcelsToStorage(next);
      return next;
    });
    addToast('success', 'Fizibilite Kaydedildi', 'Müteahhitlik imar ve maliyet parametreleri güncellendi.');
  };

  const handleDeleteItem = (id: string) => {
    setSavedParcels((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveParcelsToStorage(next);
      return next;
    });
    addToast('info', 'Kayıt Silindi', 'Kayıt yerel depolamadan kaldırıldı.');
  };

  const handleClearHistory = () => {
    setSavedParcels((prev) => {
      const favs = prev.filter((i) => i.isFavorite);
      saveParcelsToStorage(favs);
      return favs;
    });
    addToast('info', 'Geçmiş Temizlendi', 'Favoriler korunarak geçmiş temizlendi.');
  };

  const currentSavedItem = activeParcel ? savedParcels.find((i) => i.id === activeParcel.properties.id) : undefined;
  const favoriteCount = savedParcels.filter((i) => i.isFavorite).length;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900">
              TKGM Parsel Pro <span className="text-blue-600">· Müteahhit CBS</span>
            </h1>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#sorgu"
            onClick={(e) => {
              e.preventDefault();
              setSidebarTab('sorgu');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              sidebarTab === 'sorgu' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Parsel Sorgulama
          </a>
          <a
            href="#favoriler"
            onClick={(e) => {
              e.preventDefault();
              setSidebarTab('favoriler');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              sidebarTab === 'favoriler' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Favorilerim ({favoriteCount})
          </a>
          <a
            href="#gecmis"
            onClick={(e) => {
              e.preventDefault();
              setSidebarTab('gecmis');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              sidebarTab === 'gecmis' ? 'text-blue-600 font-semibold' : ''
            }`}
          >
            Geçmiş ({savedParcels.length})
          </a>
          <a
            href="#mimari"
            onClick={(e) => {
              e.preventDefault();
              setShowArchitectureModal(true);
            }}
            className="hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Müteahhit Rehberi
          </a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {activeParcel && (
            <button
              type="button"
              onClick={() => setShowContractorModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>İmar & Fizibilite</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-[450px] xl:w-[480px] bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col min-h-0 shrink-0">
          {/* Sidebar Tabs */}
          <div className="p-3 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSidebarTab('sorgu')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  sidebarTab === 'sorgu' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Ada / Parsel</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('favoriler')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  sidebarTab === 'favoriler' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Favoriler ({favoriteCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('gecmis')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  sidebarTab === 'gecmis' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Geçmiş ({savedParcels.length})</span>
              </button>
            </div>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidebarTab === 'sorgu' && (
              <>
                {/* Inquiry Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>İstanbul Öncelikli Parsel Sorgu</span>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setInquiryMode('idari')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          inquiryMode === 'idari' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        İdari
                      </button>
                      <button
                        type="button"
                        onClick={() => setInquiryMode('koordinat')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          inquiryMode === 'koordinat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Koordinat
                      </button>
                    </div>
                  </div>

                  {inquiryMode === 'idari' ? (
                    <form onSubmit={handleAdministrativeSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">İl</label>
                          <select
                            value={selectedIlId}
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              setSelectedIlId(id);
                              const f = iller.find((x) => x.id === id);
                              if (f) setFlyToCenter({ lat: f.lat, lng: f.lng, zoom: f.zoom || 11 });
                            }}
                            className="w-full px-2.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                          >
                            {iller.map((il) => (
                              <option key={il.id} value={il.id}>
                                {il.text}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">İstanbul İlçe</label>
                          <select
                            value={selectedIlceId}
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              setSelectedIlceId(id);
                              const f = ilceler.find((x) => x.id === id);
                              if (f) setFlyToCenter({ lat: f.lat, lng: f.lng, zoom: f.zoom || 13 });
                            }}
                            className="w-full px-2.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                          >
                            {ilceler.map((ilce) => (
                              <option key={ilce.id} value={ilce.id}>
                                {ilce.text}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Mahalle</label>
                          <select
                            value={selectedMahalleId}
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              setSelectedMahalleId(id);
                              const f = mahalleler.find((x) => x.id === id);
                              if (f) setFlyToCenter({ lat: f.lat, lng: f.lng, zoom: f.zoom || 15 });
                            }}
                            className="w-full px-2.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                          >
                            {mahalleler.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.text}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Ada No</label>
                          <input
                            type="text"
                            value={adaNo}
                            onChange={(e) => setAdaNo(e.target.value)}
                            placeholder="124"
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Parsel No</label>
                          <input
                            type="text"
                            value={parselNo}
                            onChange={(e) => setParselNo(e.target.value)}
                            placeholder="8"
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{isLoading ? 'Sorgulanıyor...' : 'Parsel Sorgula & Çiz'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdaNo('124');
                            setParselNo('8');
                          }}
                          className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                          title="Sıfırla"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleCoordinateSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Enlem (Lat)</label>
                          <input
                            type="text"
                            value={latInput}
                            onChange={(e) => setLatInput(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Boylam (Lng)</label>
                          <input
                            type="text"
                            value={lngInput}
                            onChange={(e) => setLngInput(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Koordinat ile Parsel Bul</span>
                      </button>
                    </form>
                  )}

                  {/* Istanbul Contractor Quick Presets */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="block text-[11px] font-semibold text-slate-700 mb-2">
                      İstanbul Sık Kullanılan Müteahhit Bölgeleri:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ISTANBUL_CONTRACTOR_PRESETS.map((preset) => (
                        <button
                          key={`${preset.mahalleId}-${preset.ada}-${preset.parsel}`}
                          type="button"
                          onClick={() => handlePresetClick(preset)}
                          className="text-left px-2.5 py-2 text-[11px] bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors truncate"
                        >
                          <span className="font-semibold text-slate-800 block truncate">{preset.label}</span>
                          <span className="font-mono tabular-nums text-[10px] text-blue-600">
                            Ada {preset.ada} / Parsel {preset.parsel}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Parcel Details & Contractor Summary */}
                <ParcelDetailsPanel
                  parcel={activeParcel}
                  isFavorite={Boolean(currentSavedItem?.isFavorite)}
                  customNote={currentSavedItem?.customNote || ''}
                  contractorParams={currentSavedItem?.contractorParams}
                  onToggleFavorite={handleToggleFavorite}
                  onUpdateNote={handleUpdateNote}
                  onOpenContractorModal={() => setShowContractorModal(true)}
                  onNotify={addToast}
                />
              </>
            )}

            {sidebarTab === 'favoriler' && (
              <SavedParcelsList
                mode="favorites"
                items={savedParcels}
                activeParcelId={activeParcel?.properties.id}
                onSelectParcel={(feat) => setActiveParcel(feat)}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onClearHistory={handleClearHistory}
                onSwitchToInquiry={() => setSidebarTab('sorgu')}
                onOpenContractorModalForParcel={(feat) => {
                  setActiveParcel(feat);
                  setShowContractorModal(true);
                }}
              />
            )}

            {sidebarTab === 'gecmis' && (
              <SavedParcelsList
                mode="history"
                items={savedParcels}
                activeParcelId={activeParcel?.properties.id}
                onSelectParcel={(feat) => setActiveParcel(feat)}
                onToggleFavorite={handleToggleFavorite}
                onDeleteItem={handleDeleteItem}
                onClearHistory={handleClearHistory}
                onSwitchToInquiry={() => setSidebarTab('sorgu')}
                onOpenContractorModalForParcel={(feat) => {
                  setActiveParcel(feat);
                  setShowContractorModal(true);
                }}
              />
            )}
          </div>
        </aside>

        {/* Map Viewport */}
        <main className="flex-1 min-h-[460px] lg:min-h-0 relative">
          <ParcelMap
            activeParcel={activeParcel}
            savedParcels={savedParcels}
            showAllSavedOnMap={showAllSavedOnMap}
            onToggleShowAllSaved={() => setShowAllSavedOnMap((v) => !v)}
            mapClickMode={mapClickMode}
            onToggleMapClickMode={() => {
              setMapClickMode((v) => {
                const next = !v;
                if (next) addToast('info', 'Haritadan Nokta Seçimi', 'Haritada tıklayarak parsel sorgulayın.');
                return next;
              });
            }}
            onMapCoordinateQuery={executeCoordinateQuery}
            onSelectSavedParcel={(feat) => {
              setActiveParcel(feat);
              setSidebarTab('sorgu');
            }}
            flyToCenter={flyToCenter}
          />
        </main>
      </div>

      {/* Contractor Calculator Modal */}
      {showContractorModal && activeParcel && (
        <ContractorCalculatorModal
          parcel={activeParcel}
          initialParams={currentSavedItem?.contractorParams}
          onClose={() => setShowContractorModal(false)}
          onSaveParams={handleSaveContractorParams}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[1500] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2.5 p-3.5 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-xl"
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white">{t.title}</div>
              <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{t.description}</div>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Architecture & Contractor Guide Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-[1600] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">TKGM Parsel Pro — Müteahhit Kullanım Rehberi</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowArchitectureModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">01. İstanbul Öncelikli Hızlı Erişim</h3>
                <p>
                  Uygulama, İstanbul unvanlı ilçeleri (Kadıköy, Beşiktaş, Şişli, Üsküdar, Sarıyer, Bakırköy, Ataşehir vb.) ve sık kullanılan prestijli bölgeleri (Bağdat Caddesi, Levent, Nişantaşı, Ataköy) öncelikli olarak listeler.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">02. Müteahhitlik İmar ve Fizibilite Simülatörü</h3>
                <p>
                  Sorgulanan parselin arsa alanı üzerinden Emsal (KAKS), TAKS, kat adeti ve ortalama daire metrekaresini girerek toplam inşaat alanını, tahmini bağımsız bölüm sayısını ve kaba inşaat maliyetini anında hesaplayabilirsiniz.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">03. Veri Dışa Aktarma (GeoJSON / JSON)</h3>
                <p>
                  Parsel sınırlarını RFC 7946 GeoJSON formatında indirebilir, köşe koordinat tablosunu inceleyebilir ve favorilerinizi kaydedebilirsiniz.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowArchitectureModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
