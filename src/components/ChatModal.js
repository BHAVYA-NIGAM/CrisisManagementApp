import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { api } from "../api/client";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I am SAATHI, your crisis assistant. Ask me about safety instructions, evacuation routes, or breaking news near you."
};

export const ChatModal = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [incidentType, setIncidentType] = useState("NONE");

  const templates = (() => {
    if (incidentType === "FLOOD") {
      return [
        "Suggest safest route to leave city",
        "Nearest relief camps",
        "Flood safety measures"
      ];
    }
    if (incidentType === "WAR" || incidentType === "TERROR") {
      return [
        "Nearest safe shelter",
        "Evacuation routes",
        "Safety instructions"
      ];
    }
    return [
      "Know breaking news near me",
      "Is my area safe?",
      "Emergency contacts"
    ];
  })();

  const loadStatus = async () => {
    try {
      const res = await api.systemStatus();
      setIncidentType(res?.status?.incidentType || "NONE");
    } catch {
      setIncidentType("NONE");
    }
  };

  React.useEffect(() => {
    if (visible) {
      loadStatus();
    }
  }, [visible]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.aiChat({
        messages: [
          {
            role: "user",
            content: trimmed
          }
        ]
      });

      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: response?.content || "I could not generate a response right now."
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI chat error", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          text: "I’m having trouble connecting to the crisis AI service. Please try again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === "user";
    const label = isUser ? "You" : "Crisis Assistant";
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowRight : styles.messageRowLeft]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          {!isUser && <Text style={styles.assistantLabel}>{label}</Text>}
          <Text style={isUser ? styles.userText : styles.assistantText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>SAATHI</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.messages}
            />

            {loading && (
              <View style={styles.typingRow}>
                <ActivityIndicator size="small" color="#4B5563" />
                <Text style={styles.typingText}>Assistant is typing…</Text>
              </View>
            )}

            <View style={styles.templateRow}>
              {templates.map((tpl) => (
                <TouchableOpacity
                  key={tpl}
                  style={styles.templateChip}
                  onPress={() => {
                    setInput("");
                    if (!loading) {
                      setInput("");
                      // send template directly
                      (async () => {
                        const prev = tpl;
                        const userMessage = {
                          id: `user-${Date.now()}`,
                          role: "user",
                          text: prev
                        };
                        setMessages((p) => [...p, userMessage]);
                        setLoading(true);
                        try {
                          const response = await api.aiChat({
                            messages: [
                              {
                                role: "user",
                                content: prev
                              }
                            ]
                          });
                          const aiMessage = {
                            id: `ai-${Date.now()}`,
                            role: "assistant",
                            text: response?.content || "I could not generate a response right now."
                          };
                          setMessages((p) => [...p, aiMessage]);
                        } catch (err) {
                          console.error("AI chat error", err);
                          setMessages((p) => [
                            ...p,
                            {
                              id: `error-${Date.now()}`,
                              role: "assistant",
                              text: "I’m having trouble connecting to the crisis AI service. Please try again in a moment."
                            }
                          ]);
                        } finally {
                          setLoading(false);
                        }
                      })();
                    }
                  }}
                >
                  <Text style={styles.templateText}>{tpl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask about safety, routes, or news near you…"
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!input.trim() || loading}
              >
                {loading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.sendText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end"
  },
  modalContainer: {
    width: "100%",
    height: "80%"
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  closeText: {
    color: "#EF4444",
    fontWeight: "500"
  },
  messages: {
    paddingVertical: 8
  },
  messageRow: {
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  messageRowRight: {
    alignItems: "flex-end"
  },
  messageRowLeft: {
    alignItems: "flex-start"
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  userBubble: {
    backgroundColor: "#007AFF",
    borderTopRightRadius: 4
  },
  assistantBubble: {
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 4,
    borderColor: "#E5E7EB",
    borderWidth: StyleSheet.hairlineWidth
  },
  userText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 21
  },
  assistantText: {
    color: "#111827",
    fontSize: 15,
    lineHeight: 22
  },
  assistantLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  typingText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#6B7280"
  },
  templateRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 6
  },
  templateChip: {
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  templateText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500"
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB"
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
    marginRight: 8
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendText: {
    color: "#ffffff",
    fontWeight: "600"
  }
});

