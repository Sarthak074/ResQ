import {useState} from 'react';
import {StyleSheet, Text, View, Image, Pressable, FlatList} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Profile = ({navigation, route}) => {
  console.log('Profile:-', route.params);
  const {username} = route.params;
  console.log(username);

  const [posts, setPosts] = useState([]);
  const [isFetched, setIsFetched] = useState(false);

  //Getting post
  const fetchPosts = async () => {
    try {
      console.log('Sending Username:- ', username);
      const response = await fetch(
        `http://10.25.7.160:3000/posts?username=${username}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
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
      Alert.alert(
        'Error',
        'Unable to connect to the server. Please try again later.',
      );
    }
  };

  if (!isFetched) {
    fetchPosts();
  }

  
  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={styles.logout}
        onPress={() => {
          navigation.navigate('Login');
        }}>
        <Image
          source={require('../Images/log-out.png')}
          style={styles.logOut}
        />
      </Pressable>
      <Image source={require('../Images/profile.png')} style={styles.profile} />
      <Text style={styles.user}>{username}</Text>
      <Text style={styles.post}>Posts</Text>
      <FlatList
        data={posts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
          <View style={styles.pst}>
            <Text style={{textAlign: 'justify', fontSize: 15}}>
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
            No posts available for this user.
          </Text>
        )}
        contentContainerStyle={{}}
        ItemSeparatorComponent={<Text />}
      />
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  logOut: {
    width: 30,
    height: 30,
    marginTop: 30,
    marginRight: 20,
  },
  logout: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  profile: {
    width: 121,
    height: 121,
  },
  user: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#343A40',
  },
  post: {
    backgroundColor: '#007BFF',
    width: '100%',
    textAlign: 'center',
    marginTop: 20,
    padding: 12,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
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
});
