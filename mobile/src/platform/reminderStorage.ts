import type {ReminderPreferences} from '../notifications/reminderPreferences';
export type ReminderStorage={read():Promise<string|null>;write(preferences:ReminderPreferences):Promise<void>};
async function preferenceFile() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const {File,Paths}=require('expo-file-system') as typeof import('expo-file-system');
  return new File(Paths.document,'app-daily-reminder.json');
}
export const reminderStorage:ReminderStorage={
  async read(){const file=await preferenceFile();return file.exists?file.text():null;},
  async write(preferences){const file=await preferenceFile();if(!file.exists)file.create();await file.write(JSON.stringify(preferences));},
};
