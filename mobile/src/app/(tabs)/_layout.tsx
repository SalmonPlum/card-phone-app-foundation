import {configuredInfoPage} from '../../info';
import {useHistory} from '../../history/HistoryProvider';
import { Tabs } from 'expo-router';
import { BottomDock } from '../../navigation/BottomDock';
import { TabInteractionProvider } from '../../navigation/TabInteractionContext';

export const unstable_settings = { initialRouteName: 'index' };

export default function TabLayout() {
  const {archive}=useHistory();
  return <TabInteractionProvider>
    <Tabs backBehavior="initialRoute" tabBar={props => <BottomDock {...props} />}
      screenOptions={{ headerShown: false, animation: 'none', freezeOnBlur: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="catalogue" />
      {archive.enabled?[<Tabs.Screen key="history" name="history" />]:[]}
      {configuredInfoPage?[<Tabs.Screen key="info" name="info" />]:[]}
      <Tabs.Screen name="settings" />
    </Tabs>
  </TabInteractionProvider>;
}
