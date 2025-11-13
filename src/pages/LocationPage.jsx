import { useState } from 'react';
import LocationPicker from '../components/LocationPicker';

const LocationPage = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pilih Lokasi Anda</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">Klik pada peta untuk memilih lokasi atau gunakan tombol lokasi untuk mendeteksi posisi Anda saat ini.</p>
        
        <LocationPicker onLocationSelect={handleLocationSelect} />
        
        {selectedLocation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h2 className="font-semibold mb-2">Lokasi Terpilih:</h2>
            <p>Latitude: {selectedLocation.lat.toFixed(6)}</p>
            <p>Longitude: {selectedLocation.lng.toFixed(6)}</p>
            <button 
              onClick={() => {
                // Here you can add code to save the location or navigate back
                alert(`Lokasi disimpan: ${selectedLocation.lat}, ${selectedLocation.lng}`);
              }}
              className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Gunakan Lokasi Ini
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPage;
