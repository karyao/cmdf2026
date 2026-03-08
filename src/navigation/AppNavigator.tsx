import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image, StyleSheet } from "react-native";
import { RootStackParamList, RootTabParamList } from "./types";

import { EventDetailsScreen } from "../screens/EventDetailsScreen";
import { LobbyScreen } from "../screens/LobbyScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { TimelineScreen } from "../screens/TimelineScreen";
import { WrappedScreen } from "../screens/WrappedScreen";
import { theme } from "../theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const TAB_ICONS = {
  Timeline: require("../../public/navbar/timeline.png"),
  Lobby: require("../../public/navbar/lobby.png"),
  Wrapped: require("../../public/navbar/wrapped.png"),
  Profile: require("../../public/navbar/profile.png")
} as const;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: "#8a88a8",
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 14,
          height: 62,
          borderRadius: 20,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "#dfdcf8",
          backgroundColor: "#ffffff",
          paddingTop: 6,
          paddingBottom: 6,
          shadowColor: theme.colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5
        },
        tabBarItemStyle: { borderRadius: 14, marginHorizontal: 3 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
        tabBarActiveBackgroundColor: "#f5f4ff",
        tabBarIcon: ({ color }) => (
          <Image source={TAB_ICONS[route.name]} style={[styles.tabIcon, { tintColor: color }]} resizeMode="contain" />
        ),
      })}
    >
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Lobby" component={LobbyScreen} />

      <Tab.Screen name="Wrapped" component={WrappedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 18,
    height: 18
  }
});

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: "Event Details" }} />
    </Stack.Navigator>
  );
}
