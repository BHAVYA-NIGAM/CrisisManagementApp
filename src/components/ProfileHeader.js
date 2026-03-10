import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function ProfileHeader() {
  const { user, isAdmin } = useAuth();

  const profilePhoto = user?.profilePhoto;
  const userName = user?.name || "User";

  return (
    <View style={styles.container}>
      {profilePhoto ? (
        <Image source={{ uri: profilePhoto }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <Ionicons 
            name={isAdmin ? "shield-checkmark" : "person"} 
            size={20} 
            color={isAdmin ? "#2563eb" : "#6b7280"} 
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>{userName}</Text>
        {isAdmin && <Text style={styles.role}>Administrator</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb"
  },
  photoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dbeafe"
  },
  textContainer: {
    flex: 1,
    marginLeft: 12
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827"
  },
  role: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 2
  }
});
