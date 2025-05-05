import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Users } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: Users;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies['auth-token'];
    console.log('Middleware - Token from cookie:', token);

    if (!token) {
      console.log('Middleware - No token found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log('Middleware - Decoded token:', decoded);

    const user = await prisma.users.findUnique({
      where: { userId: decoded.userId },
    });

    if (!user) {
      console.log('Middleware - User not found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Add user to request object
    req.user = user;
    console.log('Middleware - User authenticated:', user.userId);
    next();
  } catch (error) {
    console.error('Middleware - Auth error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
}; 