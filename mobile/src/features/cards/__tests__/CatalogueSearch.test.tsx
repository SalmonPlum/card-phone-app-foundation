import { loadArtwork } from '../../../artwork/__tests__/helpers/nativeArtwork';
import { useLayoutEffect } from 'react';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { AppState, FlatList, Keyboard } from 'react-native';
import { advance, flushRn, resetClock, settle } from './helpers/overlayClock';
import Root from '../../../app/_layout';
import Tabs from '../../../app/(tabs)/_layout';
import Draw from '../../../app/(tabs)/index';
import Catalogue from '../../../app/(tabs)/catalogue';
import Settings from '../../../app/(tabs)/settings';
import Details from '../../../app/card/[id]';
import { useSession } from '../../../session/SessionProvider';

jest.mock('expo-router/build/testing-library/mocks',()=>({}));
jest.mock('expo-crypto',()=>({randomUUID:()=> 'search-session',getRandomValues:(array:Uint32Array)=>array.fill(0)}));
const methods=jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default;
const initialAppState=AppState.currentState;
let session:ReturnType<typeof useSession>;
function ObservedCatalogue() {
  const current=useSession();
  useLayoutEffect(()=>{session=current;},[current]);
  return <Catalogue/>;
}
const routes={_layout:Root,'(tabs)/_layout':Tabs,'(tabs)/index':Draw,'(tabs)/catalogue':ObservedCatalogue,'(tabs)/settings':Settings,'card/[id]':Details};
beforeEach(()=>{
  resetClock();AppState.currentState='active';
  methods.measureInWindow.mockImplementation((done:(x:number,y:number,w:number,h:number)=>void)=>done(0,0,360,800));
});
afterEach(()=>{AppState.currentState=initialAppState;methods.measureInWindow.mockReset();jest.restoreAllMocks();});
async function start(){await renderRouter(routes,{initialUrl:'/catalogue'});await settle();}
const input=()=>screen.getByLabelText('Search cards by name');
async function enter(id:number){
  await loadArtwork(screen.getByTestId(`overlay-face-${id}`));
  await fireEvent(screen.getByTestId('overlay-face-surface'),'layout',{nativeEvent:{layout:{width:238,height:357}}});
  await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}),'layout',{nativeEvent:{layout:{height:64}}});
  await settle();await advance(420);await flushRn();
}

test('live search/clear/no matches keep input and grid hosts while resetting filter scroll',async()=>{
  await start();const field=input(),grid=screen.getByTestId('card-grid');
  const scrollTo=jest.spyOn(FlatList.prototype,'scrollToOffset');
  await fireEvent.scroll(grid,{nativeEvent:{contentOffset:{y:900}}});scrollTo.mockClear();
  await fireEvent.changeText(field,'  OPEN   GATE  ');
  expect(screen.getByRole('button',{name:'Open Gate'})).toBeVisible();
  expect(screen.queryByRole('button',{name:'Seed'})).toBeNull();
  expect(input()).toBe(field);expect(screen.getByTestId('card-grid')).toBe(grid);
  expect(scrollTo).toHaveBeenLastCalledWith({offset:0,animated:false});
  await fireEvent.changeText(field,'no such card');
  expect(screen.getByText('No cards match your search.')).toBeVisible();
  expect(screen.getByRole('button',{name:'Clear search'})).toHaveStyle({minHeight:48,minWidth:48});
  await fireEvent.press(screen.getByRole('button',{name:'Clear search'}));
  expect(input().props.value).toBe('');expect(screen.getByRole('button',{name:'Seed'})).toBeVisible();
  expect(screen.getByTestId('card-grid')).toBe(grid);
});

test('selected-language matching and query survive tabs, theme and size changes without session reset',async()=>{
  await start();const state=session.state;
  await fireEvent.changeText(input(),'reka');
  expect(screen.getByText('No cards match your search.')).toBeVisible();
  await fireEvent.press(screen.getByRole('tab',{name:'Settings'}));await settle();
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await settle();
  await fireEvent.press(screen.getByRole('radio',{name:'Nebeská půlnoc'}));await settle();
  await fireEvent(screen.getByRole('adjustable'),'accessibilityAction',{nativeEvent:{actionName:'increment'}});await settle();
  await fireEvent.press(screen.getByRole('tab',{name:'Katalog'}));await settle();
  const field=screen.getByLabelText('Hledat karty podle názvu');
  expect(field.props.value).toBe('reka');expect(field).toHaveStyle({fontSize:14.93*1.15});
  expect(screen.getByRole('button',{name:'Řeka'})).toBeVisible();
  expect(session.state).toBe(state);
});

