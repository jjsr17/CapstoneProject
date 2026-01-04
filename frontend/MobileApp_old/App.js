import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
//import DetailsScreen from './DetailsScreen';

const Stack = createNativeStackNavigator();

// Home Screen
/*function HomeScreen({ navigation }) {
  const [name, setName] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={name}
        onChangeText={text => setName(text)}
      />
        <Button
        title="Go to Details"
        onPress={() => navigation.navigate('Details', { userName: name })}
      />
    </View>
  );
}*/

// Details Screen
function DetailsScreen({ route, navigation }) {
  const { userName } = route.params ?? {};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {userName || 'Guest'}!</Text>
      <Button title="Go back" onPress={() => navigation.goBack()} />
    </View>
  );
}


// App Component
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
  <Stack.Screen 
    name="Login" 
    component={LoginScreen} 
    options={{ headerShown: false }} // optional: hide top bar
  />
  <Stack.Screen       //Sign Up Screen navigator
    name="SignUp"
    component={SignUpScreen}
    options={{ title: 'Create Account'}}
  />
  <Stack.Screen      //Details Screen navigator
    name="Details"    
    component={DetailsScreen} 
  />
</Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    width: '100%',
    padding: 10,
    marginBottom: 20,
    borderRadius: 8,
  },
});
