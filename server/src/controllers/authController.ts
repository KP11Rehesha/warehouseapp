import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.users.findUnique({
        where: { email: email as string },
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.users.create({
        data: {
          email: email as string,
          password: hashedPassword,
          name: name as string,
        },
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.userId }, JWT_SECRET, {
        expiresIn: '24h',
      });

      // Set cookie
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      console.log('Token set in cookie:', token);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
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
      console.log('Login attempt for email:', email);

      // Find user
      const user = await prisma.users.findUnique({
        where: { email: email as string },
      });

      if (!user) {
        console.log('User not found for email:', email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', user.email);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.userId }, JWT_SECRET, {
        expiresIn: '24h',
      });

      // Set cookie
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      console.log('Token set in cookie:', token);

      res.json({
        message: 'Login successful',
        user: {
          userId: user.userId,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async logout(req: Request, res: Response) {
    res.clearCookie('auth-token', { path: '/' });
    res.json({ message: 'Logged out successfully' });
  },

  async checkAuth(req: Request, res: Response) {
    try {
      const token = req.cookies['auth-token'];
      console.log('Token from cookie:', token);
      
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      console.log('Decoded token:', decoded);

      const user = await prisma.users.findUnique({
        where: { userId: decoded.userId },
        select: {
          userId: true,
          email: true,
          name: true,
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