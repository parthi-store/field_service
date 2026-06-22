import React, { createContext, useContext, useState, useCallback } from 'react';

export interface AppNotification {
  id: number;
  title: string;
  body: string;
  time: number;
  read: boolean;
  type: 'request' | 'task' | 'status' | 'info';
}

interface NotifCtx {
  notifications: AppNotification[];
  unread: number;
  add: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  markAllRead: () => void;
  clear: () => void;
}

const Ctx = createContext<NotifCtx>({} as NotifCtx);
export const useNotifications = () => useContext(Ctx);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const add = useCallback((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    setNotifications((prev) => [{ ...n, id: Date.now() + Math.random(), time: Date.now(), read: false }, ...prev].slice(0, 40));
  }, []);

  const markAllRead = useCallback(() => setNotifications((p) => p.map((n) => ({ ...n, read: true }))), []);
  const clear = useCallback(() => setNotifications([]), []);

  const unread = notifications.filter((n) => !n.read).length;

  return <Ctx.Provider value={{ notifications, unread, add, markAllRead, clear }}>{children}</Ctx.Provider>;
};
