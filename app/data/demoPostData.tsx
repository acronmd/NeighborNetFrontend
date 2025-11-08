import React, { createContext, useContext, useState } from 'react';

import type {UserType} from "./demoUserData"
import {masterUsers} from "./demoUserData";

export type CommentType = {
    id: number;
    userData: UserType;
    text: string;
};

export type PostType = {
    id: number;
    userData: UserType;
    content: string; // main text content
    contentType: 'text' | 'poll' | 'media' | 'media+text';
    mediaUrls?: string[]; // optional, only used for media or media+text
    pollOptions?: string[]; // optional, only used for polls
    comments?: CommentType[];
    likes?: number;
};



const PostContext = createContext<PostContextType | null>(null);

type PostContextType = {
    posts: Record<string, PostType>;
    addComment: (postId: string, comment: CommentType) => void;
    addPost: (post: Omit<PostType, 'id'>) => void; // new post without id
    likePost: (postId: string) => void;
};

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [posts, setPosts] = useState<Record<string, PostType>>({
        1: {
            id: 1,
            userData: masterUsers[1],
            content: 'Hello World!',
            contentType: 'text',
            comments: [],
            likes: 1
        },
        2: {
            id: 2,
            userData: masterUsers[2],
            content: 'Isn\'t our neighborhood so cool!!',
            contentType: 'text',
            comments: [
                {
                    id: 0,
                    userData: masterUsers[1],
                    text: "I agree! It really is great!"
                },
                {
                    id: 1,
                    userData: masterUsers[2],
                    text: "Thanks for agreeing :)"
                }
            ],
            likes: 3
        },
        3: {
            id: 3,
            userData: masterUsers[2],
            content: 'Ugghh I hate when the subway is delayed!',
            contentType: 'text',
            comments: [],
            likes: 2
        },
        4: {
            id: 4,
            userData: masterUsers[0],
            content: 'Welcome everybody!',
            contentType: 'text',
            comments: [
                {
                id: 0,
                userData: masterUsers[1],
                text: "Hello!! :P"
                }
            ],
            likes: 5
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

    const addPost = (post: Omit<PostType, 'id'>) => {
        const newId = Math.max(...Object.keys(posts).map(Number)) + 1;
        setPosts(prev => ({
            ...prev,
            [newId]: { ...post, id: newId },
        }));
    };

    const likePost = (postId: string) => {
        setPosts(prev => ({
            ...prev,
            [postId]: {
                ...prev[postId],
                likes: (prev[postId].likes || 0) + 1,
            },
        }));
    };

    return (
        <PostContext.Provider value={{ posts, addComment, addPost, likePost }}>
            {children}
        </PostContext.Provider>
    );
};


export const usePosts = () => {
    const ctx = useContext(PostContext);
    if (!ctx) throw new Error('usePosts must be used within a PostProvider');
    return ctx;
};
