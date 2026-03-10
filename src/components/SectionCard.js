import { View, StyleSheet } from "react-native";

export default function SectionCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 12
  }
});
