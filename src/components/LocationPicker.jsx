import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Map.css';
import { Search } from 'lucide-react';

const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [lng, setLng] = useState(initialLocation?.lng || 106.8272);
  const [lat, setLat] = useState(initialLocation?.lat || -6.1751);
  const [zoom] = useState(12);
  const [apiKey] = useState('Nywl23O7mN6Ol38RtL5g');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lngInput, setLngInput] = useState(String(initialLocation?.lng ?? 106.8272));
  const [latInput, setLatInput] = useState(String(initialLocation?.lat ?? -6.1751));
  const flyToTimer = useRef(null);
  const reverseGeocodeDebouncedRef = useRef(null);

  // Update marker position and map view
  const updateMarkerPosition = (newLng, newLat) => {
    if (marker.current) {
      marker.current.setLngLat([newLng, newLat]);
    }
    if (map.current) {
      if (flyToTimer.current) clearTimeout(flyToTimer.current);
      flyToTimer.current = setTimeout(() => {
        if (!map.current) return;
        map.current.flyTo({
          center: [newLng, newLat],
          essential: true
        });
      }, 200);
    }
  };

  // Handle address search
  const handleSearch = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation(); // Mencegah event bubbling
    
    const query = searchQuery.trim();
    if (!query) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        setLng(longitude);
        setLat(latitude);
        setLngInput(String(longitude));
        setLatInput(String(latitude));
        updateMarkerPosition(longitude, latitude);
        
        // Update the search field with the found address
        // Hanya update query jika pencarian berhasil
        const placeName = data.features[0].place_name;
        setSearchQuery(placeName);
        
        if (onLocationSelect) {
          onLocationSelect({ lng: longitude, lat: latitude });
        }
      } else {
        alert('Alamat tidak ditemukan. Silakan coba dengan kata kunci lain.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      alert('Terjadi kesalahan saat mencari alamat. Silakan coba lagi.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle manual coordinate input
  const handleCoordinateChange = (type, value) => {
    if (type === 'lat') {
      setLatInput(value);
    } else {
      setLngInput(value);
    }
  };

  const applyCoordinateInput = (type) => {
    const raw = type === 'lat' ? latInput : lngInput;
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      if (type === 'lat') setLatInput(String(lat)); else setLngInput(String(lng));
      return;
    }
    let newLat = lat;
    let newLng = lng;
    if (type === 'lat') {
      newLat = Math.max(-90, Math.min(90, parsed));
      setLat(newLat);
      setLatInput(String(newLat));
    } else {
      newLng = Math.max(-180, Math.min(180, parsed));
      setLng(newLng);
      setLngInput(String(newLng));
    }
    if (marker.current) {
      marker.current.setLngLat([newLng, newLat]);
    }
    if (map.current) {
      if (flyToTimer.current) clearTimeout(flyToTimer.current);
      flyToTimer.current = setTimeout(() => {
        if (!map.current) return;
        map.current.flyTo({ center: [newLng, newLat], essential: true });
      }, 200);
    }
    if (onLocationSelect) {
      onLocationSelect({ lng: newLng, lat: newLat });
    }
    if (reverseGeocodeDebouncedRef.current) {
      reverseGeocodeDebouncedRef.current(newLng, newLat);
    }
  };

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      const container = mapContainer.current;
      container.style.width = '100%';
      container.style.height = '300px';
      
      try {
        const mapElement = document.createElement('div');
        mapElement.style.width = '100%';
        mapElement.style.height = '100%';
        mapContainer.current.innerHTML = '';
        mapContainer.current.appendChild(mapElement);

        // Initialize map
        map.current = new maplibregl.Map({
          container: mapElement,
          style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
          center: [lng, lat],
          zoom: zoom
        });

        // Add navigation control
        const nav = new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        });
        map.current.addControl(nav, 'top-right');
        
        // Add geolocation control
        const geolocate = new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserLocation: true,
          showAccuracyCircle: true,
          position: 'top-right'
        });
        
        // Add marker
        marker.current = new maplibregl.Marker({
          color: "#FF0000",
          draggable: true
        })
          .setLngLat([lng, lat])
          .addTo(map.current);

        // Handle marker drag end
        marker.current.on('dragend', () => {
          const newLngLat = marker.current.getLngLat();
          setLng(newLngLat.lng);
          setLat(newLngLat.lat);
          setLngInput(String(newLngLat.lng));
          setLatInput(String(newLngLat.lat));
          if (onLocationSelect) onLocationSelect({ lng: newLngLat.lng, lat: newLngLat.lat });
          if (reverseGeocodeDebouncedRef.current) reverseGeocodeDebouncedRef.current(newLngLat.lng, newLngLat.lat);
        });

        // Handle map click
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          setLng(lng);
          setLat(lat);
          updateMarkerPosition(lng, lat);
          if (onLocationSelect) onLocationSelect({ lng, lat });
          setLngInput(String(lng));
          setLatInput(String(lat));
          if (reverseGeocodeDebouncedRef.current) reverseGeocodeDebouncedRef.current(lng, lat);
        });

        // Handle geolocation
        geolocate.on('geolocate', (e) => {
          const lng = e.coords.longitude;
          const lat = e.coords.latitude;
          setLng(lng);
          setLat(lat);
          updateMarkerPosition(lng, lat);
          if (onLocationSelect) onLocationSelect({ lng, lat });
          setLngInput(String(lng));
          setLatInput(String(lat));
          if (reverseGeocodeDebouncedRef.current) reverseGeocodeDebouncedRef.current(lng, lat);
        });

        map.current.addControl(geolocate, 'top-right');

      } catch (error) {
        console.error('Error creating map:', error);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey]);

  // Handle initialLocation changes
  useEffect(() => {
    if (initialLocation && map.current) {
      setLng(initialLocation.lng);
      setLat(initialLocation.lat);
      setLngInput(String(initialLocation.lng));
      setLatInput(String(initialLocation.lat));
      updateMarkerPosition(initialLocation.lng, initialLocation.lat);
    }
  }, [initialLocation]);

  useEffect(() => {
    const reverseGeocode = async (x, y) => {
      try {
        const resp = await fetch(`https://api.maptiler.com/geocoding/${x},${y}.json?key=${apiKey}`);
        if (!resp.ok) return;
        const data = await resp.json();
        if (data.features && data.features.length > 0) {
          const placeName = data.features[0].place_name;
          setSearchQuery(placeName);
        }
      } catch (err) {
        console.error('Error reverse geocoding:', err);
      }
    };
    const debounced = ((fn, delay) => {
      let t;
      return (a, b) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(a, b), delay);
      };
    })(reverseGeocode, 400);
    reverseGeocodeDebouncedRef.current = debounced;
    return () => {
      reverseGeocodeDebouncedRef.current = null;
    };
  }, [apiKey]);

  return (
    <div className="w-full space-y-3 pb-8">
      {/* Search Bar */}
      <div className="space-y-1">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
            placeholder="Cari alamat atau nama jalan..."
            className="w-full p-3 pl-10 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <button 
            type="button"
            disabled={isSearching}
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 h-9 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {isSearching ? 'Mencari...' : 'Cari'}
          </button>
        </div>
        <p className="text-xs text-gray-500 pl-1">
          Hasil prediksi mungkin tidak akurat. Silakan isi detail alamat, contoh: <span className="font-medium">Jalan Abdul Hakim, Medan, Medan Selayang, Medan, Indonesia</span>
        </p>
      </div>

      {/* Map Container */}
      <div style={{
        width: '100%',
        height: '300px',
        position: 'relative',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f3f4f6',
        marginBottom: '1.5rem'
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            step="0.000001"
            value={latInput}
            onChange={(e) => handleCoordinateChange('lat', e.target.value)}
            onBlur={() => applyCoordinateInput('lat')}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            step="0.000001"
            value={lngInput}
            onChange={(e) => handleCoordinateChange('lng', e.target.value)}
            onBlur={() => applyCoordinateInput('lng')}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Klik pada peta untuk memilih lokasi, geser marker, atau masukkan koordinat secara manual
      </p>
    </div>
  );
};

export default LocationPicker;

