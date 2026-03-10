import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AdminProfileModal({ visible, onClose }) {
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return Alert.alert("Missing Fields", "Please fill all password fields");
    }
    if (newPassword !== confirmNewPassword) {
      return Alert.alert("Mismatch", "New passwords do not match");
    }

    setLoading(true);
    try {
      await api.changePassword({ oldPassword, newPassword });
      Alert.alert("Success", "Password changed successfully");
      setShowChangePassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      Alert.alert("Change Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => { logout(); onClose(); }, style: "destructive" }
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Icon */}
          <View style={styles.photoSection}>
            <View style={styles.profilePhotoPlaceholder}>
              <Ionicons name="shield-checkmark" size={60} color="#2563eb" />
            </View>
            <Text style={styles.adminBadge}>Administrator</Text>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{user?.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Role</Text>
              <Text style={[styles.value, styles.roleValue]}>ADMIN</Text>
            </View>
          </View>

          {/* Change Password Section */}
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Ionicons name="key-outline" size={20} color="#2563eb" />
            <Text style={styles.secondaryButtonText}>Change Password</Text>
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.passwordSection}>
              <Text style={styles.sectionTitle}>Update Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb"
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  scrollContent: { padding: 16 },
  photoSection: { alignItems: "center", marginBottom: 20 },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#2563eb"
  },
  adminBadge: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb"
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  value: { fontSize: 14, color: "#111827", flex: 1, textAlign: "right" },
  roleValue: { color: "#2563eb", fontWeight: "700" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    marginTop: 8
  },
  secondaryButtonText: { color: "#2563eb", fontWeight: "700", fontSize: 15, marginLeft: 8 },
  passwordSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: 8,
    padding: 14,
    marginTop: 12
  },
  logoutText: { color: "#dc2626", fontWeight: "700", fontSize: 15, marginLeft: 8 }
});
