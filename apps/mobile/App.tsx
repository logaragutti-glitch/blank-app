import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "./lib/auth-context";
import type { ProjectSummary } from "./lib/api-types";
import { LoginScreen } from "./screens/LoginScreen";
import { ProjectListScreen } from "./screens/ProjectListScreen";
import { ProjectDetailScreen } from "./screens/ProjectDetailScreen";
import { ProjectTasksScreen } from "./screens/ProjectTasksScreen";
import { colors } from "./lib/tokens";

// No dedicated router library — only 4 screens, so a simple state machine
// (which screen + which project are we on) is enough and avoids adding a
// native-dependency-heavy navigation stack this sandbox has no way to
// exercise in a real simulator.
function AppContent() {
  const { accessToken } = useAuth();
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [showTasks, setShowTasks] = useState(false);

  if (!accessToken) return <LoginScreen />;
  if (selectedProject && showTasks) {
    return <ProjectTasksScreen project={selectedProject} onBack={() => setShowTasks(false)} />;
  }
  if (selectedProject) {
    return (
      <ProjectDetailScreen
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onOpenTasks={() => setShowTasks(true)}
      />
    );
  }
  return <ProjectListScreen onSelectProject={setSelectedProject} />;
}

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
