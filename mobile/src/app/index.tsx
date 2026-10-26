import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function HomeShell(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.screen} testID="home-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Karty · Cards</Text>
          <Text style={styles.subtitle}>Ukázková aplikace · Sample app</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeShell;

// The platform system font includes Czech glyphs and respects font scaling.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f6f0' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  heading: { gap: 12 },
  title: { color: '#252923', fontSize: 32, fontWeight: '600' },
  subtitle: { color: '#53594f', fontSize: 18, lineHeight: 28 },
});
