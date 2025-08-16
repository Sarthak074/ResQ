import {StyleSheet, Text, View, Image} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import Register from './src/screen/Register';
import Login from './src/screen/Login';
import Option from './src/screen/Option';
import MyTabs from './src/screen/MyTabs';
import QRScan from './src/screen/QRScan';
import MapScreen from './src/screen/MapScreen';

const Stack = createNativeStackNavigator();

const MyStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerTitleAlign: 'center',
      }}>
      <Stack.Screen name="Option" component={Option} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="QRScan" component={QRScan} />
      <Stack.Screen name="MapScreen" component={MapScreen}/>
      <Stack.Screen
        name="MyTabs"
        component={MyTabs}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <MyStack />
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({});
