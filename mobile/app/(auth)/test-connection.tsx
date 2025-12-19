import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_BASE } from '../../src/config/api';

export default function TestConnectionScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setResult('Đang test...\n');

    try {
      // Test 1: Check API_BASE
      setResult(prev => prev + `API_BASE: ${API_BASE}\n\n`);

      // Test 2: Test /api/health
      setResult(prev => prev + 'Test 1: /api/health\n');
      const healthUrl = `${API_BASE}/api/health`;
      setResult(prev => prev + `URL: ${healthUrl}\n`);

      const healthRes = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!healthRes.ok) {
        throw new Error(`HTTP ${healthRes.status}: ${healthRes.statusText}`);
      }

      const healthData = await healthRes.json();
      setResult(prev => prev + `✅ SUCCESS: ${JSON.stringify(healthData, null, 2)}\n\n`);

      // Test 3: Test with timeout
      setResult(prev => prev + 'Test 2: Connection timeout test\n');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const timeoutRes = await fetch(`${API_BASE}/api/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        setResult(prev => prev + '✅ Connection stable\n');
      } catch (timeoutError: any) {
        clearTimeout(timeoutId);
        if (timeoutError.name === 'AbortError') {
          setResult(prev => prev + '❌ Connection timeout (quá 5 giây)\n');
        } else {
          throw timeoutError;
        }
      }

      Alert.alert('Thành công', 'Kết nối với server OK!');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      setResult(prev => prev + `\n❌ ERROR: ${errorMsg}\n\n`);

      // Debug info
      setResult(prev => prev + 'Debug Info:\n');
      setResult(prev => prev + `- API_BASE: ${API_BASE}\n`);
      setResult(prev => prev + `- Error type: ${error.name || 'Unknown'}\n`);
      setResult(prev => prev + `- Error message: ${errorMsg}\n`);

      Alert.alert('Lỗi', `Không thể kết nối:\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Test Kết nối API</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>API Base URL:</Text>
          <Text style={styles.infoValue}>{API_BASE || '(chưa cấu hình)'}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Kết quả:</Text>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}

        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Gợi ý:</Text>
          <Text style={styles.tipText}>• Đảm bảo backend đang chạy</Text>
          <Text style={styles.tipText}>• Kiểm tra IP máy tính đúng chưa</Text>
          <Text style={styles.tipText}>• Máy tính và điện thoại cùng WiFi</Text>
          <Text style={styles.tipText}>• Firewall không chặn port 5000</Text>
          <Text style={styles.tipText}>• Thử mở {API_BASE}/api/health trên browser điện thoại</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f3b5b',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f3b5b',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f3b5b',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  tipsBox: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
    lineHeight: 20,
  },
});

