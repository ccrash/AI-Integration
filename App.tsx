import React from 'react'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import MainScreen from './screens/mainScreen'
import HistoryScreen from './screens/historyScreen'

export type RootStackParamList = {
  Main: undefined
  History: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5A67D8',
    card: '#5A67D8',
    text: '#FFFFFF',
    background: '#5A67D8',
    border: '#5A67D8'
  }
}

export default function App() {
  
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name='Main'
          component={MainScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name='History'
          component={HistoryScreen}
          options={{
            title: 'History',
            headerTintColor: '#FFFFFF',
            headerStyle: { backgroundColor: '#5A67D8' },
            headerTitleStyle: { color: '#FFFFFF' }
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
