import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Define AuthenticatedRequest to align with global augmentation in authMiddleware.ts
interface AuthenticatedRequest extends Request { // Use Express Request
  user?: {
    userId: string; // Changed back to userId
    role: Role;
  };
}

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userIdFromAuth = req.user?.userId; // Use userId
  const userRoleFromAuth = req.user?.role;

  if (!userIdFromAuth) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    let notifications;
    if (userRoleFromAuth === Role.ADMIN) {
      notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { userId: userIdFromAuth },
            { userId: null } 
          ],
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true } } },
      });
    } else {
      notifications = await prisma.notification.findMany({
        where: {
          userId: userIdFromAuth,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, sku: true } } },
      });
    }
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: (error as Error).message });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.userId; // Use userId
  const currentUserRole = req.user?.role;
  const { notificationId } = req.params;

  if (!currentUserId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!notificationId) {
    return res.status(400).json({ message: 'Notification ID is required' });
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    let canMarkAsRead = false;
    if (notification.userId === currentUserId) {
      canMarkAsRead = true;
    } else if (notification.userId === null && currentUserRole === Role.ADMIN) {
      canMarkAsRead = true;
    }

    if (!canMarkAsRead) {
      return res.status(403).json({ message: 'Forbidden: You cannot mark this notification as read' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }, 
    });
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: (error as Error).message });
  }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const userIdFromAuth = req.user?.userId; // Use userId
  const userRoleFromAuth = req.user?.role;

  if (!userIdFromAuth) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    if (userRoleFromAuth === Role.ADMIN) {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: userIdFromAuth },
            { userId: null }
          ],
          isRead: false,
        },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: {
          userId: userIdFromAuth,
          isRead: false,
        },
        data: { isRead: true },
      });
    }
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read', error: (error as Error).message });
  }
}; 