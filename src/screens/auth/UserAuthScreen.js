import { useState } from "react";
import {
  Alert,
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
import { useAuth } from "../../context/AuthContext";

export default function UserAuthScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    if (!identifier.trim() || !password.trim()) {
      return Alert.alert("Missing details", "Please enter identifier and password.");
    }

    setLoading(true);
    try {
      await login({ identifier: identifier.trim().toLowerCase(), password, role: "USER" });
    } catch (err) {
      Alert.alert("Authentication failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardSafe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Citizen Access</Text>
        <Text style={styles.caption}>Login with phone, email, or username.</Text>

        <TextInput
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="Phone, Email or Username"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.submit} onPress={submit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? "Please wait..." : "Login"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>Create Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardSafe: { flex: 1, backgroundColor: "#f1f3f5" },
  container: { flexGrow: 1, backgroundColor: "#f1f3f5", padding: 20, justifyContent: "center" },
  heading: { fontSize: 30, fontWeight: "700", color: "#111827" },
  caption: { color: "#6b7280", marginBottom: 14, marginTop: 6 },
  input: { marginTop: 10, backgroundColor: "#fff", borderRadius: 10, borderColor: "#d1d5db", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  passwordWrap: { marginTop: 10, backgroundColor: "#fff", borderRadius: 10, borderColor: "#d1d5db", borderWidth: 1, paddingLeft: 12, paddingRight: 8, flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, paddingVertical: 11 },
  eyeBtn: { padding: 6 },
  submit: { marginTop: 14, backgroundColor: "#2456e3", borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  submitText: { color: "#fff", fontWeight: "700" },
  registerBtn: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  registerText: { color: "#2456e3", fontWeight: "700" }
});
