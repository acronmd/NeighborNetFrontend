import { useEffect, useState } from "react";
import { api } from "../lib/api"; // your API wrapper

export type Comment = {
    comment_id: number;
    post_id: number;
    user_id: number;
    author_name: string;
    author_image?: string;
    content: string;
};

export function useComments(postId: number) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const data = await api(`/api/posts/${postId}/comments`);
            setComments(data.comments || []);
        } finally {
            setLoading(false);
        }
    };

    const createComment = async (content: string) => {
        if (!content.trim()) return;
        await api(`/api/posts/${postId}/comments`, {
            method: "POST",
            body: JSON.stringify({ content }),
        });
        setComments([]); // optional: clear while reloading
        await fetchComments();
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    return { comments, loading, fetchComments, createComment };
}
