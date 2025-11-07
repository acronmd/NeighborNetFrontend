// app/users/[id].tsx
import React from 'react';
import Profile from '@/app/feed/Profile';
import {useLocalSearchParams} from "expo-router";

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <Profile userId={id} />;
}
