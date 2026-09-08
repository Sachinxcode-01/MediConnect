import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Navigation, Clock, Phone, Star, Filter, Search, AlertCircle, Loader2, Truck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DeliveryTracker from './DeliveryTracker';
import api from '../api/axios';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom pharmacy icon
const pharmacyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/883/883458.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Map center component
const MapCenter = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const PharmacyFinder = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'open', '24h'
  const [searchTerm, setSearchTerm] = useState('');
  const [locationError, setLocationError] = useState(null);
  const [deliveryTracking, setDeliveryTracking] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState({ distance: '', time: '', status: '' });

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  }, []);

  // Fetch pharmacies from API
  const fetchPharmacies = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const res = await api.post('/api/pharmacy/nearby', { lat, lng });
      const pharmaciesWithDistance = res.data.map((pharm) => ({
        ...pharm,
        distance: calculateDistance(lat, lng, pharm.lat, pharm.lng),
      }));
      setPharmacies(pharmaciesWithDistance);
    } catch (error) {
      console.error('Failed to fetch pharmacies:', error);
      toast.error('Failed to load pharmacies');
      // Fallback to mock data
      const mockPharmacies = [
        { name: 'MediCare Pharmacy', address: '123 Main St', open: true, lat: lat + 0.01, lng: lng + 0.01, phone: '(555) 123-4567', rating: 4.5, hours: '9 AM - 9 PM' },
        { name: 'HealthPlus Central', address: '456 Oak Avenue', open: true, lat: lat - 0.01, lng: lng - 0.02, phone: '(555) 234-5678', rating: 4.8, hours: '8 AM - 10 PM' },
        { name: 'City Care Meds', address: '789 Pine Road', open: false, lat: lat + 0.02, lng: lng - 0.01, phone: '(555) 345-6789', rating: 4.2, hours: 'Closed' },
        { name: '24/7 Pharmacy Plus', address: '321 Elm Street', open: true, lat: lat + 0.015, lng: lng + 0.02, phone: '(555) 456-7890', rating: 4.6, hours: 'Open 24 Hours', is24h: true },
        { name: 'Community Pharmacy', address: '654 Maple Drive', open: true, lat: lat - 0.02, lng: lng + 0.01, phone: '(555) 567-8901', rating: 4.3, hours: '9 AM - 8 PM' },
      ].map((pharm) => ({
        ...pharm,
        distance: calculateDistance(lat, lng, pharm.lat, pharm.lng),
      }));
      setPharmacies(mockPharmacies);
    } finally {
      setLoading(false);
    }
  }, [calculateDistance]);

  // Get user's actual location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        fetchPharmacies(latitude, longitude);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError('Unable to get your location. Using default (New York).');
        fetchPharmacies(40.7128, -74.0060);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchPharmacies]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getUserLocation();
    }, 0);
    return () => clearTimeout(timer);
  }, [getUserLocation]);

  // Filter pharmacies
  const filteredPharmacies = pharmacies.filter((pharm) => {
    const matchesFilter =
      filter === 'all' || (filter === 'open' && pharm.open) || (filter === '24h' && pharm.is24h);
    const matchesSearch =
      searchTerm === '' ||
      pharm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharm.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDirections = (pharmacy) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`;
    window.open(url, '_blank');
  };

  const callPharmacy = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-3d border border-themeMedium/30 h-full flex flex-col min-h-[600px]">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-themeDeep flex items-center gap-3">
          <MapPin className="text-themePrimary" /> Smart Pharmacy Finder
        </h2>
        <p className="text-themeDark/60 font-bold text-xs uppercase mt-1">
          Geospatial matching enabled
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-themeDark/40" size={20} />
          <input
            type="text"
            placeholder="Search pharmacies by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-themeLight border-2 border-themeMedium/20 rounded-xl focus:outline-none focus:border-themePrimary font-bold text-sm transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              filter === 'all'
                ? 'bg-themePrimary text-white shadow-neon'
                : 'bg-themeSoft text-themeDark hover:bg-themeMedium'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
              filter === 'open'
                ? 'bg-themePrimary text-white shadow-neon'
                : 'bg-themeSoft text-themeDark hover:bg-themeMedium'
            }`}
          >
            <Clock size={14} /> Open Now
          </button>
          <button
            onClick={() => setFilter('24h')}
            className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              filter === '24h'
                ? 'bg-themeDeep text-white shadow-neon'
                : 'bg-themeSoft text-themeDark hover:bg-themeMedium'
            }`}
          >
            24 Hours
          </button>
        </div>
      </div>

      {/* Location Status */}
      {locationError && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <p className="text-sm font-bold text-yellow-800">{locationError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Pharmacy List */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="animate-spin text-themePrimary" size={40} />
              <p className="text-sm font-black text-themeDark/50 uppercase mt-4">Loading Pharmacies...</p>
            </div>
          ) : filteredPharmacies.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="w-16 h-16 text-themeMedium mx-auto mb-4 opacity-50" />
              <p className="text-themeDeep font-black text-xl">No pharmacies found</p>
              <p className="text-themeDark/60 font-medium text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            filteredPharmacies.map((pharm, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ x: 5, scale: 1.02 }}
                onClick={() => setSelectedPharmacy(pharm)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all group ${
                  selectedPharmacy === pharm
                    ? 'bg-themePrimary/10 border-themePrimary shadow-neon'
                    : 'bg-themeLight border-themeMedium/30 hover:border-themePrimary hover:shadow-neon'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-themeDeep text-lg group-hover:text-themePrimary transition">
                    {pharm.name}
                  </h3>
                  {pharm.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={14} />
                      <span className="text-xs font-black text-themeDeep">{pharm.rating}</span>
                    </div>
                  )}
                </div>
                <p className="text-themeDark/70 text-sm font-medium flex items-start gap-2 mt-2">
                  <MapPin size={16} className="mt-0.5 text-themePrimary shrink-0" />{' '}
                  {pharm.address}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        pharm.open
                          ? 'bg-themePrimary text-white shadow-neon'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {pharm.open ? 'Open Now' : 'Closed'}
                    </span>
                    {pharm.is24h && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-themeDeep text-white">
                        24h
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-themeDark/50">
                    {pharm.distance} km away
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Interactive Map */}
        <div className="lg:col-span-2 bg-themeLight rounded-3xl border border-themeMedium/20 relative overflow-hidden shadow-inner min-h-[500px]">
          <MapContainer
            center={userLocation}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            className="rounded-3xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenter lat={userLocation.lat} lng={userLocation.lng} />

            {/* User location marker */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>
                <strong>Your Location</strong>
                <br />
                Starting point for directions
              </Popup>
            </Marker>

            {/* Live Delivery Tracker Component */}
            {deliveryTracking && (
              <DeliveryTracker
                source={deliveryTracking}
                destination={userLocation}
                onStatusUpdate={setDeliveryStatus}
              />
            )}

            {/* Pharmacy markers - hide if tracking */}
            {!deliveryTracking && filteredPharmacies.map((pharm, idx) => (
              <Marker
                key={idx}
                position={[pharm.lat, pharm.lng]}
                icon={pharmacyIcon}
                eventHandlers={{
                  click: () => setSelectedPharmacy(pharm),
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h4 className="font-black text-themeDeep mb-1">{pharm.name}</h4>
                    <p className="text-xs text-themeDark/70 mb-2">{pharm.address}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          pharm.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {pharm.open ? 'Open' : 'Closed'}
                      </span>
                      {pharm.distance && (
                        <span className="text-[10px] font-bold text-themeDark">{pharm.distance} km</span>
                      )}
                    </div>
                    <button
                      onClick={() => getDirections(pharm)}
                      className="w-full py-2 bg-themePrimary text-white rounded-lg text-xs font-black uppercase hover:bg-themeDark transition-all"
                    >
                      Directions
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map overlay with selected pharmacy info */}
          <AnimatePresence>
            {selectedPharmacy && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-2xl border border-themeMedium/30 p-5 z-[1000]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-themeDeep text-lg">{selectedPharmacy.name}</h3>
                    {selectedPharmacy.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="text-yellow-500 fill-yellow-500" size={12} />
                        <span className="text-xs font-bold">{selectedPharmacy.rating}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPharmacy(null)}
                    className="p-1 hover:bg-themeSoft rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-themeDark/70 font-medium mb-3">{selectedPharmacy.address}</p>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} className="text-themePrimary" />
                  <span className="text-xs font-bold">{selectedPharmacy.hours || 'Hours unavailable'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => getDirections(selectedPharmacy)}
                    className="flex-1 py-3 bg-themePrimary text-white rounded-xl text-xs font-black uppercase shadow-neon hover:shadow-neon-hover transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation size={14} /> Directions
                  </button>
                  {selectedPharmacy.phone && (
                    <button
                      onClick={() => callPharmacy(selectedPharmacy.phone)}
                      className="px-4 py-3 bg-themeSoft text-themePrimary rounded-xl font-black uppercase border border-themePrimary/20 hover:bg-themeMedium transition-all"
                    >
                      <Phone size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setDeliveryTracking(selectedPharmacy);
                    setSelectedPharmacy(null);
                  }}
                  className="w-full mt-3 py-3 border-2 border-themePrimary text-themePrimary hover:bg-themePrimary hover:text-white rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                >
                  <Truck size={14} /> Order Medicine & Track
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delivery Tracking Overlay */}
          <AnimatePresence>
            {deliveryTracking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-4 right-4 md:w-80 bg-white rounded-2xl shadow-2xl border border-themeMedium/30 p-5 z-[1000] backdrop-blur-md bg-white/90"
              >
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-themeDeep flex items-center gap-2">
                     <span className="relative flex h-3 w-3 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-themePrimary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-themePrimary"></span>
                    </span>
                    Live Tracking
                  </h3>
                  <button
                    onClick={() => setDeliveryTracking(null)}
                    className="p-1 hover:bg-themeSoft rounded-full transition-colors text-themeDark/60"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-themeSoft/50 rounded-xl p-4 mb-4 border border-themeMedium/20">
                  <p className="text-themeDeep font-black text-lg mb-1">{deliveryStatus.status || "Calculating Route..."}</p>
                  <div className="flex gap-4 mt-2">
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-themeDark/60">Est. Time</span>
                        <span className="font-black text-themePrimary">{deliveryStatus.time || "--"}</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-themeDark/60">Distance</span>
                        <span className="font-black text-themeDeep">{deliveryStatus.distance || "--"}</span>
                     </div>
                  </div>
                </div>

                <div className="border-t border-themeMedium/20 pt-4 flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-themeLight flex items-center justify-center shrink-0">
                      <Truck className="text-themePrimary" size={18} />
                   </div>
                   <div>
                     <p className="text-sm font-black text-themeDeep">Delivery Partner</p>
                     <p className="text-xs font-medium text-themeDark/60">Assigned & On the way</p>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PharmacyFinder;
