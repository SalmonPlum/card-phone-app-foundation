import {useLayoutEffect} from 'react';
import {act,fireEvent,render,screen} from '@testing-library/react-native';
import {AppState,ScrollView,StyleSheet} from 'react-native';
import type {BottomTabBarProps} from 'expo-router/js-tabs';
import {BottomDock} from '../BottomDock';
import {TabInteractionProvider,useTabInteraction} from '../TabInteractionContext';
let mockReduced=false,mockHistory=true;
jest.mock('../../features/cards/useReducedMotion',()=>({useReducedMotion:()=>mockReduced}));
jest.mock('../../history/HistoryProvider',()=>({useHistory:()=>({archive:{enabled:mockHistory}})}));
const names=['index','catalogue','history','info','settings'];
const navigate=jest.fn(),emit=jest.fn(()=>({defaultPrevented:false}));
function props(selected='index'):BottomTabBarProps{return {state:{key:'tabs',index:names.indexOf(selected),routeNames:names,routes:names.map(name=>({key:name,name}))},emitter:{emit},navigateToTab:navigate,insets:{top:0,right:0,bottom:0,left:0}} as unknown as BottomTabBarProps;}
function Dock({selected='index',blocked=false}:{selected?:string;blocked?:boolean}){
  const {setBlocked}=useTabInteraction();
  // Use effect-free wrapper ownership so rerender also exercises blocking changes.
  return <><Block value={blocked} set={setBlocked}/><BottomDock {...props(selected)}/></>;
}
function Block({value,set}:{value:boolean;set:(value:boolean)=>void}){useLayoutEffect(()=>set(value),[value,set]);return null;}
const wrap=(selected='index',blocked=false)=><TabInteractionProvider><Dock selected={selected} blocked={blocked}/></TabInteractionProvider>;
const labels=['Draw','Catalogue','History','About me','Settings'];
async function geometry(viewport=220,content=500){
  await fireEvent(screen.getByTestId('bottom-dock-scroll'),'layout',{nativeEvent:{layout:{width:viewport,height:68,x:0,y:0}}});
  await fireEvent(screen.getByTestId('bottom-dock-scroll'),'contentSizeChange',content,68);
  const bounds=[[0,80],[80,110],[190,90],[280,110],[390,110]];
  for(let i=0;i<labels.length;i++){
    const tab=screen.queryByRole('tab',{name:labels[i]});
    if(tab)await fireEvent(tab,'layout',{nativeEvent:{layout:{x:bounds[i][0],y:0,width:bounds[i][1],height:68}}});
  }
}
let scroll:jest.SpyInstance;
beforeEach(()=>{jest.clearAllMocks();mockHistory=true;mockReduced=false;scroll=jest.spyOn(ScrollView.prototype,'scrollTo');emit.mockReturnValue({defaultPrevented:false});});
afterEach(()=>scroll.mockRestore());
test('horizontal native dock uses single-line labels and bounded nonshrinking items',async()=>{
  await render(wrap());await geometry();
  expect(screen.getByTestId('bottom-dock-scroll').props.horizontal).toBe(true);
  for(const label of labels){expect(screen.getByText(label).props.numberOfLines).toBe(1);expect(StyleSheet.flatten(screen.getByRole('tab',{name:label}).props.style)).toMatchObject({minWidth:48,minHeight:48,flexShrink:0,maxWidth:220});}
  expect(screen.queryByTestId('dock-overflow-left',{includeHiddenElements:true})).toBeNull();expect(screen.getByTestId('dock-overflow-right',{includeHiddenElements:true})).toBeTruthy();
});
test('swiping only moves the menu, updates hints and never snaps back to selection',async()=>{
  await render(wrap());await geometry();scroll.mockClear();
  const menu=screen.getByTestId('bottom-dock-scroll');
  await fireEvent(menu,'scrollBeginDrag');await fireEvent.scroll(menu,{nativeEvent:{contentOffset:{x:140,y:0}}});await fireEvent(menu,'scrollEndDrag',{nativeEvent:{velocity:{x:0,y:0}}});
  expect(navigate).not.toHaveBeenCalled();expect(scroll).not.toHaveBeenCalled();
  expect(screen.getByTestId('dock-overflow-left',{includeHiddenElements:true})).toBeTruthy();expect(screen.getByTestId('dock-overflow-right',{includeHiddenElements:true})).toBeTruthy();
});
test('route changes reveal the selected item with minimal movement; focus reveals without navigation',async()=>{
  const view=await render(wrap());await geometry();scroll.mockClear();
  await view.rerender(wrap('settings'));
  expect(scroll).toHaveBeenLastCalledWith({x:280,y:0,animated:true});
  scroll.mockClear();await fireEvent(screen.getByRole('tab',{name:'Draw'}),'focus');
  expect(scroll).toHaveBeenLastCalledWith({x:0,y:0,animated:true});expect(navigate).not.toHaveBeenCalled();
});
test('reduced motion avoids animation; content shrink clamps offsets and clears hints',async()=>{
  mockReduced=true;const view=await render(wrap());await geometry();await view.rerender(wrap('settings'));
  expect(scroll).toHaveBeenLastCalledWith({x:280,y:0,animated:false});
  await view.rerender(wrap('index'));await geometry(600,500);
  expect(screen.queryByTestId('dock-overflow-left',{includeHiddenElements:true})).toBeNull();expect(screen.queryByTestId('dock-overflow-right',{includeHiddenElements:true})).toBeNull();
});
test('blocked overlays disable scrolling and tabs, while router prevention still works',async()=>{
  const view=await render(wrap());await geometry();
  emit.mockReturnValue({defaultPrevented:true});await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));expect(navigate).not.toHaveBeenCalled();
  emit.mockReturnValue({defaultPrevented:false});await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));expect(navigate).toHaveBeenCalledWith('settings');
  await fireEvent(screen.getByRole('tab',{name:'Catalogue'}),'longPress');expect(emit).toHaveBeenLastCalledWith({type:'tabLongPress',target:'catalogue'});
  await view.rerender(wrap('index',true));expect(screen.getByTestId('bottom-dock-scroll',{includeHiddenElements:true}).props.scrollEnabled).toBe(false);
  expect(screen.getByTestId('bottom-dock',{includeHiddenElements:true}).props.pointerEvents).toBe('none');
});
test('route changes during drag wait for momentum end, and drag presses never navigate',async()=>{
  const view=await render(wrap());await geometry();scroll.mockClear();
  let menu=screen.getByTestId('bottom-dock-scroll');await fireEvent(menu,'scrollBeginDrag');
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));expect(navigate).not.toHaveBeenCalled();
  await view.rerender(wrap('settings'));expect(scroll).not.toHaveBeenCalled();
  menu=screen.getByTestId('bottom-dock-scroll');
  await fireEvent(menu,'scrollEndDrag',{nativeEvent:{velocity:{x:1,y:0}}});expect(scroll).not.toHaveBeenCalled();
  await fireEvent(menu,'momentumScrollEnd',{nativeEvent:{contentOffset:{x:100,y:0}}});
  expect(scroll).toHaveBeenLastCalledWith({x:280,y:0,animated:true});
});
test('geometry changes discard stale layout callbacks and wait for all fresh measurements',async()=>{
  const view=await render(wrap('settings'));await geometry();
  const oldLayout=screen.getByRole('tab',{name:'Settings'}).props.onLayout;
  scroll.mockClear();
  await fireEvent(screen.getByTestId('bottom-dock-scroll'),'layout',{nativeEvent:{layout:{width:200,height:68,x:0,y:0}}});
  await oldLayout({nativeEvent:{layout:{x:999,width:999,y:0,height:68}}});
  expect(scroll).not.toHaveBeenCalled();
  await geometry(200,500);
  expect(scroll).toHaveBeenLastCalledWith({x:300,y:0,animated:true});
  // Removal invalidates every cached item. Fresh compact content clamps the old offset.
  mockHistory=false;scroll.mockClear();await view.rerender(wrap('settings'));
  const bounds=[['Draw',0,80],['Catalogue',80,110],['About me',190,110],['Settings',300,110]] as const;
  for(const [name,x,width] of bounds)await fireEvent(screen.getByRole('tab',{name}),'layout',{nativeEvent:{layout:{x,width,y:0,height:68}}});
  expect(scroll).toHaveBeenLastCalledWith({x:210,y:0,animated:false});
});
test('direct route change while blocked waits until the dock is unblocked',async()=>{
  const view=await render(wrap());await geometry();scroll.mockClear();
  await view.rerender(wrap('index',true));
  await view.rerender(wrap('settings',true));expect(scroll).not.toHaveBeenCalled();
  await view.rerender(wrap('settings',false));expect(scroll).toHaveBeenLastCalledWith({x:280,y:0,animated:true});
});
test('a drag that reports velocity without a native momentum event cannot leave tabs locked',async()=>{
  jest.useFakeTimers();
  try {
    await render(wrap());await geometry();
    await fireEvent(screen.getByTestId('bottom-dock-scroll'),'scrollBeginDrag');
    await fireEvent(screen.getByTestId('bottom-dock-scroll'),'scrollEndDrag',{nativeEvent:{velocity:{x:.1,y:0}}});
    await act(async()=>{jest.advanceTimersByTime(150);});
    await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));
    expect(navigate).toHaveBeenCalledWith('settings');
  } finally {jest.useRealTimers();}
});
test('a new route supersedes an old animated destination even when already visible midway',async()=>{
  const view=await render(wrap());await geometry();await view.rerender(wrap('settings'));
  await fireEvent.scroll(screen.getByTestId('bottom-dock-scroll'),{nativeEvent:{contentOffset:{x:40,y:0}}});scroll.mockClear();
  await view.rerender(wrap('catalogue'));
  expect(scroll).toHaveBeenLastCalledWith({x:40,y:0,animated:false});
});
test('end-drag uses the final native position before revealing a pending route',async()=>{
  const view=await render(wrap('settings'));await geometry();
  const menu=screen.getByTestId('bottom-dock-scroll');await fireEvent(menu,'scrollBeginDrag');
  await fireEvent.scroll(menu,{nativeEvent:{contentOffset:{x:0,y:0}}});await view.rerender(wrap('index'));scroll.mockClear();
  await fireEvent(screen.getByTestId('bottom-dock-scroll'),'scrollEndDrag',{nativeEvent:{contentOffset:{x:20,y:0},velocity:{x:0,y:0}}});
  expect(scroll).toHaveBeenLastCalledWith({x:0,y:0,animated:true});
});
test('an interrupted drag releases its lock on app resume and on a genuine new touch',async()=>{
  const view=await render(wrap());await geometry();
  await fireEvent(screen.getByTestId('bottom-dock-scroll'),'scrollBeginDrag');
  const change=(AppState.addEventListener as jest.Mock).mock.calls.findLast(([type]:[string])=>type==='change')![1] as (state:string)=>void;
  await act(()=>change('background'));await view.rerender(wrap('settings'));scroll.mockClear();
  await act(()=>change('active'));expect(scroll).toHaveBeenLastCalledWith({x:280,y:0,animated:true});
  await fireEvent(screen.getByTestId('bottom-dock-scroll'),'scrollBeginDrag');
  // Native ACTION_CANCEL may omit end-drag. A fresh touch can start a new tap.
  await fireEvent(screen.getByTestId('bottom-dock-scroll'),'touchStartCapture');
  await fireEvent.press(screen.getByRole('tab',{name:'Catalogue'}));expect(navigate).toHaveBeenCalledWith('catalogue');
});
