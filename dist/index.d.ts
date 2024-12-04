type Livestream = {
    id: number;
    slug: string;
    channel_id: number;
    created_at: Date;
    session_title: string;
    is_live: boolean;
    risk_level_id: null;
    start_time: Date;
    source: null;
    twitch_channel: null;
    duration: number;
    language: string;
    is_mature: boolean;
    viewer_count: number;
    thumbnail: string;
    channel: Channel;
    categories: CategoryElement[];
};
type CategoryElement = {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    tags: string[];
    description: null;
    deleted_at: null;
    viewers: number;
    category: CategoryCategory;
};
type CategoryCategory = {
    id: number;
    name: string;
    slug: string;
    icon: string;
};
type Channel = {
    id: number;
    user_id: number;
    slug: string;
    is_banned: boolean;
    playback_url: string;
    name_updated_at: null;
    vod_enabled: boolean;
    subscription_enabled: boolean;
    followersCount: number;
    user: User;
    can_host: boolean;
    verified: Verified;
};
type User = {
    profilepic: string;
    bio: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    discord: string;
    tiktok: string;
    username: string;
};
type Verified = {
    id: number;
    channel_id: number;
    created_at: Date;
    updated_at: Date;
};

interface ClientOptions {
    logger?: boolean;
    plainEmote?: boolean;
}
interface Video {
    id: number;
    title: string;
    thumbnail: string;
    duration: number;
    live_stream_id: number;
    start_time: Date;
    created_at: Date;
    updated_at: Date;
    uuid: string;
    views: number;
    stream: string;
    language: string;
    livestream: Livestream;
    channel: Channel;
}
interface KickClient {
    on: (event: string, listener: (...args: any[]) => void) => void;
    vod: (video_id: string) => Promise<Video>;
    login: (credentials: {
        token: string;
        cookies: string;
    }) => Promise<void>;
    user: {
        id: number;
        username: string;
        tag: string;
    } | null;
    sendMessage: (messageContent: string) => Promise<void>;
    permanentBan: (bannedUser: string) => Promise<void>;
    slowMode: (mode: "on" | "off", durationInSeconds?: number) => Promise<void>;
}

declare const createClient: (channelName: string, options?: ClientOptions) => KickClient;

interface MessageData {
    id: string;
    chatroom_id: number;
    content: string;
    type: string;
    created_at: string;
    sender: {
        id: number;
        username: string;
        slug: string;
        identity: {
            color: string;
            badges: unknown;
        };
    };
    metadata?: {
        original_sender: {
            id: string;
            username: string;
        };
        original_message: {
            id: string;
            content: string;
        };
    };
}

export { type MessageData, createClient };
