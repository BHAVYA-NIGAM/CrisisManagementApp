import "react-native-gesture-handler";
import React, { useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import { ChatBotButton } from "./src/components/ChatBotButton";
import { ChatModal } from "./src/components/ChatModal";
import RoleSelectScreen from "./src/screens/auth/RoleSelectScreen";
import UserAuthScreen from "./src/screens/auth/UserAuthScreen";
import AdminLoginScreen from "./src/screens/auth/AdminLoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import HomeScreen from "./src/screens/app/HomeScreen";
import MapScreen from "./src/screens/app/MapScreen";
import SosScreen from "./src/screens/app/SosScreen";
import AdminScreen from "./src/screens/app/AdminScreen";
import AdminHomeScreen from "./src/screens/app/AdminHomeScreen";
import AdminUsersMapScreen from "./src/screens/app/AdminUsersMapScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: "home-outline",
  Map: "map-outline",
  SOS: "alert-circle-outline",
  Admin: "people-outline"
};

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="UserAuth" component={UserAuthScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="AdminAuth" component={AdminLoginScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { isAdmin } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2456e3",
        tabBarInactiveTintColor: "#475569",
        tabBarStyle: {
          height: 66,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: "#d1d5db"
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={tabIcons[route.name]} color={color} size={size + (route.name === "SOS" ? 2 : 0)} />
        )
      })}
    >
      <Tab.Screen name="Home" component={isAdmin ? AdminHomeScreen : HomeScreen} />
      <Tab.Screen name="Map" component={isAdmin ? AdminUsersMapScreen : MapScreen} />
      {!isAdmin ? <Tab.Screen name="SOS" component={SosScreen} /> : null}
      {isAdmin ? <Tab.Screen name="Admin" component={AdminScreen} /> : null}
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading, isAdmin } = useAuth();
  const [chatVisible, setChatVisible] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2456e3" />
      </View>
    );
  }

  if (!user) return <AuthStack />;

  return (
    <SocketProvider>
      <View style={{ flex: 1 }}>
        <MainTabs />
        {!isAdmin && (
          <>
            <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
            <ChatBotButton onPress={() => setChatVisible(true)} />
          </>
        )}
      </View>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Root />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f3f5"
  }
});
