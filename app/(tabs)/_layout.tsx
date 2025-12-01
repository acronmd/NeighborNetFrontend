import { NotificationsProvider } from "@/app/data/notifications";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import React from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // simple colors for the tab bar
  const Colors = {
    light: { tint: "#32a852", inactive: "#888", background: "#fff" },
    dark: { tint: "#32a852", inactive: "#888", background: "#000" },
  };

  const theme = Colors[colorScheme ?? "dark"];

  return (
    <NotificationsProvider>
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.inactive,
          tabBarStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="list.bullet" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create-post"
          options={{
            title: "Post",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="plus.circle.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="user-profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
        {/* Alerts tab */}
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="bell.badge.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </NotificationsProvider>
  );
}

