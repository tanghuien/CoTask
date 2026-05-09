import * as React from 'react';
import { Button } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ViewTask from './pages/viewTask';
import Account from './pages/account';
import Home from './pages/home';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen
          name="HomeScreen"
          component={Home}
          options={({ navigation }) => ({
            title: 'CoTask',
            headerStyle: {
              backgroundColor: '#a2cffe', //Set Header color
            },
            headerTintColor: '#fff', //Set Header text color
            headerTitleStyle: {
              fontWeight: 'bold', //Set Header text style
            },
            headerShadowVisible: false,
            headerRight: () => (
              <Button                // a button in the header!     
                onPress={() => 
                navigation.navigate('Account')}
                title="Account"
                color="#fff"
              />
            ),
          })}
        />
        <Stack.Screen
          name="ViewTask"
          component={ViewTask}
          options={{
            title: 'View Task', //Set Header Title
            headerStyle: {
              backgroundColor: '#a2cffe', //Set Header color
            },
            headerTintColor: '#fff', //Set Header text color
            headerTitleStyle: {
              fontWeight: 'bold', //Set Header text style
            },
          }}
        />
        <Stack.Screen
          name="Account"
          component={Account}
          options={{
            title: 'Account', //Set Header Title
            headerStyle: {
              backgroundColor: '#a2cffe', //Set Header color
            },
            headerTintColor: '#fff', //Set Header text color
            headerTitleStyle: {
              fontWeight: 'bold', //Set Header text style
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

// Reference:
// (only edited header colour, page name and component)
// (added right button on home page)
// All codes is inspired by 
//
// 1. https://github.com/LuffyAnshul/SQLite-ReactNative/blob/master/App.js
