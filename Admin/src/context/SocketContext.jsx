import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const userId = useSelector((state) => state.auth.adminInfo?._id);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [presence, setPresence] = useState({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const preferredRef = useRef(sessionStorage.getItem('vastora.presence') || 'online');

  const applyStatus = (instance, status) => {
    preferredRef.current = status;
    sessionStorage.setItem('vastora.presence', status);
    instance?.emit('presence:set', { status });
  };

  useEffect(() => {
    if (!userId) return undefined;
    const instance = io(window.location.origin, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 12,
    });
    socketRef.current = instance;
    setSocket(instance);

    instance.on('connect', () => {
      setConnected(true);
      instance.emit('presence:set', { status: preferredRef.current || 'online' });
    });
    instance.on('disconnect', () => setConnected(false));
    instance.on('getOnlineUsers', (users) => setOnlineUsers((users || []).map(String)));
    instance.on('presence:list', (list) => {
      const next = {};
      (list || []).forEach((row) => {
        next[String(row.userId)] = row;
      });
      setPresence(next);
    });
    instance.on('presence:update', (row) => {
      setPresence((prev) => ({ ...prev, [String(row.userId)]: row }));
    });

    const onVis = () => {
      if (document.hidden) {
        if (preferredRef.current === 'online') instance.emit('presence:set', { status: 'away' });
      } else {
        instance.emit('presence:set', { status: preferredRef.current || 'online' });
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      instance.removeAllListeners();
      instance.close();
      setSocket(null);
    };
  }, [userId]);

  const value = useMemo(
    () => ({
      socket,
      connected,
      onlineUsers,
      presence,
      socketRef,
      setStatus: (status) => applyStatus(socketRef.current, status),
    }),
    [socket, connected, onlineUsers, presence]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useAppSocket = () =>
  useContext(SocketContext) || {
    socket: null,
    connected: false,
    onlineUsers: [],
    presence: {},
    setStatus: () => {},
  };
