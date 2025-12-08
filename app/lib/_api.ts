import * as SecureStore from "expo-secure-store";
import {BASE_URL} from "@/app/lib/config";

export async function api(path: string, options: RequestInit = {}) {
    const token = await SecureStore.getItemAsync("authToken");

    if (!token) throw new Error("No auth token found");

    const res = await fetch(`https://${BASE_URL}${path}`, {
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

// fetch all available tags from backend
export async function fetchTags() {
    const json = await api('/posts/tags/all', { method: 'GET' });
    // expected shape: { success: true, tags: [...] }
    return json.tags || [];
}

// create a new post with given payload
export async function createPost(payload: Record<string, any>) {
    const json = await api('/posts', { method: 'POST', body: JSON.stringify(payload) });
    return json; // caller can inspect json.post
}