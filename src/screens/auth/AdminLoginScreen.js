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
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function AdminLoginScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("Admin");
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const seedAdmin = async () => {
    try {
      const data = await api.seedAdmin();
      Alert.alert("Admin Seed", `${data.message}\nusername: ${data.username || "admin"}`);
    } catch (err) {
      Alert.alert("Seed failed", err.message);
    }
  };

  const submit = async () => {
    if (!identifier.trim() || !password.trim()) {
      return Alert.alert("Missing details", "Please enter username and password.");
    }
    if (mode === "register" && !name.trim()) {
      return Alert.alert("Missing name", "Please enter admin name.");
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login({ identifier: identifier.trim().toLowerCase(), password, role: "ADMIN" });
      } else {
        await api.registerAdmin({ name: name.trim(), username: identifier.trim().toLowerCase(), password });
        Alert.alert("Admin created", "Account created. Please login with the same credentials.");
        setMode("login");
      }
    } catch (err) {
      Alert.alert(mode === "login" ? "Admin login failed" : "Admin creation failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardSafe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Government Admin Access</Text>
        <Text style={styles.caption}>Simple login. Default: admin / admin</Text>

        <View style={styles.switchRow}>
          <TouchableOpacity style={[styles.switchBtn, mode === "login" && styles.switchActive]} onPress={() => setMode("login")}>
            <Text style={styles.switchText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.switchBtn, mode === "register" && styles.switchActive]} onPress={() => setMode("register")}>
            <Text style={styles.switchText}>Create Admin</Text>
          </TouchableOpacity>
        </View>

        {mode === "register" ? (
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Admin name" autoCapitalize="words" />
        ) : null}

        <TextInput
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="Admin username"
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
          <Text style={styles.submitText}>
            {loading ? "Please wait..." : mode === "login" ? "Login as Admin" : "Create Admin Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.seedBtn} onPress={seedAdmin}>
          <Text style={styles.seedText}>Seed Default Admin</Text>
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
  switchRow: { flexDirection: "row", marginBottom: 6 },
  switchBtn: { flex: 1, backgroundColor: "#e5e7eb", paddingVertical: 10, alignItems: "center", borderRadius: 8, marginRight: 6 },
  switchActive: { backgroundColor: "#bfdbfe" },
  switchText: { fontWeight: "600", color: "#111827" },
  input: { marginTop: 10, backgroundColor: "#fff", borderRadius: 10, borderColor: "#d1d5db", borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  passwordWrap: { marginTop: 10, backgroundColor: "#fff", borderRadius: 10, borderColor: "#d1d5db", borderWidth: 1, paddingLeft: 12, paddingRight: 8, flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, paddingVertical: 11 },
  eyeBtn: { padding: 6 },
  submit: { marginTop: 14, backgroundColor: "#2456e3", borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  submitText: { color: "#fff", fontWeight: "700" },
  seedBtn: { marginTop: 10, alignItems: "center", paddingVertical: 8 },
  seedText: { color: "#2456e3", fontWeight: "600" }
});
