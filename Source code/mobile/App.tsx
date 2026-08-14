import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5006';

export default function App() {
  const [phoneOrEmail, setPhoneOrEmail] = useState('admin@orderpum.local');
  const [password, setPassword] = useState('Admin@123');
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('App nhân viên — order hộ tại bàn');

  async function login() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setToken(data.accessToken);
      setMessage(`Xin chào ${data.displayName} (${data.role})`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Login failed');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.brand}>OrderPum Staff</Text>
      <Text style={styles.sub}>{message}</Text>
      {!token ? (
        <View style={styles.card}>
          <TextInput style={styles.input} autoCapitalize="none" value={phoneOrEmail} onChangeText={setPhoneOrEmail} placeholder="SĐT / email" />
          <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} placeholder="Mật khẩu" />
          <Pressable style={styles.btn} onPress={login}>
            <Text style={styles.btnText}>Đăng nhập</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.hint}>Tiếp theo: sơ đồ bàn → chọn bàn → order hộ (STT 21) → KDS realtime.</Text>
        </View>
      )}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f4ef', padding: 20, justifyContent: 'center' },
  brand: { fontSize: 28, fontWeight: '700', color: '#1c1917' },
  sub: { marginTop: 8, color: '#57534e', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12, borderColor: '#e7e5e4', borderWidth: 1 },
  input: { borderWidth: 1, borderColor: '#d6d3d1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  btn: { backgroundColor: '#b45309', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  hint: { color: '#44403c', lineHeight: 20 },
});
