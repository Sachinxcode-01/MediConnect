import { Request, Response, NextFunction } from 'express';
import { TriageService } from './triage.service.js';
import { AuditService } from '../audit/index.js';

export class TriageController {
  constructor(
    private readonly triageService: TriageService,
    private readonly auditService: AuditService
  ) {}

  evaluate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { symptoms } = req.body;
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
      const actorId = req.user?.id || 'anonymous-intake';

      const triageResult = await this.triageService.evaluateSymptoms(symptoms);

      // Record HIPAA Audit Entry for AI Triage
      await this.auditService.logEvent({
        action: 'TRIAGE_EVALUATION',
        actorId,
        targetResourceType: 'AITriage',
        targetResourceId: `triage-${Date.now()}`,
        ipAddress: clientIp,
        metadata: {
          urgencyLevel: triageResult.urgencyLevel,
          status: triageResult.status,
          recommendedSpecialty: triageResult.recommendedSpecialty,
        },
      });

      res.status(200).json({
        success: true,
        data: triageResult,
      });
    } catch (err) {
      next(err);
    }
  };
}
