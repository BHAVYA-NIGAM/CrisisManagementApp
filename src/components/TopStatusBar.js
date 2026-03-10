import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import UserProfileModal from "./UserProfileModal";
import AdminProfileModal from "./AdminProfileModal";

export default function TopStatusBar() {
  const { user, isAdmin } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const profilePhoto = user?.profilePhoto;
  const displayName = user?.name || "Guest";

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftRow}>
          <Image source={require("../../assets/kavaach-logo.png")} style={styles.logo} />
          <View>
            <Text style={styles.appName}>DigiSahayta</Text>
            <Text style={styles.liveText}>Live • Crisis Mode Active</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileTrigger} onPress={() => setProfileVisible(true)}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          ) : (
            <View style={styles.profileIcon}>
              <Ionicons name={isAdmin ? "shield-checkmark" : "person"} size={16} color="#e0f2fe" />
            </View>
          )}
          <Text style={styles.userText} numberOfLines={1}>{displayName}</Text>
          <Ionicons name="chevron-down" size={16} color="#e0f2fe" />
        </TouchableOpacity>
      </View>
      {isAdmin ? (
        <AdminProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
      ) : (
        <UserProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2456e3",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  leftRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 32, height: 32, marginRight: 8, resizeMode: "contain" },
  appName: { color: "#e0f2fe", fontSize: 12, fontWeight: "700" },
  liveText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  profileTrigger: { flexDirection: "row", alignItems: "center", maxWidth: 180 },
  userText: { color: "#dbeafe", fontSize: 12, marginHorizontal: 6, maxWidth: 120 },
  profilePhoto: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#e5e7eb" },
  profileIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#3f6df0",
    alignItems: "center",
    justifyContent: "center"
  }
});
