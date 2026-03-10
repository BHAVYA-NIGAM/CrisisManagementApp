import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";
import TopStatusBar from "./TopStatusBar";

export default function ScreenContainer({ children }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <TopStatusBar />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f1f3f5" },
  content: { flex: 1 }
});
