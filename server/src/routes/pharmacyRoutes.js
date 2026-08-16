import express from 'express';
import { findNearbyPharmacies, getPharmacy } from '../controllers/pharmacyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/nearby', protect, findNearbyPharmacies);
router.post('/nearby', protect, findNearbyPharmacies);
router.get('/:id', protect, getPharmacy);

export default router;
