import { useEffect } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HelpOfferModal({ visible, offer, onAccept, onDecline, onClose }) {
  if (!offer || !visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Ionicons name="hand-left" size={40} color="#2563eb" />
            <Text style={styles.headerTitle}>Help Offer Received</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.offerText}>
              <Text style={styles.helperName}>{offer.helperName || "Someone"}</Text> has offered to help you.
            </Text>
            
            {offer.message && (
              <View style={styles.messageBox}>
                <Text style={styles.messageLabel}>Message:</Text>
                <Text style={styles.messageText}>"{offer.message}"</Text>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnDecline]}
                onPress={onDecline}
              >
                <Text style={styles.btnDeclineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnAccept]}
                onPress={() => onAccept(false)}
              >
                <Text style={styles.btnAcceptText}>Accept</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.acceptAndSafeBtn}
              onPress={() => onAccept(true)}
            >
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
              <Text style={styles.acceptAndSafeText}>Accept & Mark Safe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden"
  },
  header: {
    padding: 20,
    alignItems: "center",
    gap: 10,
    backgroundColor: "#eff6ff"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a8a"
  },
  body: {
    padding: 20
  },
  offerText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    textAlign: "center"
  },
  helperName: {
    fontWeight: "700",
    color: "#111827"
  },
  messageBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6"
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4
  },
  messageText: {
    fontSize: 14,
    color: "#111827",
    fontStyle: "italic"
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  btnDecline: {
    backgroundColor: "#e5e7eb"
  },
  btnDeclineText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151"
  },
  btnAccept: {
    backgroundColor: "#2563eb"
  },
  btnAcceptText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff"
  },
  acceptAndSafeBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#16a34a"
  },
  acceptAndSafeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff"
  }
});
