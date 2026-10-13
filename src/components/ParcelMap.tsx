import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import type { MapBaseLayer, ParcelFeature, SavedParcelItem } from '../types/parcel';

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
}

const TILE_LAYERS: Record<
  MapBaseLayer,
  { name: string; shortName: string; url: string; attribution: string; maxZoom: number }
> = {
  satellite: {
    name: 'Uydu Görüntüsü (Esri World Imagery)',
    shortName: 'Uydu',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
  osm: {
    name: 'OpenStreetMap Kadastro',
    shortName: 'Sokak',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
  'carto-light': {
    name: 'CBS Açık Harita',
    shortName: 'Teknik Açık',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20,
  },
  'carto-dark': {
    name: 'CBS Koyu Harita',
    shortName: 'Teknik Koyu',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO',
    maxZoom: 20,
  },
  topo: {
    name: 'Topografik Arazi',
    shortName: 'Topo',
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const activeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const savedLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>('satellite');
  const [showVertices, setShowVertices] = useState<boolean>(true);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: 41.0082,
    lng: 28.9784,
  });
  const [currentZoom, setCurrentZoom] = useState<number>(14);

  const mapClickModeRef = useRef(mapClickMode);
  const onMapCoordQueryRef = useRef(onMapCoordinateQuery);

  useEffect(() => {
    mapClickModeRef.current = mapClickMode;
    onMapCoordQueryRef.current = onMapCoordinateQuery;
  }, [mapClickMode, onMapCoordinateQuery]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [41.0082, 28.9784],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    const initialTile = TILE_LAYERS[baseLayer];
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

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (mapClickModeRef.current) {
        onMapCoordQueryRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = TILE_LAYERS[baseLayer];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
    }).addTo(map);
  }, [baseLayer]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToCenter) return;
    map.flyTo([flyToCenter.lat, flyToCenter.lng], flyToCenter.zoom, { duration: 0.8 });
  }, [flyToCenter]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = activeLayerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (!activeParcel) return;

    const geoJsonLayer = L.geoJSON(activeParcel, {
      style: {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 1,
        fillColor: '#0284c7',
        fillOpacity: 0.35,
      },
    });

    const props = activeParcel.properties;
    const popupHtml = `
      <div class="p-3 text-slate-900">
        <div class="text-[11px] font-semibold text-blue-700 mb-1">
          ${props.ilAd} · ${props.ilceAd} · ${props.mahalleAd}
        </div>
        <div class="text-sm font-bold text-slate-900 mb-2">
          Ada: <span class="font-mono">${props.adaNo}</span> / Parsel: <span class="font-mono">${props.parselNo}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
          <div>
            <span class="text-slate-500 block text-[10px]">Arsa Alanı</span>
            <span class="font-mono font-semibold text-slate-900">${props.alanFormatted}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px]">Nitelik</span>
            <span class="font-medium text-slate-800">${props.nitelik}</span>
          </div>
        </div>
      </div>
    `;

    geoJsonLayer.bindPopup(popupHtml);
    geoJsonLayer.addTo(group);

    const centerIcon = L.divIcon({
      className: 'custom-parcel-center',
      html: `<div class="tkgm-parcel-center-label">Ada ${props.adaNo} / Parsel ${props.parselNo} · ${props.alanFormatted}</div>`,
      iconSize: [160, 26],
      iconAnchor: [80, 13],
    });
    L.marker([props.merkezEnlem, props.merkezBoylam], {
      icon: centerIcon,
      interactive: false,
    }).addTo(group);

    if (showVertices && props.koseKoordinatlari?.length) {
      props.koseKoordinatlari.forEach((pt) => {
        const vm = L.circleMarker([pt.lat, pt.lng], {
          radius: 5,
          color: '#0f172a',
          weight: 2,
          fillColor: '#facc15',
          fillOpacity: 1,
        });
        vm.bindTooltip(`K${pt.no}: ${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)}`, {
          direction: 'top',
          className: 'tkgm-vertex-label',
        });
        vm.addTo(group);
      });
    }

    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [70, 70], maxZoom: 18, duration: 0.8 });
    }
  }, [activeParcel, showVertices]);

  useEffect(() => {
    const group = savedLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showAllSavedOnMap) return;

    savedParcels.forEach((item) => {
      if (activeParcel && item.feature.properties.id === activeParcel.properties.id) return;
      const layer = L.geoJSON(item.feature, {
        style: {
          color: item.isFavorite ? '#f59e0b' : '#64748b',
          weight: 2,
          dashArray: '4 4',
          fillColor: item.isFavorite ? '#f59e0b' : '#475569',
          fillOpacity: 0.2,
        },
      });
      layer.on('click', () => onSelectSavedParcel(item.feature));
      layer.bindTooltip(
        `${item.feature.properties.mahalleAd} Ada ${item.feature.properties.adaNo} / Parsel ${item.feature.properties.parselNo}`,
        { direction: 'top' }
      );
      layer.addTo(group);
    });
  }, [savedParcels, showAllSavedOnMap, activeParcel, onSelectSavedParcel]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-900 ${mapClickMode ? 'cursor-crosshair' : ''}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Click Helper Banner */}
      {mapClickMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 bg-amber-500 text-slate-950 font-semibold text-xs rounded-xl shadow-2xl flex items-center gap-2 pointer-events-none animate-pulse">
          <MousePointerClick className="w-4 h-4" />
          <span>Parsel seçmek için harita üzerinde herhangi bir yere tıklayın</span>
        </div>
      )}

      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 z-[500] flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-lg">
          {(Object.keys(TILE_LAYERS) as MapBaseLayer[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBaseLayer(key)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                baseLayer === key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {TILE_LAYERS[key].shortName}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleMapClickMode}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors shadow-lg whitespace-nowrap shrink-0 ${
            mapClickMode
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 backdrop-blur-md'
          }`}
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>{mapClickMode ? 'Haritadan Seçim Aktif' : 'Haritadan Tıkla'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowVertices((v) => !v)}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border transition-colors shadow-lg backdrop-blur-md ${
            showVertices
              ? 'bg-slate-900/90 text-sky-400 border-sky-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Köşeler</span>
        </button>

        <button
          type="button"
          onClick={onToggleShowAllSaved}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border transition-colors shadow-lg backdrop-blur-md ${
            showAllSavedOnMap
              ? 'bg-slate-900/90 text-amber-400 border-amber-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80'
          }`}
        >
          {showAllSavedOnMap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Kayıtlar ({savedParcels.length})</span>
        </button>
      </div>

      {/* Right Zoom Controls */}
      <div className="absolute top-3 right-3 z-[500] flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl overflow-hidden shadow-lg">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 text-slate-200 hover:bg-slate-800 transition-colors border-b border-slate-800"
            aria-label="Yakınlaştır"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Uzaklaştır"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
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
            className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-500 transition-colors"
            title="Parsele Odaklan"
            aria-label="Parsele Odaklan"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Bottom Coordinate HUD */}
      <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-2.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl text-xs text-slate-300 shadow-lg pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono tabular-nums text-white">
            {cursorCoords.lat.toFixed(5)}°K, {cursorCoords.lng.toFixed(5)}°D
          </span>
        </div>
        <span className="text-slate-600">·</span>
        <div className="font-mono tabular-nums text-slate-300">Z{currentZoom}</div>
      </div>
    </div>
  );
};
