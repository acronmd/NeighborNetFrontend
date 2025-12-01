import { useNotifications } from "@/app/data/notifications";
import React from "react";
import {
        FlatList,
        StyleSheet,
        Text,
        TouchableOpacity,
        View,
} from "react-native";

export default function NotificationsScreen() {
  const userId = 1; // later you can replace with real logged-in user
  const { alerts, markAllAsRead, markAsRead } = useNotifications(userId);

  const hasUnread = alerts.some((a) => !a.isRead);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notifications</Text>

        {hasUnread && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => markAsRead(item.id)}
            style={[
              styles.card,
              !item.isRead && styles.unreadCard,
            ]}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.message}</Text>
            <Text style={styles.cardMeta}>{item.createdAt}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f7f7f7",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  markAll: {
    fontSize: 14,
    color: "#007bff",
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#32a852",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: "#888",
  },
});
