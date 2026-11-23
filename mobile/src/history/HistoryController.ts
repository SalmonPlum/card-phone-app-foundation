import type {DeckManifest,SessionState} from '../domain/contracts';
import type {HistoryStorage} from '../platform/historyStorage';
import {emptyHistory,HISTORY_LIFETIME,parseHistoryArchive,retainedSessions,type HistoryArchive} from './archive';
export type HistorySnapshot={archive:HistoryArchive;ready:boolean;saving:boolean;error:null|'load'|'save';recordingSessionId:string|null;currentSessionId:string|null};
const copy=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
export class HistoryController {
  private snapshot:HistorySnapshot={archive:emptyHistory(),ready:false,saving:false,error:null,recordingSessionId:null,currentSessionId:null};
  private loaded=false;
  private loading?:Promise<void>;
  private queue:Promise<void>=Promise.resolve();
  private revision=0;
  private listeners=new Set<()=>void>();
  private active?:{sessionId:string;deck:DeckManifest;eligible:boolean;first?:number};
  constructor(private storage:HistoryStorage,private now:()=>number=Date.now){}
  getSnapshot=()=>this.snapshot;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private patch(value:Partial<HistorySnapshot>){this.snapshot={...this.snapshot,...value};this.listeners.forEach(listener=>listener());}
  private stopRecording(){if(this.active)this.active.eligible=false;if(this.snapshot.recordingSessionId!==null)this.patch({recordingSessionId:null});}
  load=():Promise<void>=>{
    if(this.loaded)return Promise.resolve();if(this.loading)return this.loading;
    const version=this.revision;
    this.loading=(async()=>{
      try {
        const raw=await this.storage.read();
        if(version!==this.revision||this.loaded)return;
        const archive=parseHistoryArchive(raw);
        const sessions=retainedSessions(archive.sessions,this.now());
        this.loaded=true;this.patch({archive:{...archive,sessions},ready:true,error:null});
        if(sessions.length!==archive.sessions.length)await this.persist();
      }catch{if(version===this.revision)this.patch({ready:true,error:'load'});}
      finally{this.loading=undefined;}
    })();return this.loading;
  };
  setEnabled=(enabled:boolean):Promise<void>=>{
    if(!this.loaded||typeof enabled!=='boolean')return Promise.resolve();
    if(!enabled)this.stopRecording();
    this.patch({archive:{...this.snapshot.archive,enabled}});return this.persist();
  };
  beginSession=(state:SessionState,deck:DeckManifest):void=>{
    const eligible=this.loaded&&this.snapshot.archive.enabled;
    this.active={sessionId:state.sessionId,deck:copy(deck),eligible};
    this.patch({currentSessionId:state.sessionId,recordingSessionId:eligible?state.sessionId:null});
    void this.prune();
  };
  transition=(previous:SessionState,next:SessionState,deck:DeckManifest):void=>{
    void this.prune();
    const active=this.active;
    if(!active?.eligible||!this.loaded||!this.snapshot.archive.enabled||previous.sessionId!==active.sessionId||next.sessionId!==active.sessionId||deck.id!==active.deck.id)return;
    let sessions=this.snapshot.archive.sessions;
    const index=sessions.findIndex(entry=>entry.sessionId===active.sessionId);
    if(previous.phase==='flip'&&next.phase==='reveal'&&next.selectedId!==null&&next.selectedId===previous.selectedId){
      const card=active.deck.cards.find(item=>item.id===next.selectedId);if(!card)return;
      const existing=index<0?null:sessions[index];
      if(existing?.draws.some(draw=>draw.cardId===card.id))return;
      const time=this.now();active.first??=time;
      const entry=existing??{sessionId:active.sessionId,firstRevealedAt:time,finished:false,deck:{...active.deck,cards:[]},draws:[]};
      const updated={...entry,deck:{...entry.deck,cards:[...entry.deck.cards,copy(card)]},draws:[...entry.draws,{cardId:card.id,revealedAt:time}]};
      sessions=retainedSessions([updated,...sessions.filter(item=>item.sessionId!==active.sessionId)],time);
      this.patch({archive:{...this.snapshot.archive,sessions}});
      if(!sessions.some(item=>item.sessionId===active.sessionId))this.stopRecording();
      void this.persist();
    }else if(next.phase==='results'&&previous.phase!=='results'&&index>=0){
      sessions=sessions.map((entry,i)=>i===index?{...entry,finished:true}:entry);
      this.patch({archive:{...this.snapshot.archive,sessions}});void this.persist();
    }
  };
  deleteSessions=(ids:readonly string[]):Promise<void>=>{
    if(!this.loaded)return Promise.resolve();
    if(this.active&&ids.includes(this.active.sessionId))this.stopRecording();
    this.patch({archive:{...this.snapshot.archive,sessions:this.snapshot.archive.sessions.filter(entry=>!ids.includes(entry.sessionId))}});
    return this.persist();
  };
  clear=():Promise<void>=>{
    this.loaded=true;this.stopRecording();
    this.patch({archive:{...this.snapshot.archive,sessions:[]},ready:true,error:null});return this.persist();
  };
  prune=():Promise<void>=>{
    if(!this.loaded)return Promise.resolve();
    const sessions=retainedSessions(this.snapshot.archive.sessions,this.now());
    if(this.active?.first!==undefined&&this.now()-this.active.first>=HISTORY_LIFETIME)this.stopRecording();
    if(sessions.length===this.snapshot.archive.sessions.length)return Promise.resolve();
    this.patch({archive:{...this.snapshot.archive,sessions}});return this.persist();
  };
  retry=():Promise<void>=>this.loaded?this.persist():this.load();
  private persist():Promise<void>{
    const version=++this.revision,archive=this.snapshot.archive;
    this.patch({saving:true,error:null});
    const request=this.queue.catch(()=>{}).then(async()=>{
      if(version!==this.revision)return;
      try{await this.storage.write(archive);if(version===this.revision)this.patch({error:null});}
      catch{if(version===this.revision)this.patch({error:'save'});}
      finally{if(version===this.revision)this.patch({saving:false});}
    });
    this.queue=request;return request;
  }
}
