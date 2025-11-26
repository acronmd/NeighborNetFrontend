import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api"; // <-- import the wrapper
import { ApiPost } from "../types/apiPost"

type PostContextType = {
    posts: ApiPost[];
    refreshPosts: () => Promise<void>;
    createPost: (content: string, type?: string) => Promise<void>;
    likePost: (postId: number) => Promise<void>;
};

const PostContext = createContext<PostContextType | null>(null);

export const PostProvider = ({ children }) => {
    const [posts, setPosts] = useState<ApiPost[]>([]);

    // Load feed on startup
    useEffect(() => {
        refreshPosts();
    }, []);

    const refreshPosts = async () => {
        const data = await api("/api/feed");
        setPosts(data.posts || data);
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


    return (
        <PostContext.Provider value={{ posts, refreshPosts, createPost, likePost }}>
            {children}
        </PostContext.Provider>
    );
};

export const usePosts = () => {
    const ctx = useContext(PostContext);
    if (!ctx) throw new Error("usePosts must be used inside PostProvider");
    return ctx;
};
