import { Request, Response, NextFunction } from 'express';
import { RecordsService } from './records.service.js';

export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
      const actorId = req.user!.id;

      const record = await this.recordsService.createRecord(
        {
          patientId: req.body.patientId,
          doctorId: req.user?.role === 'DOCTOR' ? req.user.id : undefined,
          recordType: req.body.recordType || req.body.type,
          title: req.body.title,
          description: req.body.description,
          fileUrl: req.file ? (req.file as any).path || req.file.destination : req.body.fileUrl,
          tags: req.body.tags,
        },
        actorId,
        clientIp
      );

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  };

  getByPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patientId = String(req.params.patientId);
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
      const actorId = req.user!.id;

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const records = await this.recordsService.getPatientRecords(
        patientId,
        actorId,
        { limit, offset },
        clientIp
      );

      res.status(200).json({
        success: true,
        count: records.length,
        data: records,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
      const actorId = req.user!.id;

      const record = await this.recordsService.getRecordById(id, actorId, clientIp);

      if (!record) {
        res.status(404).json({
          success: false,
          error: 'Medical record not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
      const actorId = req.user!.id;

      const deleted = await this.recordsService.softDeleteRecord(id, actorId, clientIp);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Medical record not found or already deleted',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Medical record soft-deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}
