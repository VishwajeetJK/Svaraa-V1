import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Pressable, Switch } from 'react-native';
import { WebView } from 'react-native-webview';
import { GatewayBridge } from './src/bridge/GatewayBridge';
import { MockBleTransport } from './src/services/MockBleTransport';
import { OfflineQueue } from './src/services/OfflineQueue';

const WEB_URL = (globalThis as { process?: { env?: Record<string, string> } }).process?.env
    ?.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173';

export default function App() {
  const queue = useMemo(() => new OfflineQueue(), []);
  const ble = useMemo(() => new MockBleTransport(queue), [queue]);
  const bridge = useMemo(() => new GatewayBridge(ble, queue), [ble, queue]);
  const [hubMode, setHubMode] = useState(false);
  const [status, setStatus] = useState('Mock BLE idle');
  const [perms, setPerms] = useState({ bt: false, location: false, notifications: false });

  useEffect(() => {
    const unsub = ble.onStatus((s) => setStatus(s));
    return () => {
      unsub();
    };
  }, [ble]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.bar}>
        <Text style={styles.brand}>Svaraa Gateway</Text>
        <Text style={styles.meta}>{status}</Text>
        <View style={styles.row}>
          <Text style={styles.meta}>Hub mode</Text>
          <Switch value={hubMode} onValueChange={setHubMode} />
        </View>
        <View style={styles.row}>
          <Pressable
            style={styles.chip}
            onPress={async () => {
              const r = await bridge.requestPermissions();
              setPerms(r);
            }}
          >
            <Text style={styles.chipText}>Permissions</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => ble.startScan()}>
            <Text style={styles.chipText}>Scan mock</Text>
          </Pressable>
          <Pressable style={styles.chip} onPress={() => ble.connectFirst()}>
            <Text style={styles.chipText}>Bond</Text>
          </Pressable>
        </View>
        <Text style={styles.meta}>
          BT {perms.bt ? '✓' : '·'} Loc {perms.location ? '✓' : '·'} Push {perms.notifications ? '✓' : '·'} · queue{' '}
          {queue.size()}
        </Text>
      </View>
      <WebView
        source={{ uri: WEB_URL }}
        style={styles.web}
        allowsBackForwardNavigationGestures
        onMessage={(e) => bridge.handleWebMessage(e.nativeEvent.data)}
        injectedJavaScript={bridge.injectedJavaScript}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#3B1F2B' },
  bar: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  brand: { color: '#FBF8F3', fontSize: 18, fontWeight: '700' },
  meta: { color: '#DCC7CF', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#2A1620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: '#E2C98F', fontSize: 12, fontWeight: '600' },
  web: { flex: 1, backgroundColor: '#FBF8F3' },
});
