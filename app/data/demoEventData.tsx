import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

export type EventType = {
    post_id: number;
    event_id: number;
    title: string;
    description: string;
    event_date: string;
    location: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
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
        location_lat?: number;
        location_lng?: number;
        max_attendees?: number;
    }) => Promise<void>;
};

const EventContext = createContext<EventContextType | null>(null);

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState<EventType[]>([]);

    useEffect(() => {
        refreshEvents();
    }, []);

    // ----------------------------
    // Load all events
    // ----------------------------
    const refreshEvents = async () => {
        const data = await api("/api/events"); // GET /api/events
        setEvents(data.events || []);
    };

    // ----------------------------
    // Create new event
    // ----------------------------
    const createEvent = async (newEvent) => {
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
