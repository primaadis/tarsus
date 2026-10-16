/**
 * K-Pedia Mobile - Tarif Khusus Kereta Api
 * React Native Application for Android & iOS
 * Framework: React Native with Expo & React Navigation
 */
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { 
  Home, 
  Search, 
  Train, 
  MapPin, 
  Star, 
  Settings 
} from 'lucide-react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import TrainsScreen from './src/screens/TrainsScreen';
import StationsScreen from './src/screens/StationsScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar 
          barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'} 
          backgroundColor="#0b1320" 
        />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#0f172a',
              borderTopColor: 'rgba(255, 255, 255, 0.08)',
              borderTopWidth: StyleSheet.hairlineWidth,
              height: Platform.OS === 'ios' ? 88 : 65,
              paddingBottom: Platform.OS === 'ios' ? 28 : 10,
              paddingTop: 8,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            },
            tabBarActiveTintColor: '#38bdf8',
            tabBarInactiveTintColor: '#94a3b8',
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{
              tabBarLabel: 'Beranda',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tab.Screen 
            name="Search" 
            component={SearchScreen} 
            options={{
              tabBarLabel: 'Cari Rute',
              tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
            }}
          />
          <Tab.Screen 
            name="Trains" 
            component={TrainsScreen} 
            options={{
              tabBarLabel: 'Kereta',
              tabBarIcon: ({ color, size }) => <Train color={color} size={size} />,
            }}
          />
          <Tab.Screen 
            name="Stations" 
            component={StationsScreen} 
            options={{
              tabBarLabel: 'Stasiun',
              tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
            }}
          />
          <Tab.Screen 
            name="Favorites" 
            component={FavoritesScreen} 
            options={{
              tabBarLabel: 'Favorit',
              tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
