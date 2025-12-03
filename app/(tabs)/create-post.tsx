import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { usePosts } from '@/app/data/demoPostData';
import { useState } from 'react';
import React from 'react';

export default function CreatePostScreen() {
    const { createPost } = usePosts(); // <-- API-based create
    const [content, setContent] = useState("");

    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert("Cannot post empty content!");
            return;
        }

        try {
            await createPost(content, "general"); // <--- API request
            setContent("");
            Alert.alert("Post created!");
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to create post");
            console.log(err);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create a New Post</Text>

            <TextInput
                value={content}
                onChangeText={setContent}
                style={styles.input}
                multiline
                placeholder="What's on your mind?"
            />

            <TouchableOpacity onPress={handlePost} style={styles.button}>
                <Text style={styles.buttonText}>Post</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontWeight: "bold", fontSize: 18, marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        minHeight: 80,
        textAlignVertical: "top",
    },
    button: {
        backgroundColor: "#1DA1F2",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
