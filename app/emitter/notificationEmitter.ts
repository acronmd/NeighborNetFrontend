type Listener = () => void;

const listeners = new Set<Listener>();

export const notificationEmitter = {
    subscribe: (listener: Listener) => {
        listeners.add(listener);

        // ✅ React-safe unsubscribe (returns void)
        return () => {
            listeners.delete(listener);
        };
    },

    emit: () => {
        listeners.forEach(listener => listener());
    },
};