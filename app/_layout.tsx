import { Stack } from "expo-router";
import { PostProvider } from "@/app/data/demoPostData"; // ← create this file below
import { EventProvider } from "@/app/data/demoEventData";

export default function RootLayout() {
    return (
        <PostProvider>
            <EventProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </EventProvider>
        </PostProvider>
    );
}
