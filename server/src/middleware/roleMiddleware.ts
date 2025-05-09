import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

// Extend Express Request type to include user role
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}

export const roleMiddleware = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = roleMiddleware([Role.ADMIN]);

// Convenience middleware for warehouse staff routes
export const requireWarehouseStaff = roleMiddleware([Role.ADMIN, Role.WAREHOUSE_STAFF]); 