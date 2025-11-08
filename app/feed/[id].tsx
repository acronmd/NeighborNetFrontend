import React, { useEffect, useState } from 'react';
import {  View, Text, BackHandler, TextInput,TouchableOpacity,  StyleSheet,  ScrollView,} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePosts } from '@/app/data/demoPostData';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { posts, addComment } = usePosts(); // pull from context

  // find the post in context by numeric ID
  const postId = Number(id);
  const post = Object.values(posts).find((p) => p.id === postId);

  // Local state for comment input
  const [commentText, setCommentText] = useState('');

  // Handle Android hardware back button
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back(); // mimic the header back button
      return true; // prevent default behavior
    });
    return () => subscription.remove();
  }, [router]);

  if (!post) {
    return (
      <View style={styles.notFound}>
        <Text>Post not found.</Text>
      </View>
    );
  }

  function handleAddComment() {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      author: 'jonathan', // demo user
      text: commentText.trim(),
    };

    addComment(String(post.id), newComment);
    setCommentText('');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Post ID: {post.id}</Text>
      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.commentsSection}>
        <Text style={styles.sectionTitle}>Comments</Text>

        {post.comments && post.comments.length > 0 ? (
          post.comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentMeta}>{c.author}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noComments}>No comments yet. Be the first to comment.</Text>
        )}

        <View style={styles.commentInputSection}>
          <Text style={styles.sectionTitle}>Add a comment</Text>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write your comment..."
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={handleAddComment} style={styles.submitBtn}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  notFound: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  commentsSection: {
    marginTop: 18,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 8,
  },
  comment: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  commentMeta: {
    color: '#4b5563',
    marginBottom: 4,
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    color: '#0b1220',
  },
  noComments: {
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  commentInputSection: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  submitText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});

    return (
        <View style={{ padding: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18}}>Post ID: {post.id}</Text>
            <Text>{post.content}</Text>
        </View>
    );
}
