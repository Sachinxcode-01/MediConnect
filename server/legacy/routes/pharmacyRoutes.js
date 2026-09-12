const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Mock pharmacy locations API for the Map integration
router.post('/nearby', protect(['patient', 'doctor']), (req, res) => {
    const { lat, lng } = req.body;
    // We send dummy locations around the provided lat, lng
    const dummyPharmacies = [
        { name: "MediCare Pharmacy", address: "123 Main St", open: true, lat: lat + 0.01, lng: lng + 0.01 },
        { name: "HealthPlus Central", address: "456 Oak Avenue", open: true, lat: lat - 0.01, lng: lng - 0.02 },
        { name: "City Care Meds", address: "789 Pine Road", open: false, lat: lat + 0.02, lng: lng - 0.01 }
    ];
    res.json(dummyPharmacies);
});

module.exports = router;