test('a filtered result opens and returns to the same input, card and scroll position',async()=>{
  await start();await fireEvent.changeText(input(),'seed');
  const field=input(),grid=screen.getByTestId('card-grid'),image=screen.getByTestId('card-face-0');
  await fireEvent.scroll(grid,{nativeEvent:{contentOffset:{y:80}}});
  await fireEvent.press(screen.getByRole('button',{name:'Seed'}));await enter(0);
  expect(screen.getByText('A small beginning that needs care.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button',{name:'Close'}));await settle();await advance(420);await flushRn();
  expect(input()).toBe(field);expect(field.props.value).toBe('seed');
  expect(screen.getByTestId('card-grid')).toBe(grid);expect(screen.getByTestId('card-face-0')).toBe(image);
});

test('a late query edit cancels preparation rather than opening a stale match',async()=>{
  await start();const field=input();await fireEvent.changeText(field,'seed');
  await fireEvent.press(screen.getByRole('button',{name:'Seed'}));
  expect(screen.getByTestId('overlay-face-0')).toBeTruthy();
  await fireEvent.changeText(field,'moon');await settle();
  expect(screen.queryByTestId('card-detail-overlay')).toBeNull();
  expect(screen.getByRole('button',{name:'Moon'})).toBeVisible();
});

test.each([['s','se'],['s','se','s']])('a retained tile measurement from query %j cannot open after later edits',async(...queries)=>{
  await start();const field=input();await fireEvent.changeText(field,queries[0]);
  let measured!:(x:number,y:number,w:number,h:number)=>void;
  methods.measureInWindow.mockImplementation((done:typeof measured)=>{measured=done;});
  const tile=screen.getByRole('button',{name:'Seed'});
  await fireEvent(tile,'pressIn');await fireEvent.press(tile);
  const tappedMeasurement=measured;
  for(const query of queries.slice(1))await fireEvent.changeText(field,query);
  expect(screen.getByRole('button',{name:'Seed'})).toBe(tile);
  methods.measureInWindow.mockImplementation((done:typeof measured)=>done(0,0,360,800));
  await act(()=>tappedMeasurement(16,120,158,237));await settle();
  expect(screen.queryByTestId('card-detail-overlay')).toBeNull();
  await fireEvent(tile,'pressIn');await fireEvent.press(tile);
  expect(screen.getByTestId('overlay-face-0')).toBeTruthy();
});

test('an open detail retains its full card if a late filter edit removes its tile',async()=>{
  await start();const field=input();await fireEvent.changeText(field,'seed');
  await fireEvent.press(screen.getByRole('button',{name:'Seed'}));await enter(0);
  const image=screen.getByTestId('overlay-face-0');
  await fireEvent.changeText(field,'no such card');await settle();
  expect(screen.getByTestId('overlay-face-0')).toBe(image);
  expect(screen.getByText('A small beginning that needs care.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button',{name:'Close'}));await settle();await advance(420);await flushRn();
  expect(screen.getByText('No cards match your search.')).toBeVisible();
  expect(input().props.value).toBe('no such card');
});

test('first result tap with keyboard visible waits for hide and opens after the new layout',async()=>{
  let hidden!:()=>void;
  jest.spyOn(Keyboard,'isVisible').mockReturnValue(true);
  jest.spyOn(Keyboard,'dismiss').mockImplementation(()=>{});
  const add=Keyboard.addListener.bind(Keyboard);
  jest.spyOn(Keyboard,'addListener').mockImplementation((name,callback)=>{
    if(name==='keyboardDidHide')hidden=callback as ()=>void;
    return add(name,callback);
  });
  await start();
  const frames=new Map<number,FrameRequestCallback>();let frameId=0;
  jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{frames.set(++frameId,callback);return frameId;});
  jest.spyOn(global,'cancelAnimationFrame').mockImplementation(id=>{if(id!=null)frames.delete(id);});
  await fireEvent.changeText(input(),'seed');
  await fireEvent.press(screen.getByRole('button',{name:'Seed'}));
  expect(Keyboard.dismiss).toHaveBeenCalled();expect(screen.queryByTestId('card-detail-overlay')).toBeNull();
  await fireEvent(screen.getByTestId('catalogue-host'),'layout',{nativeEvent:{layout:{x:0,y:0,width:360,height:800}}});
  await act(()=>hidden());
  for(let frame=0;frame<2;frame++) await act(()=>{const callbacks=[...frames.values()];frames.clear();for(const callback of callbacks)callback(0);});
  await settle();
  expect(screen.getByTestId('overlay-face-0')).toBeTruthy();await enter(0);
  expect(screen.getByRole('button',{name:'Close'})).toBeVisible();
});
