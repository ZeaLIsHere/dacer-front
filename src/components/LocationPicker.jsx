import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css'; // Kita akan buat file CSS khusus untuk peta

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(initialLocation?.lng || 106.8272); // Default to Jakarta
  const [lat, setLat] = useState(initialLocation?.lat || -6.1751);
  const [zoom] = useState(12);
  const [apiKey] = useState('Nywl23O7mN6Ol38RtL5g'); // Replace with your MapTiler API key

  useEffect(() => {
    console.log('Initializing map...');
    
    if (!map.current && mapContainer.current) {
      console.log('Creating new map instance...');
      
      // Pastikan container memiliki ukuran yang tepat
      const container = mapContainer.current;
      container.style.width = '100%';
      container.style.height = '300px'; // Atur tinggi yang tetap
      // Inisialisasi map
      try {
        console.log('Creating map with API key:', apiKey);
        
        // Buat elemen container untuk peta
        const mapElement = document.createElement('div');
        mapElement.style.width = '100%';
        mapElement.style.height = '100%';
        mapContainer.current.innerHTML = '';
        mapContainer.current.appendChild(mapElement);
        
        // Inisialisasi peta
        map.current = new maplibregl.Map({
          container: mapElement,
          style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
          center: [lng, lat],
          zoom: zoom
        });
        
        console.log('Map created successfully');
      } catch (error) {
        console.error('Error creating map:', error);
        return;
      }

      // Tambahkan kontrol navigasi
      const nav = new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      });
      map.current.addControl(nav, 'top-right');
      
      // Tambahkan kontrol geolokasi
      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserLocation: true,
        showAccuracyCircle: true,
        showUserLocationOnLoad: false,
        position: 'top-right'
      });
      
      map.current.addControl(geolocate, 'top-right');

      // Tambahkan marker
      const marker = new maplibregl.Marker({
        color: "#FF0000"
      })
        .setLngLat([lng, lat])
        .addTo(map.current);
      
      // Update marker position when map is clicked
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setLng(lng);
        setLat(lat);
        marker.setLngLat([lng, lat]);
        if (onLocationSelect) {
          onLocationSelect({ lng, lat });
        }
      });

      // Auto-locate user when component mounts
      geolocate.on('geolocate', (e) => {
        const lng = e.coords.longitude;
        const lat = e.coords.latitude;
        setLng(lng);
        setLat(lat);
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15
        });
        marker.setLngLat([lng, lat]);
        if (onLocationSelect) {
          onLocationSelect({ lng, lat });
        }
      });

      // Trigger geolocate
      geolocate.trigger();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey, onLocationSelect, initialLocation]);

  return (
    <div className="w-full">
      <div style={{
        width: '100%',
        height: '300px',
        position: 'relative',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f3f4f6',
        marginBottom: '1rem'
      }}>
        <div 
          ref={mapContainer} 
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '100%',
            height: '100%'
          }} 
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="text"
            value={lat.toFixed(6)}
            readOnly
            className="input-field w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="text"
            value={lng.toFixed(6)}
            readOnly
            className="input-field w-full"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Klik pada peta untuk memilih lokasi atau gunakan tombol lokasi untuk mendeteksi posisi Anda
      </p>
    </div>
  );
};

export default LocationPicker;
