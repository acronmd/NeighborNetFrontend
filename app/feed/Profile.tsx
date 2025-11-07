// import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
// import { masterPostList, User } from "@/app/masterPosts/masterPostList";
//
// type ProfileProps = {
//     user: User;
// };
//
// export default function Profile({ user }: ProfileProps) {
//     return (
//         <ScrollView style={styles.container}>
//             {/* Header */}
//             <View style={styles.header}>
//                 <Image
//                     source={
//                         user.avatarUrl
//                             ? { uri: user.avatarUrl }
//                             : require('@/assets/images/default-avatar.png')
//                     }
//                     style={styles.avatar}
//                 />
//                 <View style={styles.nameContainer}>
//                     <Text style={styles.displayName}>{user.authorDisplayName}</Text>
//                     <Text style={styles.username}>@{user.authorUsername}</Text>
//                 </View>
//             </View>
//
//             {/* Bio */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>bio</Text>
//                 <Text style={styles.bio}>
//                     {user.bio || 'This user has not written a bio yet.'}
//                 </Text>
//             </View>
//
//             {/* Badges */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>badges - {user.safetyPoints ?? 0} Safety Points</Text>
//                 <View style={styles.badgeRow}>
//                     {user.badges && user.badges.length > 0 ? (
//                         user.badges.map((badge, i) => (
//                             <View key={i} style={styles.badge}>
//                                 <Text style={{ color: '#fff' }}>{badge.icon || '🏅'}</Text>
//                             </View>
//                         ))
//                     ) : (
//                         <Text style={styles.noBadges}>No badges yet</Text>
//                     )}
//                 </View>
//             </View>
//
//             {/* Info */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>info</Text>
//                 <View style={styles.infoRow}>
//                     {user.age && <Text style={styles.infoTag}>age: {user.age}</Text>}
//                     {user.occupation && (
//                         <Text style={styles.infoTag}>occupation: {user.occupation}</Text>
//                     )}
//                 </View>
//                 <View style={styles.infoRow}>
//                     {user.hobbies && (
//                         <Text style={styles.infoTag}>hobbies: {user.hobbies.join(', ')}</Text>
//                     )}
//                     {user.skills && (
//                         <Text style={styles.infoTag}>skills: {user.skills.join(', ')}</Text>
//                     )}
//                 </View>
//             </View>
//
//             {/* Post History */}
//             <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>
//                     post history - {masterPostList[user.postIDs]?.length ?? 0} posts
//                 </Text>
//                 {user.posts?.slice(0, 3).map((post, i) => (
//                     <View key={i} style={styles.postPreview}>
//                         <Text style={styles.displayName}>{user.authorDisplayName}</Text>
//                         <Text style={styles.username}>@{user.authorUsername}</Text>
//                         <Text numberOfLines={2} style={styles.postText}>
//                             {post.content}
//                         </Text>
//                     </View>
//                 ))}
//             </View>
//         </ScrollView>
//     );
// }
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#3C3F58', // matches your dark blue theme
//         padding: 12,
//     },
//     header: {
//         backgroundColor: '#4B4E70',
//         borderRadius: 8,
//         padding: 16,
//         alignItems: 'center',
//     },
//     avatar: {
//         width: 72,
//         height: 72,
//         borderRadius: 36,
//         backgroundColor: '#888',
//         marginBottom: 8,
//     },
//     nameContainer: { alignItems: 'center' },
//     displayName: {
//         color: '#fff',
//         fontWeight: 'bold',
//         fontSize: 18,
//     },
//     username: {
//         color: '#b0b0b0',
//     },
//     section: {
//         backgroundColor: '#4B4E70',
//         borderRadius: 8,
//         marginTop: 12,
//         padding: 12,
//     },
//     sectionTitle: {
//         color: '#b0b0b0',
//         fontStyle: 'italic',
//         marginBottom: 6,
//     },
//     bio: {
//         color: '#fff',
//         fontSize: 14,
//         lineHeight: 20,
//     },
//     badgeRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//     },
//     badge: {
//         backgroundColor: '#6A6DAA',
//         padding: 8,
//         borderRadius: 24,
//         width: 40,
//         height: 40,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     noBadges: { color: '#ccc' },
//     infoRow: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         gap: 8,
//         marginBottom: 4,
//     },
//     infoTag: {
//         backgroundColor: '#34385E',
//         color: '#fff',
//         paddingVertical: 4,
//         paddingHorizontal: 8,
//         borderRadius: 8,
//         fontSize: 13,
//     },
//     postPreview: {
//         backgroundColor: '#34385E',
//         padding: 10,
//         borderRadius: 6,
//         marginTop: 6,
//     },
//     postText: {
//         color: '#fff',
//         marginTop: 4,
//         fontSize: 14,
//     },
// });
