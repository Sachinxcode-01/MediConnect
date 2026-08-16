import AuditLog from '../models/AuditLog.js';

export const audit = (actionName) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        AuditLog.log({
          actorId: req.user ? (req.user.id || req.user._id) : 'anonymous',
          actorRole: req.user ? req.user.role : 'public',
          action: actionName,
          targetId: req.params.id || req.body.patientId || req.body.doctorId || null,
          result: 'SUCCESS',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        }).catch(err => console.warn('Audit logging failed silently:', err.message));
      }
      return originalSend.apply(res, arguments);
    };
    next();
  };
};

export default audit;
