import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {

    useEffect(() => {
    NavigationBar.setVisibilityAsync("hidden");
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        translucent
        
        backgroundColor="transparent"
        
      />

      <View style={{ flex: 1, backgroundColor: "#020617" }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: "#020617",
              
            },
          }}
        />
      </View>
    </SafeAreaProvider>
  );
}