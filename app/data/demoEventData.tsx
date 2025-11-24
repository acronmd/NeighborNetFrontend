import React, { createContext, useContext, useState } from 'react';

import type {UserType} from "./demoUserData"
import {masterUsers} from "./demoUserData";

export type EventPostType = {
    id: number;
    userData: UserType;
    title: string;
    overview: string;
    location: string;
    dateTime: Date;
    attendingNo: number;
    attendingMaxNo: number;
    imageUrl: string;
}


const EventPostContext = createContext<EventPostContextType | null>(null);

type EventPostContextType = {
    events: Record<string, EventPostType>;
    addEvent: (event: Omit<EventPostType, 'id'>) => void;
    addRSVP: (eventPostID: string) => void;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [events, setEvents] = useState<Record<string, EventPostType>>({
        1: {
            id: 1,
            userData: masterUsers[1],
            title: 'Event One!',
            overview: "Lorem Ipsum",
            location: "16W",
            dateTime: new Date("1995-12-17T03:24:00"),
            attendingNo: 0,
            attendingMaxNo: 20,
            imageUrl: "https://copyparty.acrn.me/other%20files/NeighborNetCDN/events/pumpkin.png"
        },
        2: {
            id: 2,
            userData: masterUsers[2],
            title: 'Event Two!',
            overview: "Lorem Ipsum",
            location: "16W",
            dateTime: new Date("1995-12-17T03:24:00"),
            attendingNo: 0,
            attendingMaxNo: 20,
            imageUrl: "https://copyparty.acrn.me/other%20files/NeighborNetCDN/events/pumpkin.png"
        },
        3: {
            id: 3,
            userData: masterUsers[1],
            title: 'Event Three!',
            overview: "Lorem Ipsum",
            location: "16W",
            dateTime: new Date("1995-12-17T03:24:00"),
            attendingNo: 0,
            attendingMaxNo: 20,
            imageUrl: "https://copyparty.acrn.me/other%20files/NeighborNetCDN/events/pumpkin.png"
        },
        4: {
            id: 4,
            userData: masterUsers[2],
            title: 'Event Four!',
            overview: "This'll be a casual picnic meetup at 16W, Make sure to bring food and drinks if you wanna come! Message me for details",
            location: "16W",
            dateTime: new Date("1995-12-17T03:24:00"),
            attendingNo: 0,
            attendingMaxNo: 20,
            imageUrl: "https://copyparty.acrn.me/other%20files/NeighborNetCDN/events/pumpkin.png"
        },
    });

    const addEvent = (eventPost: Omit<EventPostType, 'id'>) => {
        const newId = Math.max(...Object.keys(events).map(Number)) + 1;
        setEvents(prev => ({
            ...prev,
            [newId]: { ...eventPost, id: newId },
        }));
    };

    const addRSVP = (eventPostID: string) => {
        setEvents(prev => ({
            ...prev,
            [eventPostID]: {
                ...prev[eventPostID],
                attendingNo: (prev[eventPostID].attendingNo || 0) + 1,
            },
        }));
    };

    return (
        <EventPostContext.Provider value={{ events, addEvent, addRSVP }}>
            {children}
        </EventPostContext.Provider>
    );
}

export const useEvents = () => {
    const ctx = useContext(EventPostContext);
    if (!ctx) throw new Error('useEvents must be used within a EventPostProvider');
    return ctx;
};
