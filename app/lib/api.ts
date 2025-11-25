import * as SecureStore from "expo-secure-store";

export async function api(path: string, options: RequestInit = {}) {
    const token = await SecureStore.getItemAsync("authToken");
    const ip = await SecureStore.getItemAsync("serverIp"); // you stored this in login

    if (!ip) throw new Error("No server IP found");
    if (!token) throw new Error("No auth token found");

    const res = await fetch(`http://${ip}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "API request failed");
    }

    return res.json();
}