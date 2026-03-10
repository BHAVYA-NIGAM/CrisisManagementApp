import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/ScreenContainer";
import SectionCard from "../../components/SectionCard";
import { api } from "../../api/client";
import { requestCurrentLocation } from "../../utils/location";
import { useAuth } from "../../context/AuthContext";
import { useSocketEvents } from "../../context/SocketContext";

export default function SosScreen() {
  const { refreshMe } = useAuth();
  const { events } = useSocketEvents();
  const [contacts, setContacts] = useState([]);
  const [services, setServices] = useState([]);
  const [transportHistory, setTransportHistory] = useState([]);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [relationship, setRelationship] = useState("");
  const [vtTitle, setVtTitle] = useState("");
  const [vtMessage, setVtMessage] = useState("");

  const load = async () => {
    try {
      const [cRes, sRes, trRes] = await Promise.all([
        api.contacts(),
        api.emergencyServices(),
        api.myTransportRequests()
      ]);
      setContacts(cRes.contacts || []);
      setServices(sRes.services || []);
      setTransportHistory(trRes.requests || []);
    } catch (err) {
      Alert.alert("Load failed", err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const latestEvent = events[0]?.type;
    if (latestEvent === "transport_request_updated") {
      load();
    }
  }, [events]);

  const triggerUrgent = async () => {
    try {
      const loc = await requestCurrentLocation();
      await api.updateLocation(loc);
      await api.updateStatus({ status: "EMERGENCY", autoCall: true });
      await api.createSos({ mode: "URGENT_HELP", notes: "Urgent mode from SOS screen" });
      await refreshMe();
      Alert.alert("SOS sent", "Emergency contacts, buddy group, and authorities notified.");
    } catch (err) {
      Alert.alert("SOS failed", err.message);
    }
  };

  const addContact = async () => {
    try {
      await api.addContact({ name, number, relationship });
      setName("");
      setNumber("");
      setRelationship("");
      await load();
    } catch (err) {
      Alert.alert("Contact add failed", err.message);
    }
  };

  const removeContact = async (id) => {
    try {
      await api.deleteContact(id);
      await load();
    } catch (err) {
      Alert.alert("Delete failed", err.message);
    }
  };

  const call = async (num) => {
    const url = `tel:${num}`;
    const can = await Linking.canOpenURL(url);
    if (!can) return Alert.alert("Cannot call", "Calling is not supported on this device.");
    Linking.openURL(url);
  };

  const serviceQuery = (name) => {
    const label = name.toLowerCase();
    if (label.includes("police")) return "police station near me";
    if (label.includes("ambulance")) return "hospital near me";
    if (label.includes("fire")) return "fire station near me";
    if (label.includes("women")) return "women police station near me";
    if (label.includes("disaster")) return "disaster management office near me";
    return `${name} near me`;
  };

  const directions = async (serviceName) => {
    const query = encodeURIComponent(serviceQuery(serviceName));
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    await Linking.openURL(url);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SectionCard style={styles.urgentCard}>
          <View style={styles.urgentRow}>
            <Ionicons name="call-outline" size={26} color="#fff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.urgentTitle}>I Need Urgent Help</Text>
              <Text style={styles.urgentSub}>Activate panic mode • Alert all authorities</Text>
            </View>
            <TouchableOpacity style={styles.urgentBtn} onPress={triggerUrgent}>
              <Text style={styles.urgentBtnText}>Trigger</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <SectionCard style={{ backgroundColor: "#f3f4f6" }}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.formRow}>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone" value={number} onChangeText={setNumber} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Relationship" value={relationship} onChangeText={setRelationship} />
            <TouchableOpacity style={styles.addBtn} onPress={addContact}>
              <Text style={styles.addBtnText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
          {contacts.map((contact) => (
            <View key={contact._id} style={styles.contactRow}>
              <View>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactMeta}>{contact.number} • {contact.relationship || "Contact"}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.callBtn} onPress={() => call(contact.number)}>
                  <Ionicons name="call" size={15} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeContact(contact._id)}>
                  <Ionicons name="trash-outline" size={15} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard style={{ backgroundColor: "#f3f4f6" }}>
          <Text style={styles.sectionTitle}>Government Emergency Services (India)</Text>
          {services.map((service) => (
            <View key={service.number} style={styles.serviceRow}>
              <View>
                <Text style={styles.contactName}>{service.name}</Text>
                <Text style={styles.contactMeta}>{service.number}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.callBtn} onPress={() => call(service.number)}>
                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapBtn} onPress={() => directions(service.name)}>
                  <Text style={styles.callText}>Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </SectionCard>

        <SectionCard style={{ backgroundColor: "#f3f4f6" }}>
          <Text style={styles.sectionTitle}>Request Verified Transport</Text>
          <Text style={styles.helperText}>
            Ask admin to arrange verified help like ambulance, fire brigade, or police escort.
          </Text>
          <View style={styles.formRow}>
            <TextInput
              style={styles.input}
              placeholder="Title (e.g. Ambulance needed)"
              value={vtTitle}
              onChangeText={setVtTitle}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Describe what you need and where you are"
              value={vtMessage}
              onChangeText={setVtMessage}
              multiline
            />
          </View>
          <View style={styles.templateRow}>
            {[
              { title: "Ambulance needed urgently", message: "I need an ambulance immediately. Medical emergency at my location. Please send help as soon as possible." },
              { title: "Fire brigade required", message: "Fire emergency at my location. Immediate fire brigade assistance needed." },
              { title: "Police escort for safe travel", message: "Request police escort for safe travel. Feeling threatened in current area." }
            ].map((tpl) => (
              <TouchableOpacity key={tpl.title} style={styles.templateChip} onPress={() => {
                setVtTitle(tpl.title);
                setVtMessage(tpl.message);
              }}>
                <Text style={styles.templateText}>{tpl.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={async () => {
              try {
                await api.createTransportRequest({ title: vtTitle, message: vtMessage });
                setVtTitle("");
                setVtMessage("");
                await load();
                Alert.alert("Request sent", "Admin has received your verified transport request.");
              } catch (err) {
                Alert.alert("Request failed", err.message);
              }
            }}
            disabled={!vtTitle.trim() || !vtMessage.trim()}
          >
            <Text style={styles.addBtnText}>Send Request</Text>
          </TouchableOpacity>
        </SectionCard>

        {transportHistory.length > 0 && (
          <SectionCard style={{ backgroundColor: "#f9fafb", marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Transport Request History (24 hours)</Text>
            <Text style={styles.helperText}>Your recent verified transport requests</Text>
            {transportHistory.map((req) => (
              <View key={req._id} style={[
                styles.historyItem,
                req.status === "ACCEPTED" ? styles.acceptedItem : 
                req.status === "DECLINED" ? styles.declinedItem : styles.pendingItem
              ]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>{req.title}</Text>
                    <View style={[
                      styles.statusBadge,
                      req.status === "ACCEPTED" ? styles.acceptedBadge :
                      req.status === "DECLINED" ? styles.declinedBadge : styles.pendingBadge
                    ]}>
                      <Text style={styles.statusText}>{req.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.historyMessage}>{req.message}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(req.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </SectionCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: 10, paddingBottom: 24 },
  urgentCard: { backgroundColor: "#f5001a" },
  urgentRow: { flexDirection: "row", alignItems: "center" },
  urgentTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  urgentSub: { color: "#ffe4e6", marginTop: 2 },
  urgentBtn: { backgroundColor: "rgba(255,255,255,0.28)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  urgentBtnText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#111827", marginBottom: 8 },
  formRow: { gap: 8, marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  addBtn: { backgroundColor: "#2456e3", borderRadius: 8, alignItems: "center", paddingVertical: 10 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  contactRow: {
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  serviceRow: {
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  contactName: { color: "#111827", fontWeight: "600", fontSize: 15 },
  contactMeta: { color: "#6b7280", fontSize: 12, marginTop: 1 },
  contactActions: { flexDirection: "row" },
  callBtn: {
    width: 34,
    height: 34,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16a34a",
    marginLeft: 6
  },
  mapBtn: {
    width: 40,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2456e3",
    marginLeft: 6
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    marginLeft: 6
  },
  callText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  helperText: { color: "#4b5563", fontSize: 12, marginBottom: 6 },
  templateRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  templateChip: {
    backgroundColor: "#e5e7eb",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  templateText: { fontSize: 12, fontWeight: "500", color: "#111827" },
  historyItem: {
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 4
  },
  acceptedItem: {
    backgroundColor: "#f0fdf4",
    borderLeftColor: "#16a34a"
  },
  declinedItem: {
    backgroundColor: "#fef2f2",
    borderLeftColor: "#dc2626"
  },
  pendingItem: {
    backgroundColor: "#fef3c7",
    borderLeftColor: "#f59e0b"
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  historyTitle: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 14,
    flex: 1,
    marginRight: 8
  },
  historyMessage: {
    color: "#374151",
    fontSize: 12,
    marginTop: 2
  },
  historyTime: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999
  },
  acceptedBadge: {
    backgroundColor: "#dcfce7"
  },
  declinedBadge: {
    backgroundColor: "#fee2e2"
  },
  pendingBadge: {
    backgroundColor: "#fef3c7"
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase"
  }
});
