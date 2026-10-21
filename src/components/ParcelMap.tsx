import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Layers,
  Crosshair,
  Maximize2,
  Plus,
  Minus,
  MousePointerClick,
  Compass,
  Eye,
  EyeOff,
  Calculator,
  Search,
  Star,
  Download,
  Activity,
  FileText,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import type { MapBaseLayer, ParcelFeature, SavedParcelItem } from '../types/parcel';
import { exportAsGeoJSON } from '../services/tkgmService';

// Fix Leaflet default marker icons for Vite/ESM bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ParcelMapProps {
  activeParcel: ParcelFeature | null;
  savedParcels: SavedParcelItem[];
  showAllSavedOnMap: boolean;
  onToggleShowAllSaved: () => void;
  mapClickMode: boolean;
  onToggleMapClickMode: () => void;
  onMapCoordinateQuery: (lat: number, lng: number) => void;
  onSelectSavedParcel: (feature: ParcelFeature) => void;
  flyToCenter: { lat: number; lng: number; zoom: number } | null;
  onOpenContractorModal?: () => void;
  onOpenInquiry?: () => void;
  onOpenDetails?: () => void;
  onToggleFavorite?: (feature: ParcelFeature) => void;
  isFavorite?: boolean;
  isLoading?: boolean;
  fullScreenMobile?: boolean;
  onToggleFullScreenMobile?: () => void;
}

const TILE_LAYERS: Record<
  MapBaseLayer,
  { name: string; shortName: string; url: string; attribution: string; maxZoom: number }
