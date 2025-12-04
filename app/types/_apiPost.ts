 export type ApiPost = {
    post_id: number;
    user_id: number;         // because DB returns this
    content: string;
    post_type: string;
    priority: "normal" | "high" | "urgent";
    is_verified: boolean;
    media_urls?: string | null;
    post_image?: string | null;  // New field for post images
    tags?: string[];  // Array of tag strings
    location_lat?: number | null;
    location_lng?: number | null;
    visibility_radius: number;
    likes_count: number;
    comments_count: number;
    is_pinned: boolean;
    status: "active" | "archived" | "reported" | "removed";
    created_at: string;
    updated_at: string;
    author_name: string;
    username: string;
    display_name: string;
    author_image: string | null;
    profile_image?: string | null;  // User's profile picture for the post
};
