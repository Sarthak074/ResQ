import React, { useState, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from './CustomAlert'; // Import the CustomAlert component

const Homescreen = ({ route }) => {
  const [post, setPost] = useState(''); // For sending posts
  const [posts, setPosts] = useState([]); // For retrieving posts
  const [activeInput, setActiveInput] = useState(null);
  const [isFetched, setIsFetched] = useState(false);
  const [showPost, setShowPost] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [onConfirm, setOnConfirm] = useState(null);

  const { username, u_id } = route.params;

  const [slideAnim] = useState(new Animated.Value(0));

  console.log('Homescreen:- ', username);
  console.log('U_id:- ', u_id);

  // Toggle add posts
  const togglePost = () => {
    if (showPost) {
      // Slide up (hide)
      Animated.timing(slideAnim, {
        toValue: 0, // Height goes back to 0
        duration: 300,
        easing: Easing.circle,
        useNativeDriver: false,
      }).start(() => setShowPost(false));
    } else {
      // Slide down (show)
      setShowPost(true);
      Animated.timing(slideAnim, {
        toValue: 230, // Adjust the value based on your design
        duration: 300,
        easing: Easing.circle,
        useNativeDriver: false,
      }).start();
    }
  };

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

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const response = await fetch(`http://10.25.7.160:3000/homePosts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        if (data.posts.length === 0) {
          console.log('No posts available for this user.');
          setPosts([]);
        } else {
          setPosts(data.posts);
        }
      }

      setIsFetched(true);
    } catch (error) {
      console.error('Error connecting to the server:', error);
      showAlert('Error', 'Unable to connect to the server. Please try again later.');
    }
  };

  useEffect(() => {
    if (!isFetched) {
      fetchPosts();
    }
  }, [isFetched]);

  // Send post
  const sendPost = async () => {
    try {
      if (!post) {
        showAlert('Error', 'Post cannot be empty!');
        return;
      }
      const res = await fetch('http://10.25.7.160:3000/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username,
          u_id: u_id,
          post: post,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showAlert('Success', 'Post submitted successfully!', () => {
          const newPost = {
            post: post,
            user_name: username,
            u_id: u_id,
          };
          setPosts((prevPosts) => [newPost, ...prevPosts]);
          setPost('');
        });
      } else {
        showAlert('Error', result.message || 'Post submission failed.');
      }
    } catch (error) {
      console.error('Error connecting to the server:', error);
      showAlert('Error', 'Unable to connect to the server. Please try again later.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.post, { height: slideAnim }]}>
        {showPost && (
          <>
            <Text style={styles.sYT}>Share Your Thoughts!!</Text>
            <TextInput
              multiline={true}
              placeholder="Enter Your Post"
              placeholderTextColor="#888"
              style={[
                styles.textinp,
                activeInput === 'post' && styles.activeInputStyle,
              ]}
              value={post}
              onChangeText={setPost}
              onFocus={() => setActiveInput('post')}
              onBlur={() => setActiveInput(null)}
            />
            <Pressable style={styles.button} onPress={sendPost}>
              <Text style={styles.buttonText}>Post</Text>
            </Pressable>
          </>
        )}
      </Animated.View>

      <View style={styles.postAdd}>
        <Pressable onPress={togglePost}>
          <Image
            style={{ width: 55, height: 55 }}
            source={require('../Images/sign.png')}
          />
        </Pressable>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.pst}>
            <View style={styles.uName}>
              <Image
                style={{ width: 50, height: 50 }}
                source={require('../Images/profile.png')}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#343A40',
                  marginTop: 10,
                }}>
                {item.user_name}
              </Text>
            </View>

            <Text style={{ textAlign: 'justify', fontSize: 15 }}>
              {item.post}
            </Text>
            <Text style={styles.line}>____________</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text
            style={{
              marginTop: 20,
              fontSize: 20,
              color: '#343A40',
              textAlign: 'center',
            }}>
            No posts available globally.
          </Text>
        )}
        ItemSeparatorComponent={<Text />}
      />

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

export default Homescreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  post: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  sYT: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  textinp: {
    width: '80%',
    borderWidth: 1,
    margin: 10,
    height: 100,
    textAlign: 'center',
    borderRadius: 8,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#007BFF',
    width: 70,
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  activeInputStyle: {
    borderColor: '#007BFF',
    borderWidth: 3,
  },
  pst: {
    width: '100%',
    paddingRight: 30,
    paddingLeft: 30,
    fontSize: 20,
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    fontWeight: '900',
    color: '#6F42C1',
    fontSize: 23,
  },
  uName: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  postAdd: {
    position: 'absolute',
    top: '75%',
    left: '58%',
    zIndex: 3,
    alignItems: 'center',
    width: '60%',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'center',
  },
});