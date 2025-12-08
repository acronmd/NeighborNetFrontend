import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the context
interface RadiusContextType {
    radiusMiles: number;
    setRadiusMiles: (value: number) => void;
}

// Create context
const RadiusContext = createContext<RadiusContextType | undefined>(undefined);

// Provider component
export const RadiusProvider = ({ children }: { children: ReactNode }) => {
    const [radiusMiles, setRadiusMiles] = useState(5); // default 5 miles

    return (
        <RadiusContext.Provider value={{ radiusMiles, setRadiusMiles }}>
            {children}
        </RadiusContext.Provider>
    );
};

// Hook for easy usage
export const useRadius = () => {
    const context = useContext(RadiusContext);
    if (!context) {
        throw new Error('useRadius must be used within a RadiusProvider');
    }
    return context;
};
