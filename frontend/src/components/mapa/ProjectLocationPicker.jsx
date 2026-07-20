// ProjectLocationPicker.jsx - Selector de ubicación geográfica interactivo para proyectos
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Importar imágenes de Leaflet para solucionar el bug de empaquetado de iconos
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [-1.6669, -78.6471]; // Riobamba, Ecuador

// Componente helper para centrar el mapa cuando cambian coordenadas externas/manuales
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Componente helper para capturar los clics del usuario en el mapa y dibujar el marcador
function MapEventsHandler({ setPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
    },
  });
  return null;
}

export const ProjectLocationPicker = ({ lat, lng, onChange }) => {
  const [position, setPosition] = useState(null);

  // Inicializar o sincronizar posición
  useEffect(() => {
    if (lat && lng) {
      setPosition([Number(lat), Number(lng)]);
    } else {
      setPosition(null);
    }
  }, [lat, lng]);

  // Actualizar coordenadas hacia el formulario padre
  const updatePosition = (newPos) => {
    setPosition(newPos);
    if (onChange) {
      onChange(newPos[0], newPos[1]);
    }
  };

  const handleManualChange = (field, val) => {
    const numVal = val === '' ? '' : Number(val);
    if (field === 'lat') {
      onChange(numVal, lng || DEFAULT_CENTER[1]);
    } else {
      onChange(lat || DEFAULT_CENTER[0], numVal);
    }
  };

  const markerPosition = position || DEFAULT_CENTER;

  return (
    <div className="space-y-3">
      {/* Campos de Entrada Manual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-550 mb-1 font-semibold">Latitud:</label>
          <input 
            type="number" 
            step="any"
            value={lat || ''} 
            onChange={(e) => handleManualChange('lat', e.target.value)}
            placeholder="-1.6669" 
            className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-550 mb-1 font-semibold">Longitud:</label>
          <input 
            type="number" 
            step="any"
            value={lng || ''} 
            onChange={(e) => handleManualChange('lng', e.target.value)}
            placeholder="-78.6471" 
            className="w-full bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#8DA9C4] focus:outline-none"
          />
        </div>
      </div>

      {/* Mapa de Leaflet */}
      <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler setPosition={updatePosition} />
          <ChangeView center={markerPosition} />
          
          <Marker 
            position={markerPosition}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                const newPos = marker.getLatLng();
                updatePosition([newPos.lat, newPos.lng]);
              }
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default ProjectLocationPicker;
