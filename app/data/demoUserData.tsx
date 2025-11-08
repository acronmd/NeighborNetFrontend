export type UserType = {
    id: number;
    authorDisplayName: string;
    authorUsername: string;
    avatarUrl?: string;
    location?: string;

    // Profile-specific fields
    bio?: string;
    safetyPoints?: number;
    badges?: { icon: string; label?: string }[];

    // Personal info
    age?: number;
    occupation?: string;
    hobbies?: string[];
    interests?: string[];
    skills?: string[];

    // Post history
    postIDs?: number[];
};

export type PostType = {
    id: number;
    userData: UserType;
    content: string; // main text content
    contentType: 'text' | 'poll' | 'media' | 'media+text';
    mediaUrls?: string[]; // optional, only used for media or media+text
    pollOptions?: string[]; // optional, only used for polls
    replies?: CommentType[];
    likes?: number;
};

export type CommentType = {
    id: string;
    author: string;
    text: string;
};

export const masterUsers: UserType[] = [
    {
        id: 0,
        authorDisplayName: 'Aidan',
        authorUsername: "aidantx",
        bio: "Local artist who likes videogames.",
        age: 20,
        occupation: "Tutor/Student",
        interests: ["UI/UX", "Art", "Games"],
        skills: ["TypeScript", "Drawing", "Writing"],
        location: "3.67 miles",
        postIDs: [0],
    },
    {
        id: 1,
        authorDisplayName: 'Alice',
        authorUsername: "janedoe",
        bio: "Curious developer exploring mobile-first design.",
        age: 22,
        occupation: "Student",
        interests: ["UI/UX", "React Native", "Facial Recognition"],
        skills: ["JavaScript", "React Native", "Design Thinking"],
        location: "2.45 miles",
        postIDs: [0]
    },
    {
        id: 2,
        authorDisplayName: 'Bob',
        authorUsername: "johndoe",
        bio: "Engineer passionate about clean code and community tools.",
        age: 27,
        occupation: "Engineer",
        interests: ["Open Source", "TypeScript", "Community Building"],
        skills: ["TypeScript", "Node.js", "Git"],
        location: "1.22 miles",
        postIDs: [1]
    }
]