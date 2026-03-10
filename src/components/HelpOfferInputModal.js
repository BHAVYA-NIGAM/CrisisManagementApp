import { useState } from "react";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MESSAGE_TEMPLATES = [
  "I'm on my way to help you. Stay safe!",
  "I can provide shelter. Let me know if you need it.",
  "I have medical supplies. I can help.",
  "I'm nearby and ready to assist. Please respond.",
  "Stay calm, help is coming. I'll be there soon.",
];

export default function HelpOfferInputModal({ visible, userName, onClose, onSubmit }) {
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (template, index) => {
    setSelectedTemplate(index);
    setMessage(template);
  };

  const handleSubmit = () => {
    const finalMessage = message.trim() || MESSAGE_TEMPLATES[0];
    onSubmit(finalMessage);
    // Reset state
    setMessage("");
    setSelectedTemplate(null);
  };

  const handleClose = () => {
    setMessage("");
    setSelectedTemplate(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="hand-left" size={28} color="#2563eb" />
              <View>
                <Text style={styles.headerTitle}>Offer Help</Text>
                <Text style={styles.headerSubtitle}>to {userName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Choose a template or write your own message:</Text>

            <View style={styles.templatesContainer}>
              {MESSAGE_TEMPLATES.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.templateChip,
                    selectedTemplate === index && styles.templateChipSelected
                  ]}
                  onPress={() => handleTemplateSelect(template, index)}
                >
                  <Text
                    style={[
                      styles.templateText,
                      selectedTemplate === index && styles.templateTextSelected
                    ]}
                  >
                    {template}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.orText}>Or write a custom message:</Text>

            <TextInput
              style={styles.input}
              placeholder="Type your message here..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                setSelectedTemplate(null);
              }}
              textAlignVertical="top"
            />

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={handleClose}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSubmit}
                onPress={handleSubmit}
              >
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.btnSubmitText}>Send Offer</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    overflow: "hidden"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827"
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2
  },
  body: {
    padding: 16
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12
  },
  templatesContainer: {
    gap: 8,
    marginBottom: 20
  },
  templateChip: {
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb"
  },
  templateChipSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb"
  },
  templateText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18
  },
  templateTextSelected: {
    color: "#1e40af",
    fontWeight: "600"
  },
  orText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 10,
    textAlign: "center",
    fontStyle: "italic"
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#d1d5db",
    minHeight: 100,
    marginBottom: 20
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#e5e7eb"
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151"
  },
  btnSubmit: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#2563eb"
  },
  btnSubmitText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff"
  }
});
