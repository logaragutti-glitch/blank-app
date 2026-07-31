import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EVE OS</Text>
      <Text>Mobile app scaffold — Sprint 0.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0D12",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    color: "#F5F6F8",
    fontSize: 24,
    fontWeight: "700",
  },
});
