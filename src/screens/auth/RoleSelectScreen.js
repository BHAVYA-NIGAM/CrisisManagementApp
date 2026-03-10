import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RoleSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <View style={styles.header}>
        <Image source={require("../../../assets/kavaach-logo.png")} style={styles.logo} />
        <Text style={styles.title}>DigiSahayta</Text>
        <Text style={styles.subtitle}>Choose your login interface</Text>
      </View>

      <TouchableOpacity style={[styles.card, styles.userCard]} onPress={() => navigation.navigate("UserAuth")}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBadge, styles.userBadge]}>
            <Ionicons name="person-outline" size={18} color="#1d4ed8" />
          </View>
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardTitle}>User Login</Text>
            <Text style={styles.cardText}>Citizens login with phone, email, or username</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1d4ed8" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.adminCard]} onPress={() => navigation.navigate("AdminAuth")}>
        <View style={styles.cardRow}>
          <View style={[styles.iconBadge, styles.adminBadge]}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#b91c1c" />
          </View>
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardTitle}>Government Admin Login</Text>
            <Text style={styles.cardText}>Secure admin credentials with control dashboard access</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#b91c1c" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    padding: 22,
    overflow: "hidden"
  },
  bgOrbTop: {
    position: "absolute",
    top: -140,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#dbeafe",
    opacity: 0.7
  },
  bgOrbBottom: {
    position: "absolute",
    bottom: -160,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#fee2e2",
    opacity: 0.7
  },
  header: { alignItems: "center", marginBottom: 22 },
  logo: { width: 150, height: 150, resizeMode: "contain", marginBottom: 10 },
  title: { fontSize: 34, fontWeight: "800", color: "#0f172a" },
  subtitle: { color: "#475569", marginTop: 6, fontSize: 15 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  userCard: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe", borderWidth: 1 },
  adminCard: { backgroundColor: "#fff1f2", borderColor: "#fecdd3", borderWidth: 1 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  userBadge: { backgroundColor: "#dbeafe" },
  adminBadge: { backgroundColor: "#fee2e2" },
  cardTextBlock: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 4 },
  cardText: { color: "#475569" }
});
