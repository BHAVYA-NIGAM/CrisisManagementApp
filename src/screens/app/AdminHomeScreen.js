import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/ScreenContainer";
import SectionCard from "../../components/SectionCard";
import ProfileHeader from "../../components/ProfileHeader";
import { api } from "../../api/client";
import { useSocketEvents } from "../../context/SocketContext";

export default function AdminHomeScreen({ navigation }) {
  const { events } = useSocketEvents();
  const [stats, setStats] = useState({
    total: 0,
    safe: 0,
    emergency: 0,
    risk: 0,
    unknown: 0,
  });
  const [status, setStatus] = useState({
    alertLevel: "SAFE",
    incidentType: "NONE",
  });
  const [city, setCity] = useState("");
  const [temperature, setTemperature] = useState("");
  const [clock, setClock] = useState("--:--");
  const [broadcasts, setBroadcasts] = useState([]);
  const [transportRequests, setTransportRequests] = useState([]);

  const load = async () => {
    try {
      const [overview, sys, bc, tr] = await Promise.all([
        api.adminOverview(),
        api.systemStatus(),
        api.broadcasts(),
        api.adminTransportRequests(),
      ]);
      setStats(overview.stats || stats);
      setStatus(sys.status || status);
      setBroadcasts(bc.broadcasts || []);
      setTransportRequests(tr.requests || []);
    } catch (err) {
      console.error("Admin home sync error:", err);
      Alert.alert("Admin home sync failed", err.message);
    }
  };

  const loadTopBarData = async () => {
    try {
      // Default to Kanpur, India coordinates for admin
      const loc = { latitude: 26.45, longitude: 80.33 };

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m&timezone=auto`;
      const weather = await fetch(weatherUrl).then((r) => r.json());
      if (typeof weather?.current?.temperature_2m === "number") {
        setTemperature(`${Math.round(weather.current.temperature_2m)}°C`);
      }

      const geo = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.latitude}&lon=${loc.longitude}`,
        { headers: { "User-Agent": "crisis-mode-app" } },
      ).then((r) => r.json());
      const resolved =
        geo?.address?.city ||
        geo?.address?.town ||
        geo?.address?.state_district ||
        geo?.address?.state;
      setCity(resolved || "Unknown City");
    } catch (err) {
      console.error("Top bar data load error:", err);
      setCity("City unavailable");
    }
  };

  useEffect(() => {
    load();
    loadTopBarData();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setClock(formatted);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const latestEvent = events[0]?.type;
    if (
      latestEvent &&
      [
        "transport_request_created",
        "transport_request_updated",
        "status_updated",
        "sos_created",
        "sos_updated",
        "alert_level_updated",
      ].includes(latestEvent)
    ) {
      load();
    }
  }, [events]);

  const setAlert = async (level) => {
    try {
      await api.setSystemStatus({ alertLevel: level });
      await load();
    } catch (err) {
      Alert.alert("Alert update failed", err.message);
    }
  };

  const cards = useMemo(
    () => [
      {
        label: "Total Users",
        value: stats.total,
        tint: "#2563eb",
        bg: "#dbeafe",
        icon: "people-outline",
        navigable: false,
      },
      {
        label: "Users Safe",
        value: stats.safe,
        tint: "#16a34a",
        bg: "#dcfce7",
        icon: "checkmark-circle-outline",
        navigable: false,
      },
      {
        label: "Emergency",
        value: stats.emergency,
        tint: "#ef4444",
        bg: "#fee2e2",
        icon: "warning-outline",
        navigable: true,
      },
      {
        label: "Possible Risk",
        value: stats.risk,
        tint: "#f59e0b",
        bg: "#fef3c7",
        icon: "time-outline",
        navigable: true,
      },
      {
        label: "Unknown Status",
        value: stats.unknown,
        tint: "#6b7280",
        bg: "#e5e7eb",
        icon: "help-circle-outline",
        navigable: false,
      },
    ],
    [stats],
  );

  const isHigh = status.alertLevel === "HIGH";

  return (
    <ScreenContainer>
      {/* <ProfileHeader /> */}
      <ScrollView contentContainerStyle={styles.content}>
        {city && temperature && (
          <SectionCard style={styles.miniTopBar}>
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={16} color="#2563eb" />
              <Text style={styles.cityText}>{city}</Text>
            </View>
            <Text style={styles.weatherText}>
              {temperature} • {clock}
            </Text>
          </SectionCard>
        )}

        <SectionCard
          style={[
            styles.alertCard,
            isHigh ? styles.alertHigh : styles.alertSafe,
          ]}
        >
          <Text style={styles.alertLabel}>Crisis Alert Level</Text>
          <Text style={styles.alertTitle}>
            {isHigh ? "HIGH ALERT" : "SAFE"}
          </Text>
          <Text style={styles.alertSub}>
            {isHigh
              ? status.incidentType && status.incidentType !== "NONE"
                ? `Global crisis mode active (${status.incidentType}).`
                : "High emergency mode active"
              : "Normal monitoring mode"}
          </Text>
          <View style={styles.alertBtnRow}>
            <TouchableOpacity
              style={[styles.alertBtn, styles.highBtn]}
              onPress={() => setAlert("HIGH")}
            >
              <Text style={styles.alertBtnText}>Set High</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.alertBtn, styles.safeBtn]}
              onPress={() => setAlert("SAFE")}
            >
              <Text style={styles.alertBtnText}>Set Safe</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {cards.map((c) => {
          const CardWrapper = c.navigable ? TouchableOpacity : View;
          return (
            <CardWrapper
              key={c.label}
              onPress={
                c.navigable ? () => navigation.navigate("Admin") : undefined
              }
              activeOpacity={c.navigable ? 0.7 : 1}
            >
              <SectionCard style={styles.statCard}>
                <View style={styles.statCardContent}>
                  <View style={[styles.icon, { backgroundColor: c.bg }]}>
                    <Ionicons name={c.icon} size={18} color={c.tint} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.value}>{c.value}</Text>
                    <Text style={styles.label}>{c.label}</Text>
                  </View>
                  {c.navigable && c.value > 0 && (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                      style={styles.chevron}
                    />
                  )}
                </View>
              </SectionCard>
            </CardWrapper>
          );
        })}

        {transportRequests.length > 0 && (
          <SectionCard style={{ marginTop: 10, backgroundColor: "#f9fafb" }}>
            <Text style={styles.transportTitle}>
              Verified Transport Requests (Latest 10)
            </Text>
            <Text style={styles.transportSubtitle}>
              All user requests from last 24 hours
            </Text>
            {transportRequests.map((req) => (
              <View
                key={req._id}
                style={[
                  styles.transportItem,
                  req.status === "ACCEPTED"
                    ? styles.acceptedRequest
                    : req.status === "DECLINED"
                      ? styles.declinedRequest
                      : styles.pendingRequest,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.transportHeader}>
                    <Text style={styles.transportHeading}>{req.title}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        req.status === "ACCEPTED"
                          ? styles.acceptedBadge
                          : req.status === "DECLINED"
                            ? styles.declinedBadge
                            : styles.pendingBadge,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>{req.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.transportMeta}>
                    {req.userId?.name || "User"} • {req.type}
                  </Text>
                  <Text style={styles.transportMsg}>{req.message}</Text>
                  <Text style={styles.transportTime}>
                    {new Date(req.createdAt).toLocaleString()}
                  </Text>
                </View>
                {req.status === "PENDING" && (
                  <View style={styles.transportActions}>
                    <TouchableOpacity
                      style={[
                        styles.transportBtn,
                        { backgroundColor: "#16a34a" },
                      ]}
                      onPress={async () => {
                        try {
                          await api.respondTransportRequest(req._id, {
                            status: "ACCEPTED",
                          });
                          await load();
                        } catch (err) {
                          Alert.alert("Update failed", err.message);
                        }
                      }}
                    >
                      <Text style={styles.transportBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.transportBtn,
                        { backgroundColor: "#dc2626" },
                      ]}
                      onPress={async () => {
                        try {
                          await api.respondTransportRequest(req._id, {
                            status: "DECLINED",
                          });
                          await load();
                        } catch (err) {
                          Alert.alert("Update failed", err.message);
                        }
                      }}
                    >
                      <Text style={styles.transportBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </SectionCard>
        )}

        <SectionCard style={{ marginTop: 10, backgroundColor: "#f3f4f6" }}>
          <Text style={styles.broadcastTitle}>Latest Broadcasts</Text>
          {broadcasts.slice(0, 5).map((b) => (
            <View key={b._id} style={styles.broadcastItem}>
              <Text style={styles.broadcastMeta}>
                {b.alertType} • {b.zone}
              </Text>
              <Text style={styles.broadcastHeading}>{b.title}</Text>
              <Text style={styles.broadcastMsg}>{b.message}</Text>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 10, paddingBottom: 24 },
  miniTopBar: {
    backgroundColor: "#eef2ff",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cityRow: { flexDirection: "row", alignItems: "center" },
  cityText: { marginLeft: 6, color: "#1e3a8a", fontWeight: "700" },
  weatherText: { color: "#1f2937", fontWeight: "600", fontSize: 12 },
  alertCard: { borderRadius: 14 },
  alertHigh: { backgroundColor: "#ef4444" },
  alertSafe: { backgroundColor: "#16a34a" },
  alertLabel: { color: "#fee2e2", fontSize: 14 },
  alertTitle: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  alertSub: { color: "#fff", marginTop: 4 },
  alertBtnRow: { flexDirection: "row", marginTop: 12 },
  alertBtn: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 9,
    marginRight: 8,
  },
  highBtn: { backgroundColor: "rgba(127,29,29,0.38)" },
  safeBtn: { backgroundColor: "rgba(6,78,59,0.38)" },
  alertBtnText: { color: "#fff", fontWeight: "700" },
  statCard: { marginTop: 10 },
  statCardContent: { flexDirection: "row", alignItems: "center" },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: { flex: 1, marginLeft: 12 },
  value: { fontSize: 28, fontWeight: "700", color: "#111827" },
  label: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  chevron: { marginLeft: 8 },
  broadcastTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  broadcastItem: {
    backgroundColor: "#fff",
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
  },
  broadcastMeta: { color: "#6b7280", fontSize: 12 },
  broadcastHeading: { color: "#111827", fontWeight: "700", marginTop: 2 },
  broadcastMsg: { color: "#374151", marginTop: 2 },
  transportTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  transportSubtitle: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  transportItem: {
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
  },
  pendingRequest: {
    backgroundColor: "#fef3c7",
    borderLeftColor: "#f59e0b",
  },
  acceptedRequest: {
    backgroundColor: "#f0fdf4",
    borderLeftColor: "#16a34a",
  },
  declinedRequest: {
    backgroundColor: "#fef2f2",
    borderLeftColor: "#dc2626",
  },
  transportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  transportHeading: {
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  transportMeta: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  transportMsg: { color: "#374151", marginTop: 2, fontSize: 12 },
  transportTime: {
    color: "#9ca3af",
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },
  transportActions: { marginLeft: 8, gap: 6 },
  transportBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  transportBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  acceptedBadge: {
    backgroundColor: "#dcfce7",
  },
  declinedBadge: {
    backgroundColor: "#fee2e2",
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#111827",
  },
});
