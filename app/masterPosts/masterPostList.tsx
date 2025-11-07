export type User = {
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
    skills?: string[];

    // Post history
    postIDs?: number[];
};


export type PostType = {
    id: number;
    userData: User;
    content: string; // main text content
    contentType: 'text' | 'poll' | 'media' | 'media+text';
    mediaUrls?: string[]; // optional, only used for media or media+text
    pollOptions?: string[]; // optional, only used for polls
    replies?: PostType[];
    likes?: number;
};

export const masterUserList: User[] = [
    {
        id: 1,
        authorDisplayName: 'Aidan',
        authorUsername: "aidantx",
        location: "3.67 miles",
    },
    {
        id: 2,
        authorDisplayName: 'Alice',
        authorUsername: "janedoe",
        location: "2.45 miles",
        postIDs: [0]
    },
    {
        id: 3,
        authorDisplayName: 'Bob',
        authorUsername: "johndoe",
        location: "1.22 miles",
        postIDs: [1]
    }
]

export const masterPostList: Record<string, PostType> = {
    p1: {
        id: 1,
        userData: masterUserList[1],
        content: 'Hello World!',
        contentType: 'text',
    },
    p2: {
        id: 2,
        userData: masterUserList[2],
        content: 'React Native is so cool!!',
        contentType: 'text',
    }
};
