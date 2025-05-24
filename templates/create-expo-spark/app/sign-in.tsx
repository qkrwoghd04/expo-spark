import { router } from 'expo-router';
import { Text, View, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../ctx/useSession';

export default function SignIn() {
  const { signIn } = useSession();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
          Welcome Back! 👋
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#ccc' : '#666' }]}>
          Sign in to access your account
        </Text>
        
        <TouchableOpacity 
          style={[styles.signInButton, { backgroundColor: '#007AFF' }]}
          onPress={() => {
            signIn();
            // Navigate after signing in. You may want to tweak this to ensure sign-in is
            // successful before navigating.
            router.dismiss();
          }}
        >
          <Text style={styles.buttonText}>
            Sign In
          </Text>
        </TouchableOpacity>

        <Text style={[styles.note, { color: isDark ? '#888' : '#999' }]}>
          This is a demo sign-in. In a real app, you would implement proper authentication.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 48,
  },
  signInButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 16,
  },
});
