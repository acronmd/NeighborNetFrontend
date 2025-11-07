import React, { createContext, useContext, useState } from 'react';

import type {UserType} from "./demoDataTS"
import {masterUsers} from "./demoDataTS";
import {User} from "@/app/masterPosts/masterPostList";

export type CommentType = {
    id: string;
    author: string;
    text: string;
};

export type PostType = {
    id: number;
    userData: User;
    content: string; // main text content
    contentType: 'text' | 'poll' | 'media' | 'media+text';
    mediaUrls?: string[]; // optional, only used for media or media+text
    pollOptions?: string[]; // optional, only used for polls
    comments?: CommentType[];
    likes?: number;
};

type PostContextType = {
    posts: Record<string, PostType>;
    addComment: (postId: string, comment: CommentType) => void;
};

const PostContext = createContext<PostContextType | null>(null);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [posts, setPosts] = useState<Record<string, PostType>>({
        1: {
            id: 1,
            userData: masterUsers[1],
            content: 'Hello World!',
            contentType: 'text',
            comments: [],
        },
        2: {
            id: 2,
            userData: masterUsers[2],
            content: 'React Native is so cool!!',
            contentType: 'text',
            comments: [],
        },
        3: {
            id: 3,
            userData: masterUsers[2],
            content: 'Ugghh I hate it!',
            contentType: 'text',
            comments: [],
        },
    });

    const addComment = (postId: string, comment: CommentType) => {
        setPosts(prev => ({
            ...prev,
            [postId]: {
                ...prev[postId],
                comments: [...(prev[postId].comments || []), comment],
            },
        }));
    };

    return (
        <PostContext.Provider value={{ posts, addComment }}>
            {children}
        </PostContext.Provider>
    );
};

export const usePosts = () => {
    const ctx = useContext(PostContext);
    if (!ctx) throw new Error('usePosts must be used within a PostProvider');
    return ctx;
};
