import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuthUser, signOut, fetchCurrentUser, AuthUser } from '../../src/services/auth';
import { disconnectSocket } from '../../src/services/socket';
import { colors, theme } from '../../src/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getAuthUser();
      setUser(currentUser);
      
      // Fetch fresh data from server
      const freshUser = await fetchCurrentUser();
      if (freshUser) {
        setUser(freshUser);
      }
    } catch (error) {
      console.error('Load user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            disconnectSocket();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brandOrange} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin người dùng</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[colors.brandNavy, colors.brandNavyDark]}
        style={styles.header}
      >
        {user.picture ? (
          <Image source={{ uri: user.picture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </LinearGradient>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.brandNavy} />
          </View>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        <View style={[styles.infoRow, styles.infoRowLast]}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-outline" size={20} color={colors.brandNavy} />
          </View>
          <Text style={styles.infoLabel}>Họ tên</Text>
          <Text style={styles.infoValue}>{user.name}</Text>
        </View>

        <View style={[styles.infoRow, styles.infoRowLast]}>
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={20} color={colors.brandNavy} />
          </View>
          <Text style={styles.infoLabel}>Phương thức</Text>
          <Text style={styles.infoValue}>
            {user.provider === 'google' ? 'Google' : 'Email/Password'}
          </Text>
        </View>

        {user.role && (
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-outline" size={20} color={colors.brandNavy} />
            </View>
            <Text style={styles.infoLabel}>Vai trò</Text>
            <Text style={styles.infoValue}>
              {user.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
  },
  header: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.md,
    borderWidth: 4,
    borderColor: colors.textInverse,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 4,
    borderColor: colors.textInverse,
  },
  avatarText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.textInverse,
  },
  name: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: 4,
  },
  email: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textInverse,
    opacity: 0.9,
  },
  card: {
    backgroundColor: colors.surface,
    margin: theme.spacing.md,
    marginTop: -40,
    borderRadius: theme.borderRadius.md,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: theme.typography.fontSize.md,
    color: colors.textMuted,
    marginLeft: theme.spacing.md,
    width: 100,
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.error,
    ...theme.shadows.sm,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.lg,
    color: colors.error,
    fontWeight: '700',
    marginLeft: theme.spacing.sm,
  },
});

