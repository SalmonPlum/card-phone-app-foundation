import {useCallback,useEffect,useLayoutEffect,useRef,useState,type ComponentRef,type RefObject} from 'react';
import {AppState,ScrollView,type LayoutChangeEvent,type NativeScrollEvent,type NativeSyntheticEvent} from 'react-native';
import {clampDockOffset,dockOverflow,revealDockItem} from './dockScroll';

type Bounds={x:number;width:number};
type ScrollEvent=NativeSyntheticEvent<NativeScrollEvent>;

/** Native item measurements belong to one geometry generation, never an old locale/font. */
export function useDockScroll(scrollRef:RefObject<ComponentRef<typeof ScrollView>|null>,keyList:string,selected:string,geometryKey:string,blocked:boolean,reduced:boolean|null) {
  const [viewport,setViewport]=useState(0),[hints,setHints]=useState({left:false,right:false});
  const signature=JSON.stringify([geometryKey,viewport]);
  const config=useRef({keys:JSON.parse(keyList) as string[],selected,signature,blocked,reduced,viewport});
  const cache=useRef({signature:'',items:new Map<string,Bounds>()});
  const pendingTarget=useRef<number|null>(null);
  const appActive=useRef(AppState.currentState!=='background'&&AppState.currentState!=='inactive');
  const offset=useRef(0),needsReveal=useRef(true),focused=useRef<string|null>(null);
  const activity=useRef<'idle'|'drag'|'settling'|'momentum'>('idle');
  const settlingTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const cancelSettling=useCallback(()=>{if(settlingTimer.current!==null){clearTimeout(settlingTimer.current);settlingTimer.current=null;}},[]);
  useEffect(()=>cancelSettling,[cancelSettling]);

  const contentWidth=useCallback(()=>{
    const current=config.current,measurements=cache.current;
    if(current.viewport<=0||measurements.signature!==current.signature||!current.keys.every(key=>measurements.items.has(key)))return null;
    return Math.max(current.viewport,...current.keys.map(key=>{const bounds=measurements.items.get(key)!;return bounds.x+bounds.width;}));
  },[]);
  const updateHints=useCallback((content:number)=>{
    const next=dockOverflow(offset.current,config.current.viewport,content);
    setHints(previous=>previous.left===next.left&&previous.right===next.right?previous:next);
  },[]);
  const reconcile=useCallback(()=>{
    const current=config.current,content=contentWidth();
    if(content===null||current.blocked||!appActive.current||activity.current!=='idle')return;
    const bounded=clampDockOffset(offset.current,current.viewport,content);
    let target=bounded;
    const requested=needsReveal.current;
    if(needsReveal.current){
      const item=cache.current.items.get(focused.current??current.selected);
      if(!item)return;
      target=revealDockItem(bounded,current.viewport,content,item);
      needsReveal.current=false;focused.current=null;
    }
    const distance=Math.abs(target-offset.current);
    const supersedes=requested&&pendingTarget.current!==null&&Math.abs(target-pendingTarget.current)>.5;
    if(distance>.5||supersedes){
      // Even a zero-distance command must cancel an incompatible in-flight animation.
      const animated=current.reduced===false&&bounded===offset.current&&distance>.5;
      scrollRef.current?.scrollTo({x:target,y:0,animated});
      pendingTarget.current=animated?target:null;
      offset.current=target;
    }
    updateHints(content);
  },[contentWidth,updateHints,scrollRef]);

  useLayoutEffect(()=>{
    const previous=config.current;
    config.current={keys:JSON.parse(keyList) as string[],selected,signature,blocked,reduced,viewport};
    if(cache.current.signature!==signature){
      cache.current={signature,items:new Map()};
      needsReveal.current=true;focused.current=null;
      setHints(old=>old.left||old.right?{left:false,right:false}:old);
    }
    if(previous.selected!==selected){needsReveal.current=true;focused.current=null;}
    if(blocked){cancelSettling();activity.current='idle';}
    reconcile();
  },[keyList,selected,signature,blocked,reduced,viewport,reconcile,cancelSettling]);

  useEffect(()=>{
    const release=()=>{cancelSettling();activity.current='idle';pendingTarget.current=null;};
    const change=AppState.addEventListener('change',state=>{
      appActive.current=state==='active';
      if(!appActive.current){if(pendingTarget.current!==null)needsReveal.current=true;release();}
      else reconcile();
    });
    // Android notification/system overlays can cancel a drag without changing AppState.
    const blur=AppState.addEventListener('blur',release);
    return()=>{change.remove();blur.remove();};
  },[cancelSettling,reconcile]);

  function onItemLayout(key:string,event:LayoutChangeEvent){
    if(config.current.signature!==signature)return;
    const {x,width}=event.nativeEvent.layout;
    cache.current.items.set(key,{x,width});reconcile();
  }
  function onScroll(event:ScrollEvent){
    offset.current=event.nativeEvent.contentOffset.x;
    if(pendingTarget.current!==null&&Math.abs(offset.current-pendingTarget.current)<.5)pendingTarget.current=null;
    const content=contentWidth();if(content!==null)updateHints(content);
  }
  function onFocus(key:string){focused.current=key;needsReveal.current=true;reconcile();}
  return {
    viewport,signature,hints,onItemLayout,onFocus,
    onLayout:(event:LayoutChangeEvent)=>setViewport(event.nativeEvent.layout.width),
    onContentSizeChange:()=>reconcile(),
    onScroll,
    onTouchStartCapture:()=>{cancelSettling();activity.current='idle';pendingTarget.current=null;},
    onScrollBeginDrag:()=>{cancelSettling();pendingTarget.current=null;activity.current='drag';},
    onScrollEndDrag:(event:ScrollEvent)=>{
      if(event.nativeEvent.contentOffset)onScroll(event);
      cancelSettling();
      if(Math.abs(event.nativeEvent.velocity?.x??0)>.01){
        activity.current='settling';
        // A reported release velocity does not guarantee a native fling will begin.
        settlingTimer.current=setTimeout(()=>{settlingTimer.current=null;if(activity.current==='settling'){activity.current='idle';reconcile();}},100);
      } else {activity.current='idle';reconcile();}
    },
    onMomentumScrollBegin:()=>{cancelSettling();activity.current='momentum';},
    onMomentumScrollEnd:(event:ScrollEvent)=>{cancelSettling();onScroll(event);activity.current='idle';reconcile();},
    isDragging:()=>activity.current!=='idle',
  };
}
