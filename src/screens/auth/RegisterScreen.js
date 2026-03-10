import { useRef, useState } from "react";
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
  View,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import { Audio } from "expo-av";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../../config/firebase";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const recaptchaVerifier = useRef(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setDateOfBirth(formattedDate);
    }
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Phone & OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Step 2: Personal Details + DigiLocker
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Step 3: Role Selection
  const [organizationRole, setOrganizationRole] = useState("Citizen");
  const [organizationName, setOrganizationName] = useState("");

  // Step 4: Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: "", number: "", relationship: "" },
  ]);
  const [allowSOSToContacts, setAllowSOSToContacts] = useState(true);
  const [shareLocationInEmergency, setShareLocationInEmergency] =
    useState(true);

  // Step 5: Location Permission
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationPermission, setLocationPermission] = useState("denied");

  // Step 6: Safety Permissions
  const [microphoneGranted, setMicrophoneGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Step 7: Safety Circle Settings
  const [allowInSafetyCircle, setAllowInSafetyCircle] = useState(true);
  const [receiveHelpRequests, setReceiveHelpRequests] = useState(true);

  // Step 8: Optional Safety Info
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicalCondition, setMedicalCondition] = useState("");

  // Step 9: Trusted Responder
  const [trustedResponderType, setTrustedResponderType] = useState("None");
  const [trustedResponderDepartment, setTrustedResponderDepartment] =
    useState("");
  const [trustedResponderIdProof, setTrustedResponderIdProof] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const totalSteps = 9;
  const isTrustedResponder = trustedResponderType !== "None";

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      return Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit phone number",
      );
    }
    if (
      !auth?.app?.options?.apiKey ||
      auth.app.options.apiKey === "YOUR_API_KEY"
    ) {
      return Alert.alert(
        "Firebase Not Configured",
        "Firebase web config is missing. Set EXPO_PUBLIC_FIREBASE_* values and restart the app.",
      );
    }

    setLoading(true);
    try {
      const phoneNumber = phone.startsWith("+")
        ? phone.trim()
        : `+91${phone.trim()}`;
      const phoneProvider = new PhoneAuthProvider(auth);
      const id = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current,
      );
      setVerificationId(id);
      Alert.alert(
        "OTP Sent",
        "Please check your phone for the verification code",
      );
    } catch (err) {
      Alert.alert("Failed", err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      return Alert.alert("Invalid OTP", "Please enter the 6-digit OTP");
    }
    if (!verificationId) {
      return Alert.alert("Error", "Please request OTP first");
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        otp.trim(),
      );
      const userCredential = await signInWithCredential(auth, credential);
      const idToken = await userCredential.user.getIdToken();
      await api.verifyFirebasePhone({ idToken });
      setPhoneVerified(true);
      setStep(2);
    } catch (err) {
      Alert.alert("Verification Failed", err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const simulateDigiLocker = async () => {
    setDigilockerLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDigilockerVerified(true);
      if (!name) setName("DigiLocker User");
      if (!dateOfBirth) setDateOfBirth("1995-01-01");
      if (!address) setAddress("Verified Address from DigiLocker");
      if (!aadhaarNumber) setAadhaarNumber("123456789012");
      Alert.alert(
        "DigiLocker",
        "DigiLocker verification completed (temporary)",
      );
    } finally {
      setDigilockerLoading(false);
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

  const pickIdProof = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  const validateStep2 = () => {
    if (!name.trim())
      return Alert.alert("Missing Field", "Please enter your full name");
    if (!username.trim())
      return Alert.alert("Missing Field", "Please enter a username");
    if (!password.trim())
      return Alert.alert("Missing Field", "Please enter a password");
    if (password !== confirmPassword)
      return Alert.alert("Password Mismatch", "Passwords do not match");
    if (!dateOfBirth.trim())
      return Alert.alert("Missing Field", "Please enter your date of birth");
    if (!address.trim())
      return Alert.alert("Missing Field", "Please enter your address");
    if (!aadhaarNumber.trim())
      return Alert.alert("Missing Field", "Please enter your Aadhaar number");
    if (aadhaarNumber.length !== 12)
      return Alert.alert("Invalid Aadhaar", "Aadhaar number must be 12 digits");
    setStep(3);
  };

  const validateStep3 = () => {
    if (
      organizationRole === "Organization Member" &&
      !organizationName.trim()
    ) {
      return Alert.alert("Missing Field", "Please enter organization name");
    }
    setStep(4);
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: "", number: "", relationship: "" },
    ]);
  };

  const removeEmergencyContact = (index) => {
    if (emergencyContacts.length === 1) {
      return Alert.alert(
        "Required",
        "At least 1 emergency contact is required",
      );
    }
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  const updateEmergencyContact = (index, field, value) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const validateStep4 = () => {
    for (const contact of emergencyContacts) {
      if (
        !contact.name.trim() ||
        !contact.number.trim() ||
        !contact.relationship.trim()
      ) {
        return Alert.alert(
          "Incomplete Contact",
          "Please fill all emergency contact fields",
        );
      }
    }
    if (!allowSOSToContacts || !shareLocationInEmergency) {
      return Alert.alert(
        "Required",
        "Please allow SOS alerts and live location sharing",
      );
    }
    setStep(5);
  };

  const requestLocationWhileUsing = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationGranted(true);
        setLocationPermission("while_using");
      } else {
        Alert.alert(
          "Location Required",
          "Location access is required for emergency features",
        );
      }
    } catch (err) {
      Alert.alert("Permission Error", err.message);
    }
  };

  const requestLocationAlways = async () => {
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
        Alert.alert(
          "Location Required",
          "Location access is required for emergency features",
        );
      }
    } catch (err) {
      Alert.alert("Permission Error", err.message);
    }
  };

  const validateStep5 = () => {
    if (!locationGranted) {
      return Alert.alert(
        "Location Required",
        "Please grant location permission to continue",
      );
    }
    setStep(6);
  };

  const requestMicrophonePermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setMicrophoneGranted(status === "granted");
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraGranted(status === "granted");
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const requestNotificationPermission = async () => {
    setNotificationsEnabled(true);
    Alert.alert("Notifications", "Notification permission granted");
  };

  const validateStep6 = () => {
    if (!microphoneGranted || !cameraGranted || !notificationsEnabled) {
      return Alert.alert(
        "Permissions Required",
        "Please enable microphone, camera, and notifications",
      );
    }
    setStep(7);
  };

  const validateStep9 = () => {
    if (isTrustedResponder) {
      if (!trustedResponderDepartment.trim()) {
        return Alert.alert("Missing Field", "Please enter department");
      }
      if (!trustedResponderIdProof) {
        return Alert.alert("Missing Field", "Please upload service ID");
      }
    }
    handleCompleteRegistration();
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});

      await register({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      await api.completeRegistration({
        dateOfBirth,
        aadhaarNumber,
        profilePhoto,
        organizationRole,
        organizationName:
          organizationRole === "Organization Member"
            ? organizationName
            : undefined,
        bloodGroup: bloodGroup || undefined,
        medicalCondition: medicalCondition || undefined,
        isTrustedResponder,
        trustedResponderType: isTrustedResponder
          ? trustedResponderType === "Retired Police"
            ? "Police"
            : "Army"
          : "None",
        trustedResponderIdProof: trustedResponderIdProof || undefined,
        trustedResponderDepartment: trustedResponderDepartment || undefined,
        safetySettings: {
          allowInSafetyCircle,
          receiveHelpRequests,
          shareLocationInEmergency,
          allowSOSToContacts,
        },
        permissions: {
          locationAccess: locationPermission,
          microphoneAccess: microphoneGranted,
          cameraAccess: cameraGranted,
          notificationsEnabled,
        },
      });

      for (const contact of emergencyContacts) {
        await api.addContact({
          name: contact.name.trim(),
          number: contact.number.trim(),
          relationship: contact.relationship.trim(),
        });
      }

      if (isTrustedResponder && trustedResponderIdProof) {
        setVerifying(true);
        try {
          await api.verifyResponder();
        } finally {
          setVerifying(false);
        }
      }

      Alert.alert("Success!", "Account created successfully");
      // navigation.replace("Home");
    } catch (err) {
      Alert.alert("Registration Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={true}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {step} of {totalSteps}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Mobile Number Verification</Text>
            <Text style={styles.stepDescription}>
              Enter your mobile number for OTP verification
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Mobile Number (10 digits)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!phoneVerified}
            />
            {!verificationId && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP via SMS</Text>
                )}
              </TouchableOpacity>
            )}
            {verificationId && !phoneVerified && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton,
                      { flex: 1, marginRight: 8 },
                    ]}
                    onPress={handleSendOtp}
                  >
                    <Text style={styles.secondaryButtonText}>Resend OTP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>eKYC / DigiLocker</Text>
            <Text style={styles.stepDescription}>
              Verify identity or fill details manually
            </Text>

            <TouchableOpacity
              style={styles.digilockerBtn}
              onPress={simulateDigiLocker}
              disabled={digilockerLoading}
            >
              {digilockerLoading ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#2563eb"
                  />
                  <Text style={styles.digilockerText}>
                    {digilockerVerified
                      ? "DigiLocker Verified"
                      : "Fetch from DigiLocker (temporary)"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Username *"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            {/* <TextInput style={styles.input} placeholder="Date of Birth (YYYY-MM-DD) *" value={dateOfBirth} onChangeText={setDateOfBirth} /> */}
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: dateOfBirth ? "#111827" : "#9ca3af" }}>
                {dateOfBirth || "Select Date of Birth"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
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

            <TouchableOpacity
              style={styles.photoButton}
              onPress={pickProfilePhoto}
            >
              <Ionicons name="camera-outline" size={20} color="#2563eb" />
              <Text style={styles.photoButtonText}>
                {profilePhoto
                  ? "Change Profile Photo"
                  : "Add Profile Photo (Optional)"}
              </Text>
            </TouchableOpacity>
            {profilePhoto && (
              <Image
                source={{ uri: profilePhoto }}
                style={styles.photoPreview}
              />
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={validateStep2}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Role Selection</Text>
            <Text style={styles.stepDescription}>
              Select your role in the platform
            </Text>
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
              <TextInput
                style={styles.input}
                placeholder="Organization Name (Optional)"
                value={organizationName}
                onChangeText={setOrganizationName}
              />
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={validateStep3}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Emergency Contacts</Text>
            <Text style={styles.stepDescription}>
              Minimum 1 contact is required
            </Text>
            {emergencyContacts.map((contact, idx) => (
              <View key={`contact-${idx}`} style={styles.contactBlock}>
                <TextInput
                  style={styles.input}
                  placeholder="Contact Name"
                  value={contact.name}
                  onChangeText={(v) => updateEmergencyContact(idx, "name", v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={contact.number}
                  onChangeText={(v) => updateEmergencyContact(idx, "number", v)}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Relationship"
                  value={contact.relationship}
                  onChangeText={(v) =>
                    updateEmergencyContact(idx, "relationship", v)
                  }
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeEmergencyContact(idx)}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={addEmergencyContact}
            >
              <Text style={styles.addText}>Add Contact</Text>
            </TouchableOpacity>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAllowSOSToContacts(!allowSOSToContacts)}
              >
                {allowSOSToContacts && (
                  <Ionicons name="checkmark" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Allow SOS alerts to these contacts
              </Text>
            </View>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() =>
                  setShareLocationInEmergency(!shareLocationInEmergency)
                }
              >
                {shareLocationInEmergency && (
                  <Ionicons name="checkmark" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Share live location during emergencies
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(3)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={validateStep4}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Location Permission</Text>
            <Text style={styles.stepDescription}>
              Choose location access level for safety features
            </Text>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestLocationAlways}
            >
              <Text style={styles.permissionButtonText}>
                Allow Always (recommended)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestLocationWhileUsing}
            >
              <Text style={styles.permissionButtonText}>
                Allow While Using App
              </Text>
            </TouchableOpacity>

            <Text style={styles.permissionStatus}>
              Current:{" "}
              {locationPermission === "denied"
                ? "Not Granted"
                : locationPermission}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(4)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={validateStep5}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 6 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Safety Permissions</Text>
            <Text style={styles.stepDescription}>
              These are required for emergency features
            </Text>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestMicrophonePermission}
            >
              <Text style={styles.permissionButtonText}>Microphone Access</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestCameraPermission}
            >
              <Text style={styles.permissionButtonText}>Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestNotificationPermission}
            >
              <Text style={styles.permissionButtonText}>Notifications</Text>
            </TouchableOpacity>

            <Text style={styles.permissionStatus}>
              Microphone: {microphoneGranted ? "Enabled" : "Not Enabled"} |
              Camera: {cameraGranted ? "Enabled" : "Not Enabled"} |
              Notifications: {notificationsEnabled ? "Enabled" : "Not Enabled"}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(5)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={validateStep6}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 7 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Safety Circle Settings</Text>
            <Text style={styles.stepDescription}>
              Control your visibility and help requests
            </Text>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAllowInSafetyCircle(!allowInSafetyCircle)}
              >
                {allowInSafetyCircle && (
                  <Ionicons name="checkmark" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Allow nearby users to see me in Safety Circle
              </Text>
            </View>

            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setReceiveHelpRequests(!receiveHelpRequests)}
              >
                {receiveHelpRequests && (
                  <Ionicons name="checkmark" size={18} color="#2563eb" />
                )}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Receive help requests from nearby users
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(6)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={() => setStep(8)}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 8 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Optional Safety Information</Text>
            <Text style={styles.stepDescription}>
              Helps emergency responders
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Blood Group (Optional)"
              value={bloodGroup}
              onChangeText={setBloodGroup}
            />
            <TextInput
              style={styles.input}
              placeholder="Medical Condition (Optional)"
              value={medicalCondition}
              onChangeText={setMedicalCondition}
              multiline
              numberOfLines={2}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(7)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={() => setStep(9)}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 9 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Trusted Responder (Optional)</Text>
            <Text style={styles.stepDescription}>
              Register if you are a retired police or army officer
            </Text>

            {["None", "Retired Police", "Retired Army"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.roleOption,
                  trustedResponderType === type && styles.roleOptionSelected,
                ]}
                onPress={() => setTrustedResponderType(type)}
              >
                <View style={styles.roleRadio}>
                  {trustedResponderType === type && (
                    <View style={styles.roleRadioInner} />
                  )}
                </View>
                <Text style={styles.roleText}>{type}</Text>
              </TouchableOpacity>
            ))}

            {isTrustedResponder && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Department"
                  value={trustedResponderDepartment}
                  onChangeText={setTrustedResponderDepartment}
                />
                <TouchableOpacity
                  style={styles.photoButton}
                  onPress={pickIdProof}
                >
                  <Ionicons
                    name="document-attach-outline"
                    size={20}
                    color="#2563eb"
                  />
                  <Text style={styles.photoButtonText}>
                    {trustedResponderIdProof
                      ? "Change Service ID"
                      : "Upload Service ID"}
                  </Text>
                </TouchableOpacity>
                {trustedResponderIdProof && (
                  <Image
                    source={{ uri: trustedResponderIdProof }}
                    style={styles.photoPreview}
                  />
                )}
                <Text style={styles.helperText}>
                  Verification will run after submission.
                </Text>
              </>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => setStep(8)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1 }]}
                onPress={validateStep9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={verifying} transparent animationType="fade">
        <View style={styles.verifyBackdrop}>
          <View style={styles.verifyCard}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.verifyText}>Verifying ID. Please wait...</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  progressContainer: { marginBottom: 20 },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 4 },
  stepContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  stepDescription: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButtonText: { color: "#2563eb", fontWeight: "700", fontSize: 15 },
  buttonRow: { flexDirection: "row", marginTop: 8 },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordInput: { flex: 1, padding: 12, fontSize: 15 },
  eyeBtn: { padding: 12 },
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
    marginBottom: 12,
  },
  photoButtonText: {
    color: "#2563eb",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 14,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 12,
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
  roleOptionSelected: { backgroundColor: "#eff6ff", borderColor: "#2563eb" },
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
  contactBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  addBtn: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  addText: { color: "#2563eb", fontWeight: "700" },
  removeBtn: { alignSelf: "flex-end", paddingVertical: 6 },
  removeText: { color: "#dc2626", fontWeight: "700" },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
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
  permissionButton: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  permissionButtonText: { color: "#2563eb", fontWeight: "700" },
  permissionStatus: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  digilockerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  digilockerText: { color: "#2563eb", fontWeight: "700" },
  helperText: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  verifyBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "80%",
  },
  verifyText: { marginTop: 10, color: "#111827", fontWeight: "600" },
});
