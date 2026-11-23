import type {Locale} from '../domain/contracts';
import type {ReminderStorage} from '../platform/reminderStorage';
import type {ReminderScheduler} from '../platform/localNotifications';
import {defaultReminder,parseReminderPreferences,validReminderTime,type ReminderPreferences} from './reminderPreferences';
export type ReminderSnapshot={
  preferences:ReminderPreferences;ready:boolean;active:boolean;busy:boolean;
  error:null|'storage'|'update'|'unavailable';permissionDenied:boolean;canAskAgain:boolean;
};

/** All native changes and writes are serialized; only the newest intent publishes. */
export class ReminderController {
  private snapshot:ReminderSnapshot={preferences:defaultReminder(),ready:false,active:false,busy:false,error:null,permissionDenied:false,canAskAgain:true};
  private listeners=new Set<()=>void>();
  private revision=0;
  private choices=0;
  private loaded=false;
  private permissionRequest:number|null=null;
  private startup?:Promise<void>;
  private queue:Promise<void>=Promise.resolve();
  constructor(private storage:ReminderStorage,private gateway:ReminderScheduler,private locale:Locale){}
  getSnapshot=()=>this.snapshot;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private patch(value:Partial<ReminderSnapshot>){this.snapshot={...this.snapshot,...value};this.listeners.forEach(listener=>listener());}
  start=():Promise<void>=>{
    if(this.loaded)return Promise.resolve();
    if(this.startup)return this.startup;
    const choices=this.choices;
    this.startup=(async()=>{
      try {
        const raw=await this.storage.read();
        if(this.choices!==choices)return;
        this.loaded=true;this.patch({preferences:parseReminderPreferences(raw),ready:true});
        await this.reconcile();
      } catch {
        if(this.choices===choices)this.patch({ready:true,error:'storage',busy:false});
      } finally {this.startup=undefined;}
    })();
    return this.startup;
  };
  setEnabled=(enabled:boolean):Promise<void>=>{
    if(typeof enabled!=='boolean')return Promise.resolve();
    this.choices++;this.loaded=true;
    this.permissionRequest=enabled?this.choices:null;
    this.patch({preferences:{...this.snapshot.preferences,enabled},ready:true});
    return this.reconcile();
  };
  setTime=(hour:number,minute:number):Promise<void>=>{
    if(!validReminderTime(hour,minute))return Promise.resolve();
    this.choices++;this.loaded=true;
    this.patch({preferences:{...this.snapshot.preferences,hour,minute},ready:true});
    return this.reconcile();
  };
  setLocale=(locale:Locale):Promise<void>=>{
    if(this.locale===locale)return Promise.resolve();
    this.locale=locale;return this.loaded?this.reconcile():Promise.resolve();
  };
  refresh=():Promise<void>=>this.snapshot.busy?this.queue:this.loaded?this.reconcile():Promise.resolve();
  retry=():Promise<void>=>this.loaded?this.reconcile():this.start();
  private reconcile():Promise<void> {
    const version=++this.revision,locale=this.locale;
    let preferences={...this.snapshot.preferences};
    this.patch({busy:true,error:null});
    const current=()=>this.revision===version;
    const operation=this.queue.catch(()=>{}).then(async()=>{
      if(!current())return;
      try {
        let denied=false,canAskAgain=true;
        if(preferences.enabled){
          // Carry explicit authorization across coalesced time/language updates.
          const request=this.permissionRequest;
          const permission=await (request!==null?this.gateway.requestPermission():this.gateway.getPermission());
          if(request!==null&&this.permissionRequest===request)this.permissionRequest=null;
          if(!current())return;
          denied=!permission.granted;canAskAgain=permission.canAskAgain;
          if(denied)preferences={...preferences,enabled:false};
        }
        await this.gateway.cancelOwned();
        if(!current())return;
        this.patch({active:false,permissionDenied:denied,canAskAgain,preferences});
        if(preferences.enabled){
          await this.gateway.schedule({hour:preferences.hour,minute:preferences.minute},locale);
          if(!current())return;
          this.patch({active:true});
        }
        try {await this.storage.write(preferences);} catch {if(current())this.patch({error:'storage'});}
      } catch(error) {
        if(current())this.patch({error:typeof error==='object'&&error!==null&&'code' in error&&error.code==='notifications-unavailable'?'unavailable':'update'});
      } finally {if(current())this.patch({busy:false});}
    });
    this.queue=operation;
    return operation;
  }
}
