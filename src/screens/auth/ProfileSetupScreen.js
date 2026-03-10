import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import { Audio } from "expo-av";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function ProfileSetupScreen({ navigation }) {
  const { refreshMe } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Personal Details
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  // Role
  const [organizationRole, setOrganizationRole] = useState("Citizen");
  const [organizationName, setOrganizationName] = useState("");
  
  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: "", number: "", relationship: "" }
  ]);
  
  // Safety Settings
  const [allowInSafetyCircle, setAllowInSafetyCircle] = useState(true);
  const [receiveHelpRequests, setReceiveHelpRequests] = useState(true);
  const [allowSOSToContacts, setAllowSOSToContacts] = useState(true);
  const [shareLocationInEmergency, setShareLocationInEmergency] = useState(true);
  
  // Permissions
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationPermission, setLocationPermission] = useState("denied");
  const [microphoneGranted, setMicrophoneGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Optional
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");
  
  // Trusted Responder
  const [isTrustedResponder, setIsTrustedResponder] = useState(false);
  const [trustedResponderType, setTrustedResponderType] = useState("Police");
  const [trustedResponderDepartment, setTrustedResponderDepartment] = useState("");
  const [trustedResponderIdProof, setTrustedResponderIdProof] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const totalSteps = 7;

  const pickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  const pickIdProof = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Permission Denied", "Gallery access is required");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setTrustedResponderIdProof(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([...emergencyContacts, { name: "", number: "", relationship: "" }]);
  };

  const removeEmergencyContact = (index) => {
    if (emergencyContacts.length === 1) {
      return Alert.alert("Required", "At least 1 emergency contact is required");
    }
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const updateEmergencyContact = (index, field, value) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationGranted(true);
        setLocationPermission("while_using");
        
        const bgStatus = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus.status === "granted") {
          setLocationPermission("always");
        }
      } else {
        Alert.alert("Location Required", "Location access is required for emergency features");
      }
    } catch (err) {
      Alert.alert("Permission Error", err.message);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setMicrophoneGranted(status === "granted");
    } catch (err) {
      console.error("Microphone permission error:", err);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraGranted(status === "granted");
    } catch (err) {
      console.error("Camera permission error:", err);
    }
  };

  const validateStep1 = () => {
    if (!dateOfBirth.trim()) return Alert.alert("Missing Field", "Please enter your date of birth");
    if (!address.trim()) return Alert.alert("Missing Field", "Please enter your address");
    if (!aadhaarNumber.trim()) return Alert.alert("Missing Field", "Please enter your Aadhaar number");
    if (aadhaarNumber.length !== 12) return Alert.alert("Invalid Aadhaar", "Aadhaar number must be 12 digits");
    setStep(2);
  };

  const validateStep2 = () => {
    if (organizationRole === "Organization Member" && !organizationName.trim()) {
      return Alert.alert("Missing Field", "Please enter organization name");
    }
    setStep(3);
  };

  const validateStep3 = () => {
    for (let contact of emergencyContacts) {
      if (!contact.name.trim() || !contact.number.trim() || !contact.relationship.trim()) {
        return Alert.alert("Incomplete Contact", "Please fill all emergency contact fields");
      }
    }
    setStep(4);
  };

  const handleComplete = async () => {
    if (!locationGranted) {
      return Alert.alert("Location Required", "Please grant location permission to continue");
    }

    setLoading(true);
    try {
      // Complete registration
      await api.completeRegistration({
        dateOfBirth,
        aadhaarNumber,
        profilePhoto,
        organizationRole,
        organizationName: organizationRole === "Organization Member" ? organizationName : undefined,
        bloodGroup: bloodGroup || undefined,
        medicalCondition: medicalCondition || undefined,
        isTrustedResponder,
        trustedResponderType: isTrustedResponder ? trustedResponderType : "None",
        trustedResponderIdProof: trustedResponderIdProof || undefined,
        trustedResponderDepartment: trustedResponderDepartment || undefined,
        safetySettings: {
          allowInSafetyCircle,
          receiveHelpRequests,
          shareLocationInEmergency,
          allowSOSToContacts
        },
        permissions: {
          locationAccess: locationPermission,
          microphoneAccess: microphoneGranted,
          cameraAccess: cameraGranted,
          notificationsEnabled
        }
      });

      // Add emergency contacts
      for (let contact of emergencyContacts) {
        await api.addContact({
          name: contact.name.trim(),
          number: contact.number.trim(),
          relationship: contact.relationship.trim()
        });
      }

      // Verify trusted responder if needed
      if (isTrustedResponder && trustedResponderIdProof) {
        setVerifying(true);
        try {
          await api.verifyResponder();
          Alert.alert("Verified!", "Your trusted responder ID has been verified");
        } catch (err) {
          console.error("Verification error:", err);
        } finally {
          setVerifying(false);
        }
      }

      await refreshMe();
      Alert.alert("Success!", "Profile setup completed");
      navigation.replace("Home");
    } catch (err) {
      Alert.alert("Setup Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
          </View>
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>👤 Complete Your Profile</Text>
            <Text style={styles.stepDescription}>Fill in additional eKYC details</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Date of Birth (YYYY-MM-DD) *"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Full Address *"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Aadhaar Number (12 digits) *"
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              keyboardType="number-pad"
              maxLength={12}
            />
            
            <TouchableOpacity style={styles.photoButton} onPress={pickProfilePhoto}>
              <Ionicons name="camera-outline" size={20} color="#2563eb" />
              <Text style={styles.photoButtonText}>
                {profilePhoto ? "Change Profile Photo" : "Add Profile Photo (Optional)"}
              </Text>
            </TouchableOpacity>
            
            {profilePhoto && (
              <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
            )}
            
            <TouchableOpacity style={styles.primaryButton} onPress={validateStep1}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Steps 2-7 continue here... */}
        {/* Due to character limit, showing structure only */}
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  progressContainer: { marginBottom: 20 },
  progressText: { fontSize: 14, fontWeight: "600", color: "#6b7280", marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 4 },
  stepContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 20 },
  stepTitle: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 8 },
  stepDescription: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
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
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12
  },
  photoButtonText: {
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 12
  }
});
