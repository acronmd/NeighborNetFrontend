// hooks/useApiPost.ts
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { ApiPost } from "../types/apiPost";
import {json} from "node:stream/consumers";

export function useApiPost(postId: number) {
    const [post, setPost] = useState<ApiPost | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPost = async () => {
        setLoading(true);

        const token = await SecureStore.getItemAsync("authToken");
        const ip = await SecureStore.getItemAsync("serverIp");

        try {
            const res = await fetch(`http://${ip}/api/posts/${postId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();

            if (json.success) {
                // Map API fields to your ApiPost type
                const apiPost: ApiPost = {
                    is_pinned: json.post.is_pinned,
                    is_verified: json.post.is_verified,
                    priority: json.post.priority,
                    status: json.post.status,
                    updated_at: json.post.updated_at,
                    user_id: json.post.user_id,
                    visibility_radius: json.post.visibility_radius,
                    post_id: json.post.post_id,
                    content: json.post.content,
                    post_type: json.post.post_type,
                    likes_count: json.post.likes_count,
                    comments_count: json.post.comments_count,
                    created_at: json.post.created_at,
                    author_image: json.post.author_image,
                    author_name: json.post.author_name
                };

                setPost(apiPost);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPost();
    }, [postId]);

    return { post, loading, refreshPost: loadPost };
}
