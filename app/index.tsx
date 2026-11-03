// Index route — this is a redirect-only screen
// The root layout's useEffect handles redirecting to login or calendar
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  // Just show a loading screen — the root layout will redirect
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1B5E20' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}