> = {
  osm: {
    name: 'OpenStreetMap Kadastro & Sokak',
    shortName: 'Sokak (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
  satellite: {
    name: 'Uydu Görüntüsü (Esri World Imagery)',
    shortName: 'Uydu',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  'carto-light': {
    name: 'CBS Açık Harita (CartoDB)',
    shortName: 'Teknik Açık',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20,
  },
  'carto-dark': {
    name: 'CBS Koyu Harita (CartoDB)',
    shortName: 'Teknik Koyu',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20,
  },
  topo: {
    name: 'Topografik Eğim & Yükseklik',
    shortName: 'Topografik',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    maxZoom: 17,
  },
};

export const ParcelMap: React.FC<ParcelMapProps> = ({
  activeParcel,
  savedParcels,
  showAllSavedOnMap,
  onToggleShowAllSaved,
  mapClickMode,
  onToggleMapClickMode,
  onMapCoordinateQuery,
  onSelectSavedParcel,
  flyToCenter,
  onOpenContractorModal,
  onOpenInquiry,
  onOpenDetails,
  onToggleFavorite,
  isFavorite,
  isLoading,
  fullScreenMobile,
  onToggleFullScreenMobile,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const activeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const savedLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);

  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>('osm');
  const [showVertices, setShowVertices] = useState<boolean>(true);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: 41.0082,
    lng: 28.9784,
  });
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [isBottomCardMinimized, setIsBottomCardMinimized] = useState<boolean>(false);

  // References to keep event handlers fresh
  const onMapCoordQueryRef = useRef(onMapCoordinateQuery);
  useEffect(() => {
    onMapCoordQueryRef.current = onMapCoordinateQuery;
  }, [onMapCoordinateQuery]);

  // Trigger leaflet map sizing
  const invalidateSize = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, []);

  // Initialize Map safely (only once on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    // Clean any prior Leaflet ID in DOM to prevent "Map container is already initialized"
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    let map: L.Map;
    try {
      map = L.map(mapContainerRef.current, {
        center: [41.015, 28.96],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });
    } catch (err) {
      console.error('Leaflet container initialization error caught:', err);
      return;
    }

    const initialTile = TILE_LAYERS[baseLayer] || TILE_LAYERS.osm;
    const tl = L.tileLayer(initialTile.url, {
      attribution: initialTile.attribution,
      maxZoom: initialTile.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tl;
    savedLayerGroupRef.current = L.layerGroup().addTo(map);
    activeLayerGroupRef.current = L.layerGroup().addTo(map);

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Map Click Handler: ALWAYS queries coordinate when clicked!
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Add temporary visual ripple marker
      if (clickMarkerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(clickMarkerRef.current);
        } catch {}
      }
      const rippleIcon = L.divIcon({
        className: 'custom-ripple-icon',
        html: '<div class="map-click-ripple"></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      clickMarkerRef.current = L.marker([lat, lng], { icon: rippleIcon }).addTo(map);

      // Execute query callback
      onMapCoordQueryRef.current(lat, lng);
    });

    mapInstanceRef.current = map;

    // Invalidate size on timers to ensure tile rendering even in complex flexbox
    const timer1 = setTimeout(() => map.invalidateSize(), 60);
    const timer2 = setTimeout(() => map.invalidateSize(), 300);
    const timer3 = setTimeout(() => map.invalidateSize(), 1000);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount!

  // Base Layer Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      try {
        map.removeLayer(tileLayerRef.current);
      } catch {}
    }
    const cfg = TILE_LAYERS[baseLayer] || TILE_LAYERS.osm;
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);
  }, [baseLayer]);

  // Fly to target center
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCenter) return;
    map.flyTo([flyToCenter.lat, flyToCenter.lng], flyToCenter.zoom, { duration: 0.8 });
  }, [flyToCenter]);

  // Render Active Parcel Polygon & Vertices
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = activeLayerGroupRef.current;
    if (!map || !group) return;

    try {
      group.clearLayers();
    } catch {}

    if (!activeParcel || !activeParcel.geometry) return;

    // Remove temporary click marker once parcel is drawn
    if (clickMarkerRef.current) {
      try {
        map.removeLayer(clickMarkerRef.current);
      } catch {}
      clickMarkerRef.current = null;
    }

    try {
      const geoJsonLayer = L.geoJSON(activeParcel, {
        style: {
          color: '#0284c7',
          weight: 3.5,
          opacity: 1,
          fillColor: '#38bdf8',
          fillOpacity: 0.38,
        },
      });

      const props = activeParcel.properties || ({} as any);
      const mLat = Number(props.merkezEnlem) || 41.0082;
      const mLng = Number(props.merkezBoylam) || 28.9784;

      const popupHtml = `
        <div class="p-3.5 text-slate-900 font-sans">
          <div class="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
            ${props.ilAd || 'İSTANBUL'} · ${props.ilceAd || ''} · ${props.mahalleAd || ''}
          </div>
          <div class="text-base font-extrabold font-mono text-slate-900 mb-2 flex items-center justify-between">
            <span>Ada ${props.adaNo || '-'} / Parsel ${props.parselNo || '-'}</span>
            <span class="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-sans">${props.nitelik || 'Arsa'}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 pb-2 border-t border-slate-200 text-xs">
            <div>
              <span class="text-slate-500 block text-[10px] font-medium">Tapu Alanı</span>
              <span class="font-mono font-bold text-slate-950 text-sm">${props.alanFormatted || '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] font-medium">Çevre Uzunluğu</span>
              <span class="font-mono font-semibold text-slate-800 text-xs">${props.cevreUzunlugu ? `${Number(props.cevreUzunlugu).toFixed(1)} m` : '-'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] font-medium">Zemin Sınıfı</span>
              <span class="font-semibold text-amber-600 text-xs">${props.jeoteknik?.zeminSinifi ? props.jeoteknik.zeminSinifi.split(' ')[0] : 'ZC'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] font-medium">Deprem PGA</span>
              <span class="font-mono font-semibold text-rose-600 text-xs">${props.jeoteknik?.pgaIvm || '0.40g'}</span>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Koordinat: ${mLat.toFixed(4)}, ${mLng.toFixed(4)}</span>
            ${props.kaynak === 'TKGM-IBB-Canli' ? '<span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Canlı CBS</span>' : ''}
          </div>
          <div class="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
            <a href="${props.tkgmUrl || `https://parselsorgu.tkgm.gov.tr/#ara/cografi/${mLat}/${mLng}`}" target="_blank" rel="noopener noreferrer" class="py-1 px-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors">TKGM ↗</a>
            <a href="${props.kentRehberiUrl || `https://harita.istanbul/?c=${mLng},${mLat}&z=19`}" target="_blank" rel="noopener noreferrer" class="py-1 px-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded transition-colors">Kent Rehberi ↗</a>
            <a href="${props.eplanUrl || 'https://planaski.ibb.gov.tr/'}" target="_blank" rel="noopener noreferrer" class="py-1 px-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded transition-colors">E-Plan ↗</a>
          </div>
        </div>
      `;

      geoJsonLayer.bindPopup(popupHtml);
      geoJsonLayer.addTo(group);

      // Center Label Marker
      const centerIcon = L.divIcon({
        className: 'custom-parcel-center',
        html: `<div class="tkgm-parcel-center-label">
          <span class="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
          <span>Ada ${props.adaNo || '-'} / Parsel ${props.parselNo || '-'} · ${props.alanFormatted || ''}</span>
        </div>`,
        iconSize: [180, 28],
        iconAnchor: [90, 14],
      });
      L.marker([mLat, mLng], {
        icon: centerIcon,
        interactive: false,
      }).addTo(group);

      // Vertex Markers (K1..Kn)
      const vertices = Array.isArray(props.koseKoordinatlari) ? props.koseKoordinatlari : [];
      if (showVertices && vertices.length > 0) {
        vertices.forEach((pt) => {
          const pLat = Number(pt.lat);
          const pLng = Number(pt.lng);
          if (isNaN(pLat) || isNaN(pLng)) return;
          const vm = L.circleMarker([pLat, pLng], {
            radius: 5,
            color: '#0f172a',
            weight: 2,
            fillColor: '#facc15',
            fillOpacity: 1,
          });
          vm.bindTooltip(`K${pt.no}: ${pLat.toFixed(5)}, ${pLng.toFixed(5)}`, {
            direction: 'top',
            className: 'tkgm-vertex-label',
          });
          vm.addTo(group);
        });
      }

      // Zoom into parcel bounds
      const bounds = geoJsonLayer.getBounds();
      if (bounds && typeof bounds.isValid === 'function' && bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 18, duration: 0.8 });
      }
    } catch (renderErr) {
      console.warn('Parcel polygon render error caught:', renderErr);
    }
  }, [activeParcel, showVertices]);

  // Render Saved / Favorite Parcels on Map
  useEffect(() => {
    const group = savedLayerGroupRef.current;
    if (!group) return;
    try {
      group.clearLayers();
    } catch {}
    if (!showAllSavedOnMap) return;

    savedParcels.forEach((item) => {
      try {
        if (!item || !item.feature || !item.feature.geometry) return;
        if (activeParcel && item.feature.properties?.id === activeParcel.properties?.id) return;
        const layer = L.geoJSON(item.feature, {
          style: {
            color: item.isFavorite ? '#f59e0b' : '#64748b',
            weight: 2,
            dashArray: '4 4',
            fillColor: item.isFavorite ? '#f59e0b' : '#475569',
            fillOpacity: 0.22,
          },
        });
        layer.on('click', () => onSelectSavedParcel(item.feature));
        const p = item.feature.properties || {};
        layer.bindTooltip(
          `${p.mahalleAd || ''} Ada ${p.adaNo || ''} / Parsel ${p.parselNo || ''} (${p.alanFormatted || ''})`,
          { direction: 'top' }
        );
        layer.addTo(group);
      } catch (e) {
        console.warn('Saved parcel map layer render error:', e);
      }
    });
  }, [savedParcels, showAllSavedOnMap, activeParcel, onSelectSavedParcel]);

  return (
    <div className="relative w-full h-full min-h-[420px] overflow-hidden bg-slate-950 flex flex-col select-none">
      {/* Real Functional Leaflet Map Container with explicit 100% dimensions */}
      <div
        id="tkgm-cbs-leaflet-container"
        ref={mapContainerRef}
        className="w-full h-full flex-1 z-0 outline-none"
        style={{ width: '100%', height: '100%', minHeight: '350px' }}
      />

      {/* Loading overlay when querying coordinate */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] px-4 py-2 bg-slate-900/90 text-white text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border border-slate-700 animate-pulse">
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Kadastro & Parsel Verisi Çözümleniyor...</span>
        </div>
      )}

      {/* Floating Map Instructions / Click Mode Banner */}
      <div className="absolute top-3 left-3 right-3 lg:right-auto z-[500] flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Layer Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl max-w-full overflow-x-auto">
          {(Object.keys(TILE_LAYERS) as MapBaseLayer[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBaseLayer(key)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                baseLayer === key
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {TILE_LAYERS[key].shortName}
            </button>
          ))}
        </div>

        {/* Map Click Helper Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-sky-400 text-xs font-medium rounded-xl shadow-xl">
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>Haritada parsele tıkla & sorgula</span>
        </div>

        {/* Mobile Fullscreen toggle if available */}
        {onToggleFullScreenMobile && (
          <button
            type="button"
            onClick={onToggleFullScreenMobile}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xl transition-colors hover:bg-blue-700"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{fullScreenMobile ? 'Bölünmüş Ekran' : 'Tam Harita'}</span>
          </button>
        )}
      </div>

      {/* Right Map Action Controls */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5 pointer-events-auto">
        {/* Zoom In / Out */}
        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 text-slate-200 hover:bg-slate-800 transition-colors border-b border-slate-800"
            aria-label="Yakınlaştır"
            title="Yakınlaştır (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Uzaklaştır"
            title="Uzaklaştır (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Focus to Active Parcel */}
        {activeParcel && (
          <button
            type="button"
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map) return;
              const tmp = L.geoJSON(activeParcel);
              const b = tmp.getBounds();
              if (b.isValid()) map.flyToBounds(b, { padding: [60, 60], maxZoom: 18 });
            }}
            className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xl hover:bg-blue-500 transition-colors"
            title="Parsele Odaklan"
            aria-label="Parsele Odaklan"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Toggle Corner Vertices */}
        <button
          type="button"
          onClick={() => setShowVertices((v) => !v)}
          className={`p-2.5 rounded-xl border transition-colors shadow-xl backdrop-blur-md ${
            showVertices
              ? 'bg-slate-900/90 text-amber-400 border-amber-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80'
          }`}
          title={showVertices ? 'Köşe Koordinatlarını Gizle' : 'Köşe Koordinatlarını Göster (K1..Kn)'}
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Saved Parcels toggle */}
        <button
          type="button"
          onClick={onToggleShowAllSaved}
          className={`p-2.5 rounded-xl border transition-colors shadow-xl backdrop-blur-md ${
            showAllSavedOnMap
              ? 'bg-slate-900/90 text-amber-400 border-amber-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80'
          }`}
          title={showAllSavedOnMap ? 'Kayıtlı Parselleri Gizle' : 'Kayıtlı Parselleri Haritada Göster'}
        >
          {showAllSavedOnMap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Active Parcel Bottom Info Card (Essential for Mobile & Desktop GIS) */}
      {activeParcel && (
        <div className="absolute bottom-3 left-3 right-3 lg:left-4 lg:right-auto lg:max-w-md z-[500] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-2xl text-slate-900 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-blue-600 truncate">
                  {activeParcel.properties.ilAd} · {activeParcel.properties.ilceAd} · {activeParcel.properties.mahalleAd}
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
                  <span>Ada {activeParcel.properties.adaNo} / Parsel {activeParcel.properties.parselNo}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg">
                    {activeParcel.properties.alanFormatted}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(activeParcel)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Favoriye Ekle / Çıkar"
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => exportAsGeoJSON(activeParcel)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="GeoJSON İndir"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-xl text-center border border-slate-100 text-xs">
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Nitelik</div>
                <div className="font-semibold text-slate-900 truncate">{activeParcel.properties.nitelik || 'Arsa'}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Zemin Sınıfı</div>
                <div className="font-bold text-amber-700">
                  {activeParcel.properties.jeoteknik?.zeminSinifi ? activeParcel.properties.jeoteknik.zeminSinifi.split(' ')[0] : 'ZC'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Köşe Noktaları</div>
                <div className="font-mono font-semibold text-slate-900">
                  {activeParcel.properties.koseKoordinatlari?.length || 4} Nokta
                </div>
              </div>
            </div>

            {/* External Official Portals Bar */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 text-center text-[10px] font-bold">
              <a
                href={activeParcel.properties.tkgmUrl || `https://parselsorgu.tkgm.gov.tr/#ara/cografi/${activeParcel.properties.merkezEnlem}/${activeParcel.properties.merkezBoylam}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="Resmi TKGM Parsel Sorgu Sayfasında Doğrula"
              >
                <span>TKGM</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={activeParcel.properties.kentRehberiUrl || `https://harita.istanbul/?c=${activeParcel.properties.merkezBoylam},${activeParcel.properties.merkezEnlem}&z=19`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="İBB Şehir Haritası ve Kent Rehberinde Aç"
              >
                <span>Kent Rehberi</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <a
                href={activeParcel.properties.eplanUrl || 'https://planaski.ibb.gov.tr/'}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                title="İBB E-Plan İmar Durumu ve Plan Askı Portalını Aç"
              >
                <span>E-Plan</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {/* Bottom Actions for Contractors */}
            <div className="flex items-center gap-2 pt-0.5">
              {onOpenContractorModal && (
                <button
                  type="button"
                  onClick={onOpenContractorModal}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>İmar & Fizibilite Hesabı</span>
                </button>
              )}
              {onOpenDetails && (
                <button
                  type="button"
                  onClick={onOpenDetails}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  <span>Zemin Analizi</span>
                </button>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeParcel.properties.merkezEnlem},${activeParcel.properties.merkezBoylam}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                title="Google Haritalar ile Yol Tarifi Al"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Status Bar: Coordinates and Zoom Level */}
      <div className="absolute bottom-2 right-2 z-[450] hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl text-[10px] font-mono text-slate-300 pointer-events-none shadow-lg">
        <div className="flex items-center gap-1">
          <Compass className="w-3 h-3 text-sky-400" />
          <span>Enlem: {cursorCoords.lat.toFixed(5)}</span>
        </div>
        <span>·</span>
        <div>Boylam: {cursorCoords.lng.toFixed(5)}</div>
        <span>·</span>
        <div className="text-slate-400">Zoom: {currentZoom}</div>
      </div>
    </div>
  );
};
