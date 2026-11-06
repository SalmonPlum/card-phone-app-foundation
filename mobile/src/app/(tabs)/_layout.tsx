import { Tabs } from 'expo-router';
import { BottomDock } from '../../navigation/BottomDock';
import { TabInteractionProvider } from '../../navigation/TabInteractionContext';

export const unstable_settings = { initialRouteName: 'index' };

export default function TabLayout() {
  return <TabInteractionProvider>
    <Tabs backBehavior="initialRoute" tabBar={props => <BottomDock {...props} />}
      screenOptions={{ headerShown: false, animation: 'none', freezeOnBlur: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="catalogue" />
      <Tabs.Screen name="settings" />
    </Tabs>
  </TabInteractionProvider>;
}
