import {useCallback,useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {SettingsScreen} from '../../features/settings/SettingsScreen';

export default function SettingsRoute() {
  const [reminderFocusVersion,setReminderFocusVersion]=useState(0);
  // Tabs stay mounted: discard an open native picker/draft when leaving Settings.
  useFocusEffect(useCallback(()=>()=>setReminderFocusVersion(value=>value+1),[]));
  return <SettingsScreen reminderFocusVersion={reminderFocusVersion}/>;
}
