import { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function UserProfileModal({ visible, onClose }) {
  const { user, refreshMe, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Editable fields
  const [address, setAddress] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [organizationRole, setOrganizationRole] = useState("Citizen");
  const [organizationName, setOrganizationName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");
  const [allowInSafetyCircle, setAllowInSafetyCircle] = useState(true);
  const [receiveHelpRequests, setReceiveHelpRequests] = useState(true);

  // Emergency contacts
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  // Password change
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (visible && user) {
      loadProfile();
    }
  }, [visible, user]);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setAddress(data.user.address?.fullAddress || "");
      setProfilePhoto(data.user.profilePhoto);
      setOrganizationRole(data.user.organizationRole || "Citizen");
      setOrganizationName(data.user.organizationName || "");
      setBloodGroup(data.user.bloodGroup || "");
      setMedicalCondition(data.user.medicalCondition || "");
      setAllowInSafetyCircle(
        data.user.safetySettings?.allowInSafetyCircle ?? true,
      );
      setReceiveHelpRequests(
        data.user.safetySettings?.receiveHelpRequests ?? true,
      );
      setEmergencyContacts(data.emergencyContacts || []);
    } catch (err) {
      console.error("Load profile error:", err);
    }
  };

  const pickProfilePhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Permission Denied", "Gallery access is required");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      await api.updateProfile({
        address: { fullAddress: address },
        profilePhoto,
        organizationRole,
        organizationName:
          organizationRole === "Organization Member"
            ? organizationName
            : undefined,
        bloodGroup,
        medicalCondition,
        safetySettings: {
          allowInSafetyCircle,
          receiveHelpRequests,
        },
      });

      await refreshMe();
      Alert.alert("Success", "Profile updated successfully");
      setEditMode(false);
    } catch (err) {
      Alert.alert("Update Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

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
      {
        text: "Logout",
        onPress: () => {
          logout();
          onClose();
        },
        style: "destructive",
      },
    ]);
  };

  const addEmergencyContact = () => {
    Alert.prompt("Add Contact", "Enter contact name", async (name) => {
      if (!name) return;
      Alert.prompt(
        "Add Contact",
        "Enter phone number",
        async (number) => {
          if (!number) return;
          Alert.prompt(
            "Add Contact",
            "Enter relationship",
            async (relationship) => {
              if (!relationship) return;
              try {
                await api.addContact({ name, number, relationship });
                await loadProfile();
                Alert.alert("Success", "Contact added");
              } catch (err) {
                Alert.alert("Failed", err.message);
              }
            },
          );
        },
        "plain-text",
        "",
        "phone-pad",
      );
    });
  };

  const removeEmergencyContact = (contact) => {
    Alert.alert("Remove Contact", `Remove ${contact.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteContact(contact._id);
            await loadProfile();
            Alert.alert("Success", "Contact removed");
          } catch (err) {
            Alert.alert("Failed", err.message);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => setEditMode(!editMode)}>
            <Ionicons
              name={editMode ? "close-circle-outline" : "create-outline"}
              size={24}
              color="#2563eb"
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={60} color="#9ca3af" />
              </View>
            )}
            {editMode && (
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={pickProfilePhoto}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Basic Info (Read-Only) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{user?.phone}</Text>
            </View>
            {user?.username && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Username</Text>
                <Text style={styles.value}>{user.username}</Text>
              </View>
            )}
          </View>

          {/* Editable Fields */}
          {editMode ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edit Profile</Text>

              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Role</Text>
              {["Citizen", "Student", "Organization Member"].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleOption,
                    organizationRole === role && styles.roleOptionSelected,
                  ]}
                  onPress={() => setOrganizationRole(role)}
                >
                  <View style={styles.roleRadio}>
                    {organizationRole === role && (
                      <View style={styles.roleRadioInner} />
                    )}
                  </View>
                  <Text style={styles.roleText}>{role}</Text>
                </TouchableOpacity>
              ))}

              {organizationRole === "Organization Member" && (
                <>
                  <Text style={styles.inputLabel}>Organization Name</Text>
                  <TextInput
                    style={styles.input}
                    value={organizationName}
                    onChangeText={setOrganizationName}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Blood Group</Text>
              <TextInput
                style={styles.input}
                value={bloodGroup}
                onChangeText={setBloodGroup}
                placeholder="e.g., O+, A-, B+"
              />

              <Text style={styles.inputLabel}>Medical Condition</Text>
              <TextInput
                style={styles.input}
                value={medicalCondition}
                onChangeText={setMedicalCondition}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.sectionTitle}>Safety Circle Settings</Text>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAllowInSafetyCircle(!allowInSafetyCircle)}
              >
                <View style={styles.checkbox}>
                  {allowInSafetyCircle && (
                    <Ionicons name="checkmark" size={18} color="#2563eb" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Allow nearby users to see me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setReceiveHelpRequests(!receiveHelpRequests)}
              >
                <View style={styles.checkbox}>
                  {receiveHelpRequests && (
                    <Ionicons name="checkmark" size={18} color="#2563eb" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Receive help requests from Safety Circle
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Details</Text>
              {address && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Address</Text>
                  <Text style={styles.value}>{address}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{organizationRole}</Text>
              </View>
              {organizationName && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Organization</Text>
                  <Text style={styles.value}>{organizationName}</Text>
                </View>
              )}
              {bloodGroup && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Blood Group</Text>
                  <Text style={styles.value}>{bloodGroup}</Text>
                </View>
              )}
              {medicalCondition && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Medical Condition</Text>
                  <Text style={styles.value}>{medicalCondition}</Text>
                </View>
              )}
            </View>
          )}

          {/* Emergency Contacts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              {editMode && (
                <TouchableOpacity onPress={addEmergencyContact}>
                  <Ionicons name="add-circle" size={24} color="#2563eb" />
                </TouchableOpacity>
              )}
            </View>
            {emergencyContacts.map((contact) => (
              <View key={contact._id} style={styles.contactCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactInfo}>{contact.number}</Text>
                  <Text style={styles.contactRelation}>
                    {contact.relationship}
                  </Text>
                </View>
                {editMode && (
                  <TouchableOpacity
                    onPress={() => removeEmergencyContact(contact)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          {editMode && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSaveChanges}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Text style={styles.secondaryButtonText}>Change Password</Text>
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.passwordSection}>
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
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
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  scrollContent: { padding: 16 },
  photoSection: { alignItems: "center", marginBottom: 20 },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e5e7eb",
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  changePhotoText: { color: "#2563eb", fontWeight: "600" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  value: { fontSize: 14, color: "#111827", flex: 1, textAlign: "right" },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  roleOptionSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  roleRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  roleRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
  },
  roleText: { fontSize: 15, fontWeight: "600", color: "#111827" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxLabel: { fontSize: 14, color: "#374151", flex: 1 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  contactName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  contactInfo: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  contactRelation: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: { color: "#2563eb", fontWeight: "700", fontSize: 15 },
  passwordSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
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
    marginTop: 12,
  },
  logoutText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
});
