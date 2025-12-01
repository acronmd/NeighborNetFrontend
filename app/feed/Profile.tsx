import badges from "@/app/data/badges";
import { masterUsers } from "@/app/data/demoDataTS";
import { usePosts } from "@/app/data/demoPostData";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type ProfileProps = {
  userId?: number | string; // optional — if not provided, use local search params
};

export default function Profile({ userId: propUserId }: ProfileProps) {
  const router = useRouter();
  const { userId: paramUserId } = useLocalSearchParams();
  const { posts } = usePosts();

  // Decide which userId to use
  const idToUse = propUserId ?? paramUserId;

  // Find this user from masterUsers
  const user = masterUsers.find((u) => String(u.id) === String(idToUse));
  if (!user) {
    return (
      <View style={styles.center}>
        <Text>User not found.</Text>
      </View>
    );
  }

  // Local editable state — independent per profile instance
  const [isEditing, setEditing] = useState(false);
  const [bio, setBio] = useState(user.bio || "");
  const [interests, setInterests] = useState(
    user.interests?.join(", ") || ""
  );
  const [skills, setSkills] = useState(user.skills?.join(", ") || "");

  // Filter posts from context by this user's ID
  const userPosts = Object.values(posts).filter(
    (post) => post.userData.id === user.id
  );

  const currentUserId = 1; // Example — replace with your auth context
  const isSelf = String(currentUserId) === String(user.id);

  // Save edits — only updates local state, does not mutate masterUsers
  function saveEdits() {
    setBio(bio);
    setInterests(
      interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ")
    );
    setSkills(
      skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ")
    );
    setEditing(false);
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerCenter}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {user.authorDisplayName[0]}
          </Text>
        </View>
        <Text style={styles.name}>{user.authorDisplayName}</Text>
        <Text style={styles.handle}>@{user.authorUsername}</Text>
        {user.location && (
          <Text style={styles.location}>{user.location}</Text>
        )}
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earned Badges</Text>

        <View style={styles.badgesRow}>
          {/* Incident Reporter */}
          <View style={styles.badgeItem}>
            <Image
              source={badges.incidentReporter}
              style={styles.badgeIcon}
            />
            <Text style={styles.badgeLabel}>Incident Reporter</Text>
          </View>

          {/* Verified Reporter */}
          <View style={styles.badgeItem}>
            <Image
              source={badges.verifiedReporter}
              style={styles.badgeIcon}
            />
            <Text style={styles.badgeLabel}>Verified Reporter</Text>
          </View>

          {/* Community Helper */}
          <View style={styles.badgeItem}>
            <Image
              source={badges.communityHelper}
              style={styles.badgeIcon}
            />
            <Text style={styles.badgeLabel}>Community Helper</Text>
          </View>

          {/* Event Participant */}
          <View style={styles.badgeItem}>
            <Image
              source={badges.eventParticipant}
              style={styles.badgeIcon}
            />
            <Text style={styles.badgeLabel}>Event Participant</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        {isEditing && isSelf ? (
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={styles.input}
            multiline
          />
        ) : (
          <Text>{bio}</Text>
        )}
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        {isEditing && isSelf ? (
          <TextInput
            value={interests}
            onChangeText={setInterests}
            style={styles.input}
            multiline
          />
        ) : (
          <Text>{interests}</Text>
        )}
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        {isEditing && isSelf ? (
          <TextInput
            value={skills}
            onChangeText={setSkills}
            style={styles.input}
            multiline
          />
        ) : (
          <Text>{skills}</Text>
        )}
      </View>

      {/* Edit/Save buttons */}
      {isSelf && (
        <View style={styles.section}>
          {isEditing ? (
            <TouchableOpacity onPress={saveEdits} style={styles.saveBtn}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={styles.editBtn}
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Posts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posts</Text>
        {userPosts.length > 0 ? (
          userPosts.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => router.push(`/feed/${p.id}`)}
            >
              <Text style={styles.postTitle}>
                {p.content.length > 80
                  ? p.content.slice(0, 80) + "…"
                  : p.content}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text>No posts yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  headerCenter: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarLetter: { fontSize: 32, fontWeight: "bold" },
  name: { fontSize: 20, fontWeight: "bold" },
  handle: { color: "#555" },
  location: { color: "#888", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },
  editBtn: { backgroundColor: "#007bff", padding: 10, borderRadius: 4 },
  editText: { color: "#fff", textAlign: "center" },
  saveBtn: { backgroundColor: "#28a745", padding: 10, borderRadius: 4 },
  saveText: { color: "#fff", textAlign: "center" },
  postTitle: { color: "#007bff", marginBottom: 5 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Badges styles
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    marginTop: 8,
  },
  badgeItem: {
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 4,
    width: 80,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 10,
    textAlign: "center",
  },
});
