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
  FileText,
  Maximize2,
  Minimize2,
  Layers,
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
    ilId: 342,
    ilceId: 34205,
    mahalleId: 3420501,
    ada: '124',
    parsel: '8',
    note: 'Bağdat Caddesi/Moda aksı, kentsel dönüşüm potansiyeli yüksek',
  },
  {
    label: 'Beşiktaş · Levent',
    ilId: 341,
    ilceId: 34108,
    mahalleId: 3410801,
    ada: '412',
    parsel: '14',
    note: 'Ticari ve prestijli rezidans imarlı arsa',
  },
  {
    label: 'Fatih · Haseki Sultan',
    ilId: 341,
    ilceId: 34116,
    mahalleId: 3411601,
    ada: '89',
    parsel: '3',
    note: 'Tarihi yarımada, butik konut/turizm imarlı parsel',
  },
  {
    label: 'Şişli · Teşvikiye',
    ilId: 341,
    ilceId: 34124,
    mahalleId: 3412401,
    ada: '154',
    parsel: '6',
    note: 'Nişantaşı çeperi, kat karşılığı yüksek değerli arsa',
  },
];

export function App() {
  // Mobile / Responsive Navigation State
  const [activeTab, setActiveTab] = useState<'sorgu' | 'detay' | 'favoriler' | 'gecmis'>('sorgu');
  const [fullScreenMobileMap, setFullScreenMobileMap] = useState<boolean>(false);
  const [inquiryMode, setInquiryMode] = useState<'idari' | 'koordinat'>('idari');
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);
  const [showContractorModal, setShowContractorModal] = useState<boolean>(false);

  // Admin Hierarchy State (Istanbul European side default)
  const [iller, setIller] = useState<AdminUnit[]>([]);
  const [ilceler, setIlceler] = useState<AdminUnit[]>([]);
  const [mahalleler, setMahalleler] = useState<AdminUnit[]>([]);

  const [selectedIlId, setSelectedIlId] = useState<number>(341); // Istanbul Avrupa default
  const [selectedIlceId, setSelectedIlceId] = useState<number>(34116); // Fatih default
  const [selectedMahalleId, setSelectedMahalleId] = useState<number>(3411601); // Haseki Sultan default
  const [adaNo, setAdaNo] = useState<string>('89');
  const [parselNo, setParselNo] = useState<string>('3');

  // Coordinate inputs
  const [latInput, setLatInput] = useState<string>('41.009200');
  const [lngInput, setLngInput] = useState<string>('28.948100');

  // Map & Parcel Data State
  const [activeParcel, setActiveParcel] = useState<ParcelFeature | null>(null);
  const [savedParcels, setSavedParcels] = useState<SavedParcelItem[]>([]);
  const [showAllSavedOnMap, setShowAllSavedOnMap] = useState<boolean>(true);
  const [mapClickMode, setMapClickMode] = useState<boolean>(true);
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

  // Initialize data and load initial parcel for immediate map visualization
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
          // Query preset immediately so map is never blank
          try {
            const firstPreset = ISTANBUL_CONTRACTOR_PRESETS[0];
            const feat = await queryParcelByAdaParsel(firstPreset.mahalleId, firstPreset.ada, firstPreset.parsel);
            if (!mounted) return;
            const seeded: SavedParcelItem[] = [
              {
                id: feat.properties.id,
                savedAt: new Date().toISOString(),
                isFavorite: true,
                customNote: firstPreset.note,
                contractorParams: {
                  emsal: 2.07,
                  taks: 0.30,
                  katAdeti: 6,
                  ortalamaDaireM2: 105,
                  insaatBirimMaliyetTL: 24000,
                  ortalamaSatisM2TL: 65000,
                },
                feature: feat,
              },
            ];
            setSavedParcels(seeded);
            saveParcelsToStorage(seeded);
            setActiveParcel(feat);
          } catch (seedErr) {
            console.warn('Initial seed parcel query warning:', seedErr);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setIsLoading(false);
          addToast('error', 'Bağlantı Hatası', err.message || 'Veriler yüklenemedi.');
        }
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [addToast]);

  // Load Districts when selected province changes
  useEffect(() => {
    if (!selectedIlId) return;
    let active = true;
    fetchIlceler(selectedIlId)
      .then((list) => {
        if (!active) return;
        setIlceler(list);
        if (list.length > 0) {
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

  // Load Neighborhoods when selected district changes
  useEffect(() => {
    if (!selectedIlceId) return;
    let active = true;
    fetchMahalleler(selectedIlceId)
      .then((list) => {
        if (!active) return;
        setMahalleler(list);
        if (list.length > 0) {
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
        'Parsel Çizildi',
        `${feature.properties.mahalleAd} Ada ${feature.properties.adaNo} / Parsel ${feature.properties.parselNo} haritada gösteriliyor.`
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
          'Haritadan Parsel Tespit Edildi',
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
      addToast('success', 'Bölge Yüklendi', `${preset.label} - Ada ${preset.ada} / Parsel ${preset.parsel}`);
    } catch (err: any) {
      addToast('error', 'Yükleme Hatası', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = (feature: ParcelFeature) => {
    setSavedParcels((prev) => {
      const idx = prev.findIndex((i) => i.feature.properties.id === feature.properties.id);
      let updated: SavedParcelItem[];
      if (idx >= 0) {
        const current = prev[idx];
        const nextFav = !current.isFavorite;
        const newItem = { ...current, isFavorite: nextFav };
        updated = [...prev.slice(0, idx), newItem, ...prev.slice(idx + 1)];
        addToast(nextFav ? 'success' : 'info', nextFav ? 'Favorilere Eklendi' : 'Favorilerden Kaldırıldı', '');
      } else {
        const newItem: SavedParcelItem = {
          id: feature.properties.id,
          savedAt: new Date().toISOString(),
          isFavorite: true,
          feature,
        };
        updated = [newItem, ...prev];
        addToast('success', 'Favorilere Eklendi', '');
      }
      saveParcelsToStorage(updated);
      return updated;
    });
  };

  const handleUpdateNote = (id: string, note: string) => {
    setSavedParcels((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, customNote: note } : item));
      saveParcelsToStorage(updated);
      return updated;
    });
    addToast('success', 'Not Kaydedildi', 'Parsel notunuz güncellendi.');
  };

  const handleSaveContractorParams = (_parcelId: string, params: ContractorParams) => {
    if (!activeParcel) return;
    recordQueriedParcel(activeParcel, false, undefined, params);
    addToast('success', 'Müteahhitlik Parametreleri Kaydedildi', 'İmar emsal ve birim maliyet değerleri saklandı.');
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
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-900 overflow-hidden font-sans">
      {/* App Navigation Header */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5 bg-slate-900 text-white border-b border-slate-800 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
                TKGM Parsel Pro <span className="text-sky-400">· CBS Harita</span>
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
                Müteahhit & CBS
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Quick Nav */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('sorgu')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'sorgu' ? 'text-sky-400 font-bold' : 'hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Ada / Parsel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detay')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'detay' ? 'text-sky-400 font-bold' : 'hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Zemin & Detay</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('favoriler')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'favoriler' ? 'text-sky-400 font-bold' : 'hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Favoriler ({favoriteCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gecmis')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'gecmis' ? 'text-sky-400 font-bold' : 'hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Geçmiş ({savedParcels.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowArchitectureModal(true)}
            className="hover:text-white transition-colors text-slate-400"
          >
            Kullanım Rehberi
          </button>
        </nav>

        {/* Header Right Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {activeParcel && (
            <button
              type="button"
              onClick={() => setShowContractorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg transition-colors whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>İmar Simülatörü</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container: On desktop side-by-side, on mobile/smaller screens top-bottom split view! */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* Left Sidebar on Desktop (w-[460px]), Bottom Panel on Mobile (when not in fullScreenMobileMap mode) */}
        <aside
          className={`bg-slate-50 border-slate-200 flex flex-col min-h-0 shrink-0 order-2 lg:order-1 transition-all duration-200 ${
            fullScreenMobileMap
              ? 'hidden lg:flex lg:w-[450px] xl:w-[480px] lg:border-r'
              : 'flex w-full lg:w-[450px] xl:w-[480px] h-[52vh] lg:h-full border-t lg:border-t-0 lg:border-r'
          }`}
        >
          {/* Tab Selection Header Bar */}
          <div className="p-2.5 bg-white border-b border-slate-200 shrink-0 shadow-xs">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('sorgu')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'sorgu' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span>Sorgu</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('detay')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'detay' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Zemin & İmar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('favoriler')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'favoriler' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>Favori ({favoriteCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('gecmis')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'gecmis' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Geçmiş ({savedParcels.length})</span>
              </button>
            </div>
          </div>

          {/* Sidebar Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
            {/* TAB 1: SORGULAMA */}
            {activeTab === 'sorgu' && (
              <>
                {/* Inquiry Form Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>İstanbul Avrupa & Anadolu Ada/Parsel</span>
                    </div>
                    <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setInquiryMode('idari')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          inquiryMode === 'idari' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                        }`}
                      >
                        İdari
                      </button>
                      <button
                        type="button"
                        onClick={() => setInquiryMode('koordinat')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          inquiryMode === 'koordinat' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                        }`}
                      >
                        Koordinat
                      </button>
                    </div>
                  </div>

                  {inquiryMode === 'idari' ? (
                    <form onSubmit={handleAdministrativeSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Kıta / İl Seçimi
                        </label>
                        <select
                          value={selectedIlId}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            setSelectedIlId(id);
                            const found = iller.find((x) => x.id === id);
                            if (found) setFlyToCenter({ lat: found.lat, lng: found.lng, zoom: found.zoom || 12 });
                          }}
                          className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                        >
                          {iller.map((il) => (
                            <option key={il.id} value={il.id}>
                              {il.text}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">İlçe</label>
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
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Mahalle</label>
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

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Ada No</label>
                          <input
                            type="text"
                            value={adaNo}
                            onChange={(e) => setAdaNo(e.target.value)}
                            placeholder="89"
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Parsel No</label>
                          <input
                            type="text"
                            value={parselNo}
                            onChange={(e) => setParselNo(e.target.value)}
                            placeholder="3"
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap shadow-xs"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{isLoading ? 'Sorgulanıyor...' : 'Parsel Sorgula & Haritada Göster'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAdaNo('89');
                            setParselNo('3');
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
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Enlem (Lat)</label>
                          <input
                            type="text"
                            value={latInput}
                            onChange={(e) => setLatInput(e.target.value)}
                            placeholder="41.0092"
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Boylam (Lng)</label>
                          <input
                            type="text"
                            value={lngInput}
                            onChange={(e) => setLngInput(e.target.value)}
                            placeholder="28.9481"
                            className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-slate-900"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Aranıyor...' : 'Koordinattan Parsel Bul & Çiz'}</span>
                      </button>
                    </form>
                  )}

                  {/* Istanbul Contractor Quick Presets */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Sık Kullanılan İstanbul Müteahhit Bölgeleri:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ISTANBUL_CONTRACTOR_PRESETS.map((preset) => (
                        <button
                          key={`${preset.mahalleId}-${preset.ada}-${preset.parsel}`}
                          type="button"
                          onClick={() => handlePresetClick(preset)}
                          className="text-left px-2.5 py-2 text-[11px] bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors truncate"
                        >
                          <span className="font-bold text-slate-800 block truncate">{preset.label}</span>
                          <span className="font-mono tabular-nums text-[10px] text-blue-600">
                            Ada {preset.ada} / Parsel {preset.parsel}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Parcel Preview Details Card */}
                {activeParcel && (
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
                )}
              </>
            )}

            {/* TAB 2: DETAY & ZEMİN */}
            {activeTab === 'detay' && (
              <div className="space-y-4">
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
              </div>
            )}

            {/* TAB 3: FAVORİLER */}
            {activeTab === 'favoriler' && (
              <div className="space-y-3">
                <SavedParcelsList
                  mode="favorites"
                  items={savedParcels}
                  activeParcelId={activeParcel?.properties.id}
                  onSelectParcel={(feat) => {
                    setActiveParcel(feat);
                    setFlyToCenter({
                      lat: feat.properties.merkezEnlem,
                      lng: feat.properties.merkezBoylam,
                      zoom: 16,
                    });
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  onDeleteItem={handleDeleteItem}
                  onClearHistory={handleClearHistory}
                  onSwitchToInquiry={() => setActiveTab('sorgu')}
                  onOpenContractorModalForParcel={(feat) => {
                    setActiveParcel(feat);
                    setShowContractorModal(true);
                  }}
                />
              </div>
            )}

            {/* TAB 4: GEÇMİŞ */}
            {activeTab === 'gecmis' && (
              <div className="space-y-3">
                <SavedParcelsList
                  mode="history"
                  items={savedParcels}
                  activeParcelId={activeParcel?.properties.id}
                  onSelectParcel={(feat) => {
                    setActiveParcel(feat);
                    setFlyToCenter({
                      lat: feat.properties.merkezEnlem,
                      lng: feat.properties.merkezBoylam,
                      zoom: 16,
                    });
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  onDeleteItem={handleDeleteItem}
                  onClearHistory={handleClearHistory}
                  onSwitchToInquiry={() => setActiveTab('sorgu')}
                  onOpenContractorModalForParcel={(feat) => {
                    setActiveParcel(feat);
                    setShowContractorModal(true);
                  }}
                />
              </div>
            )}
          </div>
        </aside>

        {/* Real Functional GIS Map Viewport (Takes full remaining space on desktop, and top half or full on mobile) */}
        <main
          className={`flex-1 w-full min-h-0 relative order-1 lg:order-2 flex flex-col ${
            fullScreenMobileMap ? 'h-full' : 'h-[48vh] lg:h-full'
          }`}
        >
          <ParcelMap
            activeParcel={activeParcel}
            savedParcels={savedParcels}
            showAllSavedOnMap={showAllSavedOnMap}
            onToggleShowAllSaved={() => setShowAllSavedOnMap((v) => !v)}
            mapClickMode={mapClickMode}
            onToggleMapClickMode={() => {
              setMapClickMode((v) => {
                const next = !v;
                if (next) addToast('info', 'Harita Tıklama Modu', 'Haritada herhangi bir yere dokunarak parsel sorgulayabilirsiniz.');
                return next;
              });
            }}
            onMapCoordinateQuery={executeCoordinateQuery}
            onSelectSavedParcel={(feat) => {
              setActiveParcel(feat);
              setFlyToCenter({
                lat: feat.properties.merkezEnlem,
                lng: feat.properties.merkezBoylam,
                zoom: 16,
              });
            }}
            flyToCenter={flyToCenter}
            onOpenContractorModal={() => setShowContractorModal(true)}
            onOpenInquiry={() => setActiveTab('sorgu')}
            onOpenDetails={() => setActiveTab('detay')}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={Boolean(currentSavedItem?.isFavorite)}
            isLoading={isLoading}
            fullScreenMobile={fullScreenMobileMap}
            onToggleFullScreenMobile={() => setFullScreenMobileMap((v) => !v)}
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
            className="pointer-events-auto flex items-start gap-2.5 p-3.5 bg-slate-900 text-white border border-slate-700 rounded-2xl shadow-2xl"
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">{t.title}</div>
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

      {/* Architecture & Usage Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-[1600] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-900">
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
                <h3 className="text-xs font-bold text-slate-900 mb-1">01. Harita Üzerinden Doğrudan Parsel Tıklama & Seçimi</h3>
                <p>
                  Harita üzerinde herhangi bir araziye veya parsele doğrudan tıklayarak (veya dokunarak) o noktadaki kadastral parsel sınırlarını, köşe kırık koordinatlarını (K1, K2, K3...) ve tapu alanını anında görebilirsiniz.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">02. Müteahhitlik İmar ve Maliyet Simülatörü</h3>
                <p>
                  Sorgulanan parselin tapu alanı üzerinden Emsal (KAKS), TAKS, kat adeti, daire m² büyüklüğü ve m² birim inşaat maliyetini girerek satılabilir inşaat alanını, daire adedini ve tahmini kaba/ince inşaat maliyetini hesaplayabilirsiniz.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">03. Zemin Sınıfı & Jeoteknik Deprem Analizi</h3>
                <p>
                  TBDY-2018 zemin sınıfı (ZA-ZE), en büyük yer ivmesi (PGA), sıvılaşma riski ve önerilen temel tipi (Radye, Fore Kazık vb.) parsel sorgusuyla birlikte sunulur.
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowArchitectureModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
