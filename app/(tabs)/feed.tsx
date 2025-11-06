import { FlatList, View, Text } from 'react-native';

import Post, { PostType } from '@/app/feed/Post';

const posts: PostType[] = [
    { id: '1', authorDisplayName: 'Alice', authorUsername: "janedoe", location: "2.45 miles", content: 'Hello world!' },
    { id: '2', authorDisplayName: 'Bob', authorUsername: "johndoe", location: "1.22 miles", content: 'React Native is cool!' },
];

export default function FeedScreen() {
    return (
        <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Post {...item} />}
        />
    );
}
