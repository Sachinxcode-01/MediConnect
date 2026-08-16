import { Appointment, User } from '../models/index.js';
import crypto from 'crypto';

// Generate unique room code for video calls
const generateRoomCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
export const createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, title, description, startTime, endTime, type } = req.body;

    // Validate times
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const conflict = await Appointment.findOne({
      doctor: doctorId,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: 'Time slot conflict' });
    }

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      title,
      description,
      startTime,
      endTime,
      type: type || 'video',
      roomCode: generateRoomCode()
    });

    const populated = await Appointment.findById(appointment.id);

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient appointments
// @route   GET /api/appointments/patient
// @access  Private (Patient)
export const getPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor appointments
// @route   GET /api/appointments/doctor
// @access  Private (Doctor)
export const getDoctorAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming appointments
// @route   GET /api/appointments/upcoming
// @access  Private
export const getUpcomingAppointments = async (req, res, next) => {
  try {
    const now = new Date();
    const query = req.user.role === 'doctor' 
      ? { doctor: req.user.id, startTime: { $gte: now } }
      : { patient: req.user.id, startTime: { $gte: now } };

    const appointments = await Appointment.find({ 
      ...query,
      limit: 10
    });

    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Authorization check
    if (appointment.patient._id.toString() !== req.user.id && 
        appointment.doctor._id.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status }
    );

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private
export const cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancellationReason: reason || '' },
      { new: true }
    ).populate('patient', 'name email').populate('doctor', 'name specialty');

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

// @desc    Join appointment room
// @route   GET /api/appointments/:id/join
// @access  Private
export const joinRoom = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Authorization check
    if (appointment.patient.toString() !== req.user.id && 
        appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ 
      success: true, 
      roomCode: appointment.roomCode,
      appointment 
    });
  } catch (error) {
    next(error);
  }
};
