import { useNotifications } from "@/app/data/notifications";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function AlertsScreen() {
  const userId = 1; // Replace with the actual user ID
  const { alerts } = useNotifications(userId); // ✅ now this is a real hook

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.alertBox}>
            <Text style={styles.alertType}>{item.type.toUpperCase()}</Text>
            <Text style={styles.alertMessage}>{item.message}</Text>
            <Text style={styles.alertTime}>{item.createdAt}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No alerts yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  alertBox: {
    backgroundColor: "#f4f4f4",
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  alertType: { fontWeight: "bold", marginBottom: 4 },
  alertMessage: { marginBottom: 4 },
  alertTime: { color: "#666", fontSize: 12 },
  emptyText: { textAlign: "center", marginTop: 20, color: "#777" },
});


