import { useEffect, useMemo, useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/ScreenContainer";
import SectionCard from "../../components/SectionCard";
import { api } from "../../api/client";
import { QUICK_ALERT_TEMPLATES } from "../../constants/config";
import { useSocketEvents } from "../../context/SocketContext";

export default function AdminScreen() {
  const { events } = useSocketEvents();
  const [stats, setStats] = useState({ total: 0, safe: 0, emergency: 0, risk: 0, unknown: 0 });
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [emergencyUsers, setEmergencyUsers] = useState([]);
  const [riskUsers, setRiskUsers] = useState([]);

  const [alertType, setAlertType] = useState("Warning");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("warning");
  
  // Location-based broadcast fields
  const [targetScope, setTargetScope] = useState("Nation");
  const [targetState, setTargetState] = useState("");
  const [targetCity, setTargetCity] = useState("");
  const [targetDistrict, setTargetDistrict] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ alertLevel: "SAFE", incidentType: "NONE", incidentNote: "" });
  const isSmall = Dimensions.get("window").width < 390;

  const load = async () => {
    try {
      const [overviewRes, sosRes, bcRes, emergencyRes, riskRes] = await Promise.all([
        api.adminOverview(),
        api.activeSos(),
        api.broadcasts(),
        api.adminEmergencyUsers(),
        api.adminRiskUsers()
      ]);
      setStats(overviewRes.stats || stats);
      setActiveAlerts(sosRes.alerts || []);
      setBroadcasts(bcRes.broadcasts || []);
      setEmergencyUsers(emergencyRes.users || []);
      setRiskUsers(riskRes.users || []);
      const sys = await api.systemStatus();
      setSystemStatus(sys.status || { alertLevel: "SAFE" });
    } catch (err) {
      Alert.alert("Admin sync failed", err.message);
    }
  };

  const loadLocationData = async () => {
    try {
      const statesRes = await api.getStates();
      setStates(statesRes.states || []);
    } catch (err) {
      console.error("Failed to load states", err);
    }
  };

  useEffect(() => {
    load();
    loadLocationData();
  }, []);

  useEffect(() => {
    if (events.length) load();
  }, [events]);



  const pickTemplate = (tpl) => {
    setAlertType(tpl.alertType);
    setSeverity(tpl.severity);
    setTitle(tpl.title);
    setMessage(tpl.message);
  };

  const handleStateChange = async (state) => {
    setTargetState(state);
    setTargetCity("");
    setTargetDistrict("");
    setCities([]);
    setDistricts([]);
    if (state) {
      try {
        const citiesRes = await api.getCities(state);
        setCities(citiesRes.cities || []);
      } catch (err) {
        console.error("Failed to load cities", err);
        Alert.alert("Error", "Failed to load cities");
      }
    }
  };

  const handleCityChange = async (city) => {
    setTargetCity(city);
    setTargetDistrict("");
    setDistricts([]);
    if (city && targetState) {
      try {
        const districtsRes = await api.getDistricts(targetState, city);
        setDistricts(districtsRes.districts || []);
      } catch (err) {
        console.error("Failed to load districts", err);
        Alert.alert("Error", "Failed to load districts for this city");
      }
    }
  };

  const sendBroadcast = async () => {
    // Validation
    if (!title || !message) {
      Alert.alert("Validation Error", "Please provide title and message");
      return;
    }
    
    if (targetScope !== "Nation" && !targetState) {
      Alert.alert("Validation Error", "Please select a state");
      return;
    }
    
    if (["City", "District"].includes(targetScope) && !targetCity) {
      Alert.alert("Validation Error", "Please select a city");
      return;
    }
    
    // Generate zone description automatically
    let zoneDescription = "Nation-wide";
    if (targetScope === "State") {
      zoneDescription = targetState;
    } else if (targetScope === "City") {
      zoneDescription = `${targetCity}, ${targetState}`;
    } else if (targetScope === "District") {
      zoneDescription = targetDistrict ? `${targetDistrict}, ${targetCity}, ${targetState}` : `All districts in ${targetCity}, ${targetState}`;
    }
    
    try {
      await api.createBroadcast({ 
        alertType, 
        zone: zoneDescription,
        title, 
        message, 
        severity,
        targetScope,
        targetState: targetScope !== "Nation" ? targetState : null,
        targetCity: ["City", "District"].includes(targetScope) ? targetCity : null,
        targetDistrict: targetScope === "District" && targetDistrict ? targetDistrict : null
      });
      setTitle("");
      setMessage("");
      setTargetScope("Nation");
      setTargetState("");
      setTargetCity("");
      setTargetDistrict("");
      await load();
      Alert.alert("Success", "Broadcast sent successfully");
    } catch (err) {
      Alert.alert("Broadcast failed", err.message);
    }
  };

  const patchAlert = async (id, status) => {
    try {
      await api.updateSos(id, { status });
      await load();
    } catch (err) {
      Alert.alert("Update failed", err.message);
    }
  };

  const setAlertLevel = async (level, nextIncidentType = systemStatus.incidentType) => {
    try {
      await api.setSystemStatus({ alertLevel: level, incidentType: nextIncidentType, incidentNote: systemStatus.incidentNote });
      const sys = await api.systemStatus();
      setSystemStatus(sys.status || { alertLevel: level });
    } catch (err) {
      Alert.alert("Alert update failed", err.message);
    }
  };

  const incidentOptions = [
    { key: "NONE", label: "No Incident" },
    { key: "FLOOD", label: "Flood" },
    { key: "WAR", label: "War / Conflict" },
    { key: "TSUNAMI", label: "Tsunami" },
    { key: "EARTHQUAKE", label: "Earthquake" },
    { key: "FIRE", label: "Urban Fire" },
    { key: "PANDEMIC", label: "Pandemic" },
    { key: "TERROR", label: "Terror Threat" }
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Admin Control Panel</Text>
        <Text style={styles.subtitle}>Manage crisis response & citizen safety</Text>

        <SectionCard style={[styles.alertBox, systemStatus.alertLevel === "HIGH" ? styles.alertHigh : styles.alertSafe]}>
          <Text style={styles.alertLabel}>Global Crisis Mode</Text>
          <Text style={styles.alertValue}>{systemStatus.alertLevel === "HIGH" ? "HIGH ALERT" : "SAFE"}</Text>
          <Text style={styles.incidentText}>
            {systemStatus.incidentType && systemStatus.incidentType !== "NONE"
              ? `Active incident: ${systemStatus.incidentType}`
              : "No specific incident selected"}
          </Text>
          <View style={styles.alertActions}>
            <TouchableOpacity style={[styles.levelBtn, styles.levelHigh]} onPress={() => setAlertLevel("HIGH")}>
              <Text style={styles.levelText}>Set High</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.levelBtn, styles.levelSafe]} onPress={() => setAlertLevel("SAFE", "NONE")}>
              <Text style={styles.levelText}>Set Safe</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.incidentChips}>
            {incidentOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.incidentChip,
                  systemStatus.incidentType === opt.key && styles.incidentChipActive
                ]}
                onPress={async () => {
                  const next = { ...systemStatus, incidentType: opt.key };
                  setSystemStatus(next);
                  await api.setSystemStatus({
                    alertLevel: systemStatus.alertLevel,
                    incidentType: opt.key,
                    incidentNote: systemStatus.incidentNote
                  });
                }}
              >
                <Text
                  style={[
                    styles.incidentChipText,
                    systemStatus.incidentType === opt.key && styles.incidentChipTextActive
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.incidentNote]}
            value={systemStatus.incidentNote || ""}
            onChangeText={(val) => setSystemStatus((prev) => ({ ...prev, incidentNote: val }))}
            placeholder="Optional note (e.g., affected zones, instructions)"
            multiline
          />
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Broadcast Alert Creation</Text>
          
          <Text style={styles.label}>Alert Type</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[styles.pickerBtn, alertType === "Advisory" && styles.pickerBtnActive]} 
              onPress={() => setAlertType("Advisory")}
            >
              <Text style={[styles.pickerText, alertType === "Advisory" && styles.pickerTextActive]}>Advisory</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerBtn, alertType === "Warning" && styles.pickerBtnActive]} 
              onPress={() => setAlertType("Warning")}
            >
              <Text style={[styles.pickerText, alertType === "Warning" && styles.pickerTextActive]}>Warning</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerBtn, alertType === "Emergency" && styles.pickerBtnActive]} 
              onPress={() => setAlertType("Emergency")}
            >
              <Text style={[styles.pickerText, alertType === "Emergency" && styles.pickerTextActive]}>Emergency</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Target Scope</Text>
          <View style={styles.pickerContainer}>
            <TouchableOpacity 
              style={[styles.pickerBtn, targetScope === "Nation" && styles.pickerBtnActive]} 
              onPress={() => { setTargetScope("Nation"); setTargetState(""); setTargetCity(""); setTargetDistrict(""); }}
            >
              <Text style={[styles.pickerText, targetScope === "Nation" && styles.pickerTextActive]}>Nation</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerBtn, targetScope === "State" && styles.pickerBtnActive]} 
              onPress={() => setTargetScope("State")}
            >
              <Text style={[styles.pickerText, targetScope === "State" && styles.pickerTextActive]}>State</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerBtn, targetScope === "City" && styles.pickerBtnActive]} 
              onPress={() => setTargetScope("City")}
            >
              <Text style={[styles.pickerText, targetScope === "City" && styles.pickerTextActive]}>City</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pickerBtn, targetScope === "District" && styles.pickerBtnActive]} 
              onPress={() => setTargetScope("District")}
            >
              <Text style={[styles.pickerText, targetScope === "District" && styles.pickerTextActive]}>District</Text>
            </TouchableOpacity>
          </View>

          {targetScope !== "Nation" && (
            <View>
              <Text style={styles.label}>Select State</Text>
              <View style={styles.dropdown}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {states.map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={[styles.dropdownItem, targetState === state && styles.dropdownItemActive]}
                      onPress={() => handleStateChange(state)}
                    >
                      <Text style={[styles.dropdownText, targetState === state && styles.dropdownTextActive]}>{state}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {["City", "District"].includes(targetScope) && targetState && (
            <View>
              <Text style={styles.label}>Select City</Text>
              <View style={styles.dropdown}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[styles.dropdownItem, targetCity === city && styles.dropdownItemActive]}
                      onPress={() => handleCityChange(city)}
                    >
                      <Text style={[styles.dropdownText, targetCity === city && styles.dropdownTextActive]}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {targetScope === "District" && targetCity && (
            <View>
              <Text style={styles.label}>Select District</Text>
              <View style={styles.dropdown}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {districts.map((district) => (
                    <TouchableOpacity
                      key={district}
                      style={[styles.dropdownItem, targetDistrict === district && styles.dropdownItemActive]}
                      onPress={() => setTargetDistrict(district)}
                    >
                      <Text style={[styles.dropdownText, targetDistrict === district && styles.dropdownTextActive]}>{district}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Alert Title" />
          <TextInput style={[styles.input, styles.multiline]} value={message} onChangeText={setMessage} multiline placeholder="Message" />

          <Text style={styles.quickTitle}>Quick Alert Templates</Text>
          <View style={styles.quickGrid}>
            {QUICK_ALERT_TEMPLATES.map((tpl) => (
              <TouchableOpacity key={tpl.key} style={styles.quickBtn} onPress={() => pickTemplate(tpl)}>
                <Text style={styles.quickTxt}>{tpl.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.sendBtn} onPress={sendBroadcast}>
            <Ionicons name="paper-plane-outline" size={16} color="#fff" />
            <Text style={styles.sendText}>Send Broadcast</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Emergency Citizens</Text>
          <Text style={styles.sectionSubtitle}>Citizens in emergency status ({emergencyUsers.length})</Text>
          {emergencyUsers.length === 0 && (
            <Text style={styles.emptyText}>No users currently in emergency status</Text>
          )}
          {emergencyUsers.map((user) => (
            <View key={user.id} style={styles.emergencyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertName}>{user.name}</Text>
                <Text style={styles.alertMeta}>
                  Status: EMERGENCY • Distance: {user.distanceKm} km
                </Text>
                {user.phone && (
                  <Text style={styles.alertPhone}>Phone: {user.phone}</Text>
                )}
              </View>
              <View style={styles.statusBadge}>
                <Ionicons 
                  name="alert-circle" 
                  size={20} 
                  color="#dc2626" 
                />
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Possible Risk List</Text>
          <Text style={styles.sectionSubtitle}>Citizens in possible risk status ({riskUsers.length})</Text>
          {riskUsers.length === 0 && (
            <Text style={styles.emptyText}>No users currently in possible risk status</Text>
          )}
          {riskUsers.map((user) => (
            <View key={user.id} style={styles.riskRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertName}>{user.name}</Text>
                <Text style={styles.alertMeta}>
                  Status: POSSIBLE RISK • Distance: {user.distanceKm} km
                </Text>
                {user.phone && (
                  <Text style={styles.alertPhone}>Phone: {user.phone}</Text>
                )}
              </View>
              <View style={styles.statusBadge}>
                <Ionicons 
                  name="time" 
                  size={20} 
                  color="#f59e0b" 
                />
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Active Distress Users</Text>
          {activeAlerts.length === 0 && (
            <Text style={styles.emptyText}>No active distress alerts</Text>
          )}
          {activeAlerts.map((alert) => (
            <View key={alert._id} style={styles.distressRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertName}>{alert.userId?.name || "User"}</Text>
                <Text style={styles.alertMeta}>{alert.mode} • {alert.status}</Text>
                {alert.userMessage && (
                  <Text style={styles.userMessage}>Message: {alert.userMessage}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.resolveBtn} 
                onPress={() => patchAlert(alert._id, "RESOLVED")}
              >
                <Text style={styles.resolveBtnText}>Resolve</Text>
              </TouchableOpacity>
            </View>
          ))}
        </SectionCard>

        <SectionCard>
          <Text style={styles.sectionTitle}>Recent Broadcasts</Text>
          {broadcasts.slice(0, 10).map((item) => {
            const alertColors = {
              Advisory: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
              Warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
              Emergency: { bg: "#fecaca", border: "#dc2626", text: "#991b1b" }
            };
            const theme = alertColors[item.alertType] || alertColors.Warning;
            
            return (
              <View 
                key={item._id} 
                style={[
                  styles.bcRow, 
                  { backgroundColor: theme.bg, borderLeftWidth: 3, borderLeftColor: theme.border }
                ]}
              >
                <Text style={[styles.bcTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.bcMeta, { color: theme.text }]}>
                  {item.zone || item.targetScope || "Nation-wide"} • {item.alertType}
                </Text>
                <Text style={[styles.bcMsg, { color: theme.text }]}>{item.message}</Text>
              </View>
            );
          })}
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: 10, paddingBottom: 24 },
  title: { fontSize: 28, marginHorizontal: 12, color: "#111827", fontWeight: "700" },
  subtitle: { marginHorizontal: 12, color: "#6b7280", marginBottom: 8 },
  alertBox: { borderRadius: 12 },
  alertHigh: { backgroundColor: "#ef4444" },
  alertSafe: { backgroundColor: "#16a34a" },
  alertLabel: { color: "#fee2e2", fontWeight: "600", fontSize: 12 },
  alertValue: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  incidentText: { color: "#fee2e2", marginTop: 4, fontSize: 13 },
  alertActions: { flexDirection: "row", marginTop: 10 },
  levelBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center", marginRight: 8 },
  levelHigh: { backgroundColor: "rgba(127,29,29,0.35)" },
  levelSafe: { backgroundColor: "rgba(5,46,22,0.35)" },
  levelText: { color: "#fff", fontWeight: "700" },
  incidentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10
  },
  incidentChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)"
  },
  incidentChipActive: {
    backgroundColor: "#ffffff"
  },
  incidentChipText: {
    color: "#fef2f2",
    fontSize: 11,
    fontWeight: "600"
  },
  incidentChipTextActive: {
    color: "#b91c1c"
  },
  incidentNote: {
    marginTop: 8
  },

  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#111827", marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  label: { marginTop: 10, fontSize: 14, fontWeight: "600", color: "#374151" },
  pickerContainer: { flexDirection: "row", marginTop: 8, gap: 8 },
  pickerBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center", backgroundColor: "#e5e7eb" },
  pickerBtnActive: { backgroundColor: "#2563eb" },
  pickerText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  pickerTextActive: { color: "#fff" },
  dropdown: { marginTop: 6, backgroundColor: "#f9fafb", borderRadius: 8, padding: 8 },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8, backgroundColor: "#e5e7eb" },
  dropdownItemActive: { backgroundColor: "#2563eb" },
  dropdownText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  dropdownTextActive: { color: "#fff" },
  input: {
    marginTop: 8,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#fff"
  },
  multiline: { minHeight: 86, textAlignVertical: "top" },
  quickTitle: { marginTop: 10, color: "#111827", fontWeight: "600" },
  quickGrid: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickBtn: { backgroundColor: "#dbeafe", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  quickTxt: { color: "#1d4ed8", fontWeight: "600", fontSize: 12 },
  sendBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: "#2456e3"
  },
  sendText: { color: "#fff", fontWeight: "700" },

  emergencyRow: {
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    backgroundColor: "#fef2f2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center"
  },
  riskRow: {
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    backgroundColor: "#fef3c7",
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    flexDirection: "row",
    alignItems: "center"
  },
  alertName: { color: "#111827", fontWeight: "700" },
  alertMeta: { color: "#6b7280", marginTop: 2, fontSize: 12 },
  alertPhone: { color: "#374151", marginTop: 2, fontSize: 11 },
  statusBadge: { marginLeft: 8 },
  emptyText: { color: "#9ca3af", fontStyle: "italic", marginTop: 4 },
  distressRow: {
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    backgroundColor: "#fef2f2",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  resolveBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8
  },
  resolveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12
  },
  userMessage: {
    color: "#7f1d1d",
    marginTop: 4,
    fontSize: 12,
    fontStyle: "italic"
  },
  bcRow: { marginTop: 8, borderRadius: 10, padding: 10 },
  bcTitle: { fontWeight: "700" },
  bcMeta: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  bcMsg: { marginTop: 2, fontSize: 13 }
});
