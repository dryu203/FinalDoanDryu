import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { login, register } from '../../src/services/auth';
import { initializeSocket } from '../../src/services/socket';
import { colors, theme } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    if (!isLogin && !name) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      
      // Initialize socket
      await initializeSocket();
      
      // Navigate to tabs - _layout will detect auth state change
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Đăng nhập thất bại');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['rgba(31,59,91,0.04)', 'rgba(245,158,11,0.04)']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              Study <Text style={styles.titleHighlight}>Tracker</Text>
            </Text>
            <Text style={styles.subtitle}>Quản lý tiến độ học tập</Text>
          </View>

          <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Họ tên"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Đăng nhập' : 'Đăng ký'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
            disabled={isLoading}
          >
            <Text style={styles.switchText}>
              {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
            </Text>
          </TouchableOpacity>

          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.3,
    color: colors.brandNavy,
    marginBottom: 8,
  },
  titleHighlight: {
    color: colors.brandOrange,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '400',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    ...theme.shadows.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    fontSize: theme.typography.fontSize.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.brandOrange,
    borderRadius: theme.borderRadius.sm,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  switchText: {
    color: colors.brandOrange,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '500',
  },
});

