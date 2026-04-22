import { MedicalRecord } from '../models/index.js';
import { User } from '../models/index.js';
import { uploadToCloudinary } from '../utils/cloudinaryService.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads (local disk storage as fallback)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/records';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'record-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// @desc    Create medical record
// @route   POST /api/records
// @access  Private (Doctor)
export const createRecord = async (req, res, next) => {
  try {
    const { patientId, type, title, description, visitDate } = req.body;

    let fileUrl = '';
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.path, 'medical_records');
        fileUrl = uploadResult.url;
        // Clean up the local file after successful upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        return res.status(500).json({ success: false, message: 'Failed to upload document to cloud storage' });
      }
    }

    const record = await MedicalRecord.create({
      patient: patientId,
      doctor: req.user.id,
      type,
      title,
      description,
      fileUrl,
      visitDate: visitDate || new Date(),
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient records
// @route   GET /api/records/patient/:patientId
// @access  Private
export const getPatientRecords = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (req.user.id !== patientId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const records = await MedicalRecord.find({ patient: patientId });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my records (for patients)
// @route   GET /api/records/my
// @access  Private (Patient)
export const getMyRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ patient: req.user.id });
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single record
// @route   GET /api/records/:id
// @access  Private
export const getRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Update record
// @route   PUT /api/records/:id
// @access  Private (Doctor)
export const updateRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete record
// @route   DELETE /api/records/:id
// @access  Private (Doctor, Admin)
export const deleteRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    await record.deleteOne();
    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor's records
// @route   GET /api/records/doctor/my
// @access  Private (Doctor)
export const getDoctorRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ doctor: req.user.id });
    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Save AI-generated consultation brief (Clinical Scribe)
// @route   POST /api/records/scribe
// @access  Private (Doctor)
export const saveScribeBrief = async (req, res, next) => {
  try {
    const { patientId, consultationBrief } = req.body;

    if (!patientId || !consultationBrief) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and brief content are required'
      });
    }

    const record = await MedicalRecord.create({
      patient: patientId,
      doctor: req.user.id,
      type: 'visit-summary',
      title: `AI Consultation Brief - ${new Date().toLocaleDateString()}`,
      description: consultationBrief,
      fileUrl: '',
      visitDate: new Date(),
      tags: ['AI-Scribe', 'Telehealth'],
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
