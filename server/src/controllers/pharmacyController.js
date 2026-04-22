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
    const { lat, lng, radius = 5, limit = 10 } = req.query;

    // In production, use Google Places API:
    // const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
    //   params: { location: `${lat},${lng}`, radius: radius * 1000, type: 'pharmacy', key: process.env.GOOGLE_MAPS_KEY }
    // });

    // For demo, return simulated pharmacies
    let pharmacies = [...simulatedPharmacies];
    
    // Filter by services if provided
    if (req.query.services) {
      const services = req.query.services.split(',');
      pharmacies = pharmacies.filter(p => services.every(s => p.services.includes(s)));
    }

    // Sort by distance and limit results
    pharmacies = pharmacies.slice(0, parseInt(limit));

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
