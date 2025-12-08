import { Stack } from "expo-router";
import { PostProvider } from "./data/_demoPostData";
import { EventProvider } from "./data/_demoEventData";
import { RadiusProvider} from "@/app/lib/RadiusContext";
import React from "react";

export default function RootLayout() {
    return (
        <RadiusProvider>
            <PostProvider>
                <EventProvider>
                    <Stack screenOptions={{ headerShown: false }} />
                </EventProvider>
            </PostProvider>
        </RadiusProvider>

    );
}
