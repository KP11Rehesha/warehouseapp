import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: email as string },
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with role
      const user = await prisma.users.create({
        data: {
          email: email as string,
          password: hashedPassword,
          name: name as string,
          role: role as Role || Role.WAREHOUSE_STAFF,
        },
      });

      // Generate JWT token with role
      const token = jwt.sign(
        { 
          userId: user.userId,
          role: user.role 
        }, 
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set cookie
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.users.findUnique({
        where: { email: email as string },
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token with role
      const token = jwt.sign(
        { 
          userId: user.userId,
          role: user.role 
        }, 
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set cookie
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        message: 'Login successful',
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      res.clearCookie('auth-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      res.status(200).send();
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).send();
    }
  },

  async checkAuth(req: Request, res: Response) {
    try {
      const token = req.cookies['auth-token'];
      
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: Role };
      
      const user = await prisma.users.findUnique({
        where: { userId: decoded.userId },
        select: {
          userId: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(401).json({ message: 'Unauthorized' });
    }
  },
}; 