import {StyleSheet, Text, View, Image} from 'react-native';
import React from 'react';
import Homescreen from '../screen/Homescreen';
import Community from '../screen/Community';
import Report from '../screen/Report';
import Childcommunity from '../screen/Childcommunity';
import Chatbot from '../screen/Chatbot';
import Profile from '../screen/Profile';
import Home2 from 'react-native-vector-icons/Ionicons';
import Community2 from 'react-native-vector-icons/FontAwesome6';
import Report2 from 'react-native-vector-icons/MaterialIcons';
import Childcommunity2 from 'react-native-vector-icons/FontAwesome6';
import Mentalsupport2 from 'react-native-vector-icons/FontAwesome5';
import Chatbot2 from 'react-native-vector-icons/Ionicons';
import Profile2 from 'react-native-vector-icons/FontAwesome';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const MyTabs = ({route}) => {
  console.log('MyTabs Params:- ', route.params);
  const {username} = route.params;
  const {u_id} = route.params;
  const {full_Name} = route.params;
  const {g_no} = route.params;
  console.log('Param username: ', username);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#343A40',
        headerShown: false,
        headerTitleAlign: 'center',
        tabBarStyle: {
          height: 75,
          paddingTop: 20,
        },
        tabBarShowLabel: true,
      })}>
      <Tab.Screen
        name="Home"
        component={Homescreen}
        initialParams={{username, u_id}}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={require('../Images/ResQ.png')}
                style={{width: 182, height: 93}}
              />
            </View>
          ),
          headerShown: true,
          headerBackVisible: false,
          tabBarIcon: ({color}) => (
            <Home2 name="home" size={30} color={color}  />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={Community}
        initialParams={{username, u_id}}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={require('../Images/ResQ.png')}
                style={{width: 182, height: 93}}
              />
            </View>
          ),
          headerShown: true,
          headerBackVisible: false,
          tabBarIcon: ({color}) => (
            <Community2 name="people-group" size={25} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={Report}
        initialParams={{username, u_id}}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={require('../Images/ResQ.png')}
                style={{width: 182, height: 93}}
              />
            </View>
          ),
          headerShown: true,
          headerBackVisible: false,
          tabBarIcon: ({color}) => (
            <Report2 name="report-problem" size={30} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChildSupport"
        component={Childcommunity}
        initialParams={{username, u_id, full_Name, g_no}}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={require('../Images/ResQ.png')}
                style={{width: 182, height: 93}}
              />
            </View>
          ),
          headerShown: true,
          headerBackVisible: false,
          tabBarIcon: ({color}) => (
            <Childcommunity2 name="hands-holding-child" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chatbot"
        component={Chatbot}
        initialParams={{username, u_id}}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={require('../Images/ResQ.png')}
                style={{width: 182, height: 93}}
              />
            </View>
          ),
          headerShown: true,
          headerBackVisible: false,
          tabBarIcon: ({color}) => (
            <Chatbot2 name="sparkles-sharp" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        initialParams={{username}}
        options={{
          headerTitle: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Image
                source={require('../Images/ResQ.png')}
                style={{width: 182, height: 93}}
              />
            </View>
          ),
          headerShown: true,
          headerBackVisible: false,
          tabBarIcon: ({color}) => (
            <Profile2 name="user" size={30} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MyTabs;

const styles = StyleSheet.create({});
