// ProjectMapView.jsx - Visualización general de todos los proyectos georreferenciados
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatUSD, formatDate } from '../../utils/format.js';

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

export const ProjectMapView = ({ projects = [] }) => {
  return (
    <div className="h-[calc(100vh-240px)] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-10">
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Iterar y mostrar marcadores para proyectos válidos */}
        {projects
          .filter(p => p.latitud && p.longitud)
          .map(p => (
            <Marker key={p.id} position={[Number(p.latitud), Number(p.longitud)]}>
              <Popup>
                <div className="text-xs space-y-2.5 min-w-[200px] text-slate-800 dark:text-slate-200">
                  <div className="border-b pb-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Nombre del Proyecto:</span>
                    <span className="font-bold text-slate-800 dark:text-white leading-tight block">{p.nombre}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Estado:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{p.estado || p.etapa}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Presupuesto:</span>
                      <span className="font-bold text-[#10B981]">{formatUSD(p.presupuesto)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Fecha Inicio:</span>
                      <span className="font-medium text-slate-600 dark:text-slate-350">{formatDate(p.fecha_inicio)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Fecha Fin:</span>
                      <span className="font-medium text-slate-600 dark:text-slate-350">{formatDate(p.fecha_fin)}</span>
                    </div>
                  </div>

                  <div className="border-t pt-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Unidad Responsable:</span>
                    <span className="font-semibold text-[#134074] dark:text-[#8DA9C4]">{p.direccion_nombre || 'Obras Públicas'}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default ProjectMapView;
