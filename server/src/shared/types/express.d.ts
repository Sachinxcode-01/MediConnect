export {};

declare global {
  namespace Express {
    export interface AuthUser {
      id: string;
      role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
      email?: string;
    }

    export interface Request {
      user?: AuthUser;
      file?: Multer.File;
      files?: { [fieldname: string]: Multer.File[] } | Multer.File[];
    }
  }
}
