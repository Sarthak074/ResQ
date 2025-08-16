import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleGenerativeAI } from '@google/generative-ai';
import CustomAlert from './CustomAlert'; // Import the CustomAlert component

const apiKey = '';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction:
    '1. Where is the profile? "To check out your profile, just tap on the profile icon on the right side of the bottom tab bar. You’ll find it there. Easy!"\n\n2. How do I report an issue? "Reporting an issue is pretty straightforward. Tap on the \'Report Issue\' button, which is the third option on the bottom bar. After that, you can update or even delete your report later, no problem!"\n\n3. How to chat in the community? "To chat with people in the community, go to the \'Community\' tab (it\'s the second one in the app). Once you\'re in, you can start typing away in the chat box! If you ever find yourself in an emergency, don\'t forget you can also send an SOS to alert others in the community."\n\n4. How can I join a community? "You’ll be automatically added to a community based on where you’re located. It’s that simple—no need to search for anything!"\n\n5. What is the SOS feature? "The SOS feature is a lifesaver—it lets you send out an emergency alert to community members and moderators whenever you’re in urgent need of help. Super handy when\'re in a tight spot."\n\n6. What is the purpose of badges? "Badges are like rewards you earn for doing helpful things in the community, like assisting others or reporting issues. They’re great for building trust, so people know they can count on you!"\n\n7. How to post in the app? "Posting is easy! Head over to the \'Home\' section, and you’ll see a \'Create Post\' button. Tap that, write your content (whether it’s an update, question, or opinion), and hit \'Post.\' Your thoughts will be shared with the community in no time."\n\n8. How to use the child support in the app?"In the 4th option of the app, you’ll find features to keep an eye on your child’s safety. You can use the Notify feature to instantly share your child’s location with their guardians. The Assistance option allows the child to request immediate help from their guardians. The High Alert feature sends an emergency message, along with the child’s location, to the guardians. You can also pair the app with wearable devices using the Pair with Wearables feature for real-time tracking and updates."\n\n9. How to use the mental health specialist feature or how to contact them? "If you\'re looking for support, you can easily reach out to a mental health specialist from the 5th option in the app. Based on where you are, it’ll show you available experts in your area. You can book appointment by clicking on book appointment button."\n\n10. Out-of-context questions "Hey, please ask me about the app! I’m happy to help with anything related to the features or functionality. Just ask me about the profile, reporting issues, community chat, or any of the other things in the app, and I’ll guide you through!"\n\n\n',
});

const Chatbot = () => {
  const [activeInput, setActiveInput] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  // Show custom alert
  const showAlert = (title, message, confirmCallback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setOnConfirm(() => confirmCallback);
    setAlertVisible(true);
  };

  // Hide custom alert
  const hideAlert = () => {
    setAlertVisible(false);
  };

  const sendMessage = async () => {
    if (!message) {
      showAlert('Error', 'Question cannot be empty!');
      return;
    }

    const userMessage = {
      text: message,
      isUser: true,
    };

    setMessages((prevMessages) => [userMessage, ...prevMessages]);

    setMessage('');

    try {
      const result = await model.generateContent(message);

      const responseText = result.response.text();
      const botMessage = {
        text: responseText,
        isUser: false,
      };

      setMessages((prevMessages) => [botMessage, ...prevMessages]);
    } catch (error) {
      console.error('Error generating response:', error);
      showAlert('Error', 'Unable to get response from bot. Please try again.');
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
      ]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        inverted
      />
      <View style={styles.inpBox}>
        <TextInput
          placeholder="Ask Question here!"
          style={[
            styles.textInput,
            activeInput === 'username' && styles.activeInputStyle,
          ]}
          placeholderTextColor="#888"
          onFocus={() => setActiveInput('username')}
          onBlur={() => setActiveInput(null)}
          value={message}
          onChangeText={setMessage}
        />
        <Pressable style={styles.sendBut} onPress={sendMessage}>
          <Image
            source={require('../Images/send.png')}
            style={{ width: 20, height: 20 }}
          />
        </Pressable>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={hideAlert}
        onConfirm={onConfirm}
      />
    </SafeAreaView>
  );
};

export default Chatbot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'flex-end',
  },
  inpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  textInput: {
    width: '70%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginLeft: 15,
  },
  activeInputStyle: {
    borderColor: '#007BFF',
    borderWidth: 3,
  },
  sendBut: {
    backgroundColor: '#007BFF',
    width: '20%',
    height: '50',
    marginRight: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  messageContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#80ccff',
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  botMessage: {
    backgroundColor: '#E5E5E5',
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
});