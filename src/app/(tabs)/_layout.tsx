import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "#25252D",
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
        },

        tabBarActiveTintColor: "#8B5CF6",
        tabBarInactiveTintColor: "#777777",

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="musical-notes"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle"
              size={size + 4}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="people"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
  name="preset"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="create-post"
  options={{
    href: null,
  }}
/>
<Tabs.Screen
  name="notifications"
  options={{
    href: null,
  }}
/>
<Tabs.Screen
  name="edit-profile"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="practice-history"
  options={{
    href: null,
  }}
/>

    </Tabs>
  );
}