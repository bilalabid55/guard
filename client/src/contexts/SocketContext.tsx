import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const apiEnv = process.env.REACT_APP_API_URL;
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const apiBase = isLocalhost
        ? 'http://localhost:5000/api'
        : (apiEnv || 'http://localhost:5000/api');
      const inferredSocketUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
      const socketUrl = process.env.REACT_APP_SOCKET_URL || inferredSocketUrl;
      const newSocket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id,
          role: user.role,
          siteId: typeof (user as any).assignedSite === 'object' ? (user as any).assignedSite?._id || '' : (user as any).assignedSite || ''
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Ensure we join the site room for scoped events
      const siteIdToJoin = typeof (user as any).assignedSite === 'object' ? (user as any).assignedSite?._id : (user as any).assignedSite;
      if (siteIdToJoin) {
        newSocket.emit('join_site', siteIdToJoin);
      }

      // Request notification permission on connect
      notificationService.requestPermission();

      newSocket.on('visitor_checked_in', (data) => {
        console.log('Visitor checked in:', data);
        notificationService.showVisitorAlert(data.fullName, data.company, 'checkin');
      });

      newSocket.on('visitor_checked_out', (data) => {
        console.log('Visitor checked out:', data);
        notificationService.showVisitorAlert(data.fullName, data.company, 'checkout');
      });

      newSocket.on('visitor_activity', (data) => {
        console.log('Visitor activity:', data);
        if (data.type === 'checkin') {
          notificationService.showVisitorAlert(data.fullName, data.company, 'checkin');
        } else if (data.type === 'checkout') {
          notificationService.showVisitorAlert(data.fullName, data.company, 'checkout');
        }
      });

      newSocket.on('banned_visitor_alert', (data) => {
        console.log('Banned visitor attempt:', data);
        notificationService.showBannedVisitorAlert(
          data.visitor?.fullName || 'Unknown',
          data.visitor?.company || 'Unknown Company',
          data.bannedVisitor?.reason || 'Security violation'
        );
      });

      newSocket.on('emergency_alert', (data) => {
        console.log('Emergency alert:', data);
        notificationService.showEmergencyAlert(
          data.emergencyType,
          data.message,
          data.location
        );
      });

      newSocket.on('security_alert', (data) => {
        console.log('Security alert:', data);
        notificationService.showActivityAlert(
          data.type || 'Security Alert',
          data.message,
          data.severity || 'warning'
        );
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

