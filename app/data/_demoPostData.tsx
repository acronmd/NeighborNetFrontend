import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { api } from "../lib/_api"; // <-- import the wrapper
import { ApiPost } from "../types/_apiPost"

type PostContextType = {
    posts: ApiPost[];
    refreshPosts: () => Promise<void>;
    createPost: (content: string, type?: string) => Promise<void>;
    likePost: (postId: number) => Promise<void>;
    deletePost: (postId: number) => Promise<void>;
    updatePost: (postId: number, content: string) => Promise<void>;
};

const PostContext = createContext<PostContextType | null>(null);

export const PostProvider = ({ children }: { children: React.ReactNode }) => {
    const [posts, setPosts] = useState<ApiPost[]>([]);

    // Load feed on startup (only if authenticated)
    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    const checkAuthAndLoad = async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");
            
            if (token && ip) {
                await refreshPosts();
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        }
    };

    const refreshPosts = async () => {
        try {
            const data = await api("/api/feed");
            setPosts(data.posts || data);
        } catch (err) {
            console.error('Failed to refresh posts:', err);
        }
    };

    const createPost = async (content: string, type = "general") => {
        await api("/api/posts", {
            method: "POST",
            body: JSON.stringify({ content, post_type: type }),
        });

        await refreshPosts(); // reload feed
    };

    const likePost = async (postId: number) => {
        await api(`/api/posts/${postId}/like`, {
            method: "POST",
        });

        await refreshPosts();
    };

    const deletePost = async (postId: number) => {
        await api(`/api/posts/${postId}`, {
            method: "DELETE",
        });

        await refreshPosts();
    };

    const updatePost = async (postId: number, content: string) => {
        await api(`/api/posts/${postId}`, {
            method: "PUT",
            body: JSON.stringify({ content }),
        });

        await refreshPosts();
    };

    return (
        <PostContext.Provider value={{ posts, refreshPosts, createPost, likePost, deletePost, updatePost }}>
            {children}
        </PostContext.Provider>
    );
};

export const usePosts = () => {
    const ctx = useContext(PostContext);
    if (!ctx) throw new Error("usePosts must be used inside PostProvider");
    return ctx;
};
