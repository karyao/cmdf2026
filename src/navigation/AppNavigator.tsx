import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList, RootTabParamList } from "./types";
import { CameraScreen } from "../screens/CameraScreen";
import { EventDetailsScreen } from "../screens/EventDetailsScreen";
import { LobbyScreen } from "../screens/LobbyScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { TimelineScreen } from "../screens/TimelineScreen";
import { WrappedScreen } from "../screens/WrappedScreen";
import { theme } from "../theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
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
        headerStyle: { backgroundColor: "#fffdf7" },
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.colors.text, fontWeight: "700" }
      }}
    >
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Lobby" component={LobbyScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Wrapped" component={WrappedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: "Event Details" }} />
    </Stack.Navigator>
  );
}
