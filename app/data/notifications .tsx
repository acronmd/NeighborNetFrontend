import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type Alert = {
  id: number;
  userId: number;
  title: string;
  message: string;
  createdAt: string;
  type: "incident" | "event" | "system";
  isRead: boolean;
};

type NotificationsContextValue = {
  alerts: Alert[];
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

// fake data for now (later you can replace with real backend data)
const initialAlerts: Alert[] = [
  {
    id: 1,
    userId: 1,
    title: "New incident reported near you.",
    message: "A neighbor just reported an incident in your area.",
    createdAt: "2025-11-27T10:00:00",
    type: "incident",
    isRead: false,
  },
  {
    id: 2,
    userId: 1,
    title: "Community clean-up event starts in 1 hour.",
    message: "Don’t forget to bring gloves and water.",
    createdAt: "2025-11-27T11:00:00",
    type: "event",
    isRead: false,
  },
];

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

 
  const markAsRead = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const value = useMemo(
    () => ({
      alerts,
      markAsRead,
      markAllAsRead,
    }),
    [alerts]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}


export function useNotifications(userId: number) {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationsProvider");
  }

  const alertsForUser = ctx.alerts.filter((a) => a.userId === userId);

  return {
    alerts: alertsForUser,
    markAsRead: ctx.markAsRead,
    markAllAsRead: ctx.markAllAsRead,
  };
}
