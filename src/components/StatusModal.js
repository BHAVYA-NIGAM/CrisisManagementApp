import { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StatusModal({ visible, status, onClose, onSubmit }) {
  const [userMessage, setUserMessage] = useState("");

  const handleSubmit = () => {
    onSubmit(userMessage);
    setUserMessage("");
  };

  const statusInfo = {
    EMERGENCY: {
      title: "Emergency - I Need Help",
      icon: "warning",
      color: "#dc2626",
      bg: "#fef2f2",
      description: "You are reporting an emergency situation. Emergency contacts, nearby safety circle members, and authorities will be notified."
    },
    POSSIBLE_RISK: {
      title: "Possible Risk",
      icon: "time",
      color: "#f59e0b",
      bg: "#fef3c7",
      description: "You are indicating a possible risk situation. Safety circle members and authorities will be informed. This will auto-escalate to emergency after 5 minutes if not marked safe."
    }
  };

  const info = statusInfo[status] || statusInfo.EMERGENCY;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={[styles.header, { backgroundColor: info.bg }]}>
            <Ionicons name={info.icon} size={32} color={info.color} />
            <Text style={[styles.headerTitle, { color: info.color }]}>{info.title}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.infoLabel}>Status Information:</Text>
            <Text style={styles.infoText}>{info.description}</Text>

            <Text style={styles.messageLabel}>Describe your situation (optional):</Text>
            <TextInput
              style={styles.messageInput}
              value={userMessage}
              onChangeText={setUserMessage}
              placeholder="Provide details about your situation..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={onClose}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnConfirm, { backgroundColor: info.color }]}
                onPress={handleSubmit}
              >
                <Text style={styles.btnConfirmText}>Confirm {status === "EMERGENCY" ? "Emergency" : "Risk"}</Text>
              </TouchableOpacity>
            </View>
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
    gap: 10
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  body: {
    padding: 20
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6
  },
  infoText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 16
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8
  },
  messageInput: {
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20
  },
  actions: {
    flexDirection: "row",
    gap: 12
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  btnCancel: {
    backgroundColor: "#e5e7eb"
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151"
  },
  btnConfirm: {
    backgroundColor: "#2563eb"
  },
  btnConfirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff"
  }
});
