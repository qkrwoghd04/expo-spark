import { router } from 'expo-router';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/modules/auth/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import Button from '@/components/Button';
import { useAlert } from '@/hooks/useAlert';

export default function SignIn() {
  const { login, signUp, isLoading, error, clearError } = useAuthStore();
  const { isDark } = useTheme();
  const { showSuccessAlert, showErrorAlert } = useAlert();

  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
  });

  // 에러가 변경되면 Alert로 표시
  useEffect(() => {
    if (error) {
      showErrorAlert(error, clearError);
    }
  }, [error, clearError, showErrorAlert]);

  const handleAuth = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      showErrorAlert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    if (isSignUp && !form.name.trim()) {
      showErrorAlert('이름을 입력해주세요.');
      return;
    }

    try {
      if (isSignUp) {
        await signUp({
          email: form.email.trim(),
          password: form.password.trim(),
          name: form.name.trim(),
        });
        showSuccessAlert('회원가입이 완료되었습니다!', () => router.dismiss());
      } else {
        await login({
          email: form.email.trim(),
          password: form.password.trim(),
        });
        router.replace('/(app)');
      }
    } catch (error) {
      console.error('인증 오류:', error);
      showErrorAlert('인증 중 오류가 발생했습니다.');
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setForm({
      email: '',
      password: '',
      name: '',
    });
    clearError(); // 모드 변경 시 에러 클리어
  };

  const isFormValid =
    form.email.trim() &&
    form.password.trim() &&
    (!isSignUp || form.name.trim());

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
              {isSignUp ? '회원가입' : '로그인'} 👋
            </Text>
            <Text
              style={[styles.subtitle, { color: isDark ? '#ccc' : '#666' }]}
            >
              {isSignUp ? '새 계정을 만들어주세요' : '계정에 로그인하세요'}
            </Text>

            <View style={styles.formContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#333' : '#ddd',
                  },
                ]}
                placeholder="이메일"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />

              {isSignUp && (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? '#333' : '#ddd',
                    },
                  ]}
                  placeholder="이름"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={form.name}
                  onChangeText={(text) => setForm({ ...form, name: text })}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              )}

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                    color: isDark ? '#fff' : '#000',
                    borderColor: isDark ? '#333' : '#ddd',
                  },
                ]}
                placeholder="비밀번호"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />

              <Button
                title={
                  isLoading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'
                }
                onPress={handleAuth}
                disabled={!isFormValid || isLoading}
              />

              <Pressable
                style={styles.toggleButton}
                onPress={toggleMode}
                disabled={isLoading}
              >
                <Text style={[styles.toggleText, { color: '#007AFF' }]}>
                  {isSignUp
                    ? '이미 계정이 있으신가요? 로그인'
                    : '계정이 없으신가요? 회원가입'}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.note, { color: isDark ? '#888' : '#999' }]}>
              이것은 데모 인증입니다. 실제 앱에서는 적절한 보안 인증을
              구현하세요.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
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
  formContainer: {
    marginBottom: 32,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
