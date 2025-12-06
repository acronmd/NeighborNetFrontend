import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "../lib/_api";

export type EventType = {
    post_id: number;
    event_id: number;
    title: string;
    description: string;
    event_date: string;
    location: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    poi: string | null;
    max_attendees?: number | null;
    current_attendees?: number;
    organizer_id: number;
    status: string;
    created_at: string;
};


type EventContextType = {
    events: EventType[];
    refreshEvents: () => Promise<void>;
    createEvent: (newEvent: {
        title: string;
        description?: string;
        event_date: string;
        location?: string;
        location_lat?: number | null;
        location_lng?: number | null;
        poi: string;
        max_attendees?: number;
    }) => Promise<void>;
};

export type CommentType = {
  id: string | number;
  userData: {
    authorUsername: string | undefined; id: string | number 
    };
  text: string;
  createdAt: string;
};

const EventContext = createContext<EventContextType | null>(null);

export const EventProvider = ({ children }: { children: React.ReactNode }) => {
    const [events, setEvents] = useState<EventType[]>([]);

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    const checkAuthAndLoad = async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");
            
            if (token && ip) {
                await refreshEvents();
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        }
    };

    // ----------------------------
    // Load all events
    // ----------------------------
    const refreshEvents = async () => {
        try {
            const data = await api("/api/events"); // GET /api/events
            setEvents(data.events || []);
        } catch (err) {
            console.error('Failed to refresh events:', err);
        }
    };

    // ----------------------------
    // Create new event
    // ----------------------------
    const createEvent = async (newEvent: any) => {
        await api("/api/events", {
            method: "POST",
            body: JSON.stringify(newEvent),
        });

        await refreshEvents();
    };

    return (
        <EventContext.Provider value={{ events, refreshEvents, createEvent }}>
            {children}
        </EventContext.Provider>
    );
};

// Hook to use in components
export const useEvents = () => {
    const ctx = useContext(EventContext);
    if (!ctx) throw new Error("useEvents must be used inside EventProvider");
    return ctx;
};
