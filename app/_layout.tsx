import { Stack } from "expo-router";
import { PostProvider } from "@/app/data/demoPostData"; // ← create this file below

export default function RootLayout() {
    return (
        <PostProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </PostProvider>
    );
}
