export type ApiPost = {
    post_id: number;
    user_id: number;         // because DB returns this
    content: string;
    post_type: string;
    priority: "normal" | "high" | "urgent";
    is_verified: boolean;
    media_urls?: string | null;
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
    author_image: string | null;
};

