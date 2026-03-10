import { Text, StyleSheet } from "react-native";
import SectionCard from "./SectionCard";

const severityStyle = {
  emergency: { backgroundColor: "#ef4444", color: "#fff" },
  danger: { backgroundColor: "#f97316", color: "#fff" },
  warning: { backgroundColor: "#facc15", color: "#111827" },
  info: { backgroundColor: "#60a5fa", color: "#fff" }
};

const alertTypeStyle = {
  Emergency: { backgroundColor: "#dc2626", color: "#fff" },
  Warning: { backgroundColor: "#d97706", color: "#fff" },
  Advisory: { backgroundColor: "#2563eb", color: "#fff" }
};

export default function BroadcastBanner({ alert }) {
  if (!alert) return null;
  // Prefer alertType theme, fallback to severity
  const theme = alertTypeStyle[alert.alertType] || severityStyle[alert.severity] || severityStyle.warning;
  return (
    <SectionCard style={[styles.card, { backgroundColor: theme.backgroundColor }]}> 
      <Text style={[styles.type, { color: theme.color }]}>{alert.alertType} • {alert.zone}</Text>
      <Text style={[styles.title, { color: theme.color }]}>{alert.title}</Text>
      <Text style={[styles.message, { color: theme.color }]}>{alert.message}</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 10 },
  type: { fontSize: 12, opacity: 0.92, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  message: { fontSize: 14 }
});
