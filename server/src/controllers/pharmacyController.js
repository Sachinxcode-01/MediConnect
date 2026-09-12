import axios from 'axios';

// Simulated pharmacy database (in production, use Google Places API)
const simulatedPharmacies = [
  { id: '1', name: 'CVS Pharmacy', address: '123 Main St', phone: '(555) 123-4567', distance: 0.3, rating: 4.2, hours: '24 hours', services: ['prescription', 'vaccination', 'consultation'] },
  { id: '2', name: 'Walgreens', address: '456 Oak Ave', phone: '(555) 234-5678', distance: 0.8, rating: 4.0, hours: '8AM-10PM', services: ['prescription', 'photo', 'consultation'] },
  { id: '3', name: 'Rite Aid', address: '789 Pine Rd', phone: '(555) 345-6789', distance: 1.2, rating: 3.8, hours: '9AM-9PM', services: ['prescription', 'vaccination'] },
  { id: '4', name: 'Community Pharmacy', address: '321 Elm St', phone: '(555) 456-7890', distance: 1.5, rating: 4.5, hours: '9AM-6PM', services: ['prescription', 'compounding', 'consultation'] },
  { id: '5', name: 'Health Mart', address: '654 Maple Dr', phone: '(555) 567-8901', distance: 2.0, rating: 4.3, hours: '8AM-8PM', services: ['prescription', 'delivery'] }
];

// @desc    Find nearby pharmacies
// @route   GET /api/pharmacy/nearby
// @access  Private
export const findNearbyPharmacies = async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat || req.body.lat) || 40.7128;
    const lng = parseFloat(req.query.lng || req.body.lng) || -74.0060;
    const limit = parseInt(req.query.limit || req.body.limit) || 10;

    const offsets = [
      { dLat: 0.0045, dLng: 0.0062 },
      { dLat: -0.0072, dLng: -0.0054 },
      { dLat: 0.0115, dLng: -0.0098 },
      { dLat: -0.0132, dLng: 0.0125 },
      { dLat: 0.0088, dLng: -0.0165 }
    ];

    let pharmacies = simulatedPharmacies.slice(0, limit).map((p, idx) => {
      const offset = offsets[idx % offsets.length];
      return {
        ...p,
        lat: lat + offset.dLat,
        lng: lng + offset.dLng
      };
    });

    // Filter by services if provided
    if (req.query.services) {
      const services = req.query.services.split(',');
      pharmacies = pharmacies.filter(p => services.every(s => p.services.includes(s)));
    }

    res.status(200).json({ success: true, count: pharmacies.length, data: pharmacies });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pharmacy details
// @route   GET /api/pharmacy/:id
// @access  Private
export const getPharmacy = async (req, res, next) => {
  try {
    const pharmacy = simulatedPharmacies.find(p => p.id === req.params.id);
    
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.status(200).json({ success: true, data: pharmacy });
  } catch (error) {
    next(error);
  }
};
