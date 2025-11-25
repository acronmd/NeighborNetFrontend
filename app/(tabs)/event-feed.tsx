import React from "react";
import { FlatList, View, Text, ActivityIndicator } from "react-native";
import EventPost from "@/app/feed/EventPost";
import { useEvents } from "@/app/data/demoEventData"; // your EventProvider file

export default function EventFeedScreen() {
    const { events, refreshEvents } = useEvents();

    if (!events) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (events.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>No events yet.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={events}
            keyExtractor={(item) => String(item.event_id)}
            renderItem={({ item }) => <EventPost {...item} id={item.event_id} />}
            onRefresh={refreshEvents}
            refreshing={false}
        />
    );
}
