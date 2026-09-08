import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export interface ValidationOptions {
  requireAuth?: boolean;
  allowedRoles?: Array<'PATIENT' | 'DOCTOR' | 'ADMIN'>;
  checkPatientOwnership?: boolean;
}

export const validateRequest = (
  schema: z.ZodTypeAny,
  options: ValidationOptions = {}
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Zod Schema Validation
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        file: req.file,
      });

      // 2. Zero-Trust RBAC & Identity Verification
      if (options.requireAuth || options.allowedRoles || options.checkPatientOwnership) {
        const user = req.user;

        if (!user) {
          res.status(401).json({
            status: 'Unauthorized',
            error: 'Authentication credentials are required for this resource',
          });
          return;
        }

        if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
          res.status(403).json({
            status: 'Forbidden',
            error: `Access forbidden for role: ${user.role}`,
          });
          return;
        }

        if (options.checkPatientOwnership) {
          const targetPatientId = req.body?.patientId || req.params?.patientId;
          const isSelf = user.role === 'PATIENT' && user.id === targetPatientId;
          const isAuthorizedPractitioner = user.role === 'DOCTOR' || user.role === 'ADMIN';

          if (!isSelf && !isAuthorizedPractitioner) {
            res.status(403).json({
              status: 'Forbidden',
              error: 'Access Denied: You are not authorized to access or modify records for this patient',
            });
            return;
          }
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          status: 'ValidationFailed',
          errors: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
