export type ReminderPreferences = {schemaVersion: 1; enabled: boolean; hour: number; minute: number};
export const defaultReminder = (): ReminderPreferences => ({schemaVersion:1,enabled:false,hour:9,minute:0});
export function validReminderTime(hour:number,minute:number):boolean {
  return Number.isInteger(hour)&&hour>=0&&hour<=23&&Number.isInteger(minute)&&minute>=0&&minute<=59;
}
export function parseReminderPreferences(raw:string|null):ReminderPreferences {
  try {
    const value:unknown=raw===null?null:JSON.parse(raw);
    if(typeof value==='object'&&value!==null&&'schemaVersion' in value&&value.schemaVersion===1
      &&'enabled' in value&&typeof value.enabled==='boolean'&&'hour' in value&&typeof value.hour==='number'
      &&'minute' in value&&typeof value.minute==='number'&&validReminderTime(value.hour,value.minute)) {
      return {schemaVersion:1,enabled:value.enabled,hour:value.hour,minute:value.minute};
    }
  } catch { /* Invalid or future settings are safely off. */ }
  return defaultReminder();
}
