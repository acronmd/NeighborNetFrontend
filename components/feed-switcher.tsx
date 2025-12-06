import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

type Props = {
    mode: "posts" | "events";
    setMode: (mode: "posts" | "events") => void;
};

export default function FeedSwitcher({ mode, setMode }: Props) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, mode === "posts" && styles.activeButton]}
                onPress={() => setMode("posts")}
            >
                <Text style={[styles.text, mode === "posts" && styles.activeText]}>Posts</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, mode === "events" && styles.activeButton]}
                onPress={() => setMode("events")}
            >
                <Text style={[styles.text, mode === "events" && styles.activeText]}>Events</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
        backgroundColor: Colors.light.background,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#ccc",
    },
    button: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    activeButton: {
        backgroundColor: "#32a852", // active color
    },
    text: {
        fontSize: 16,
        color: "#555",
        fontWeight: "600",
    },
    activeText: {
        color: "white",
    },
});
