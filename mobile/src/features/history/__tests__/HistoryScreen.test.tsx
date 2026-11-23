import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import type {SessionState} from '../../../domain/contracts';
import {findEventHandler} from '@testing-library/react-native/dist/events/propagation';
import Info from '../../../app/(tabs)/info';
import {loadArtwork} from '../../../artwork/__tests__/helpers/nativeArtwork';
import {act,fireEvent,renderRouter,screen,within} from 'expo-router/testing-library';
import {router} from 'expo-router';
import {Alert,AppState,BackHandler,StyleSheet} from 'react-native';
import {useLayoutEffect} from 'react';
import {advance,flushRn,resetClock,settle} from '../../cards/__tests__/helpers/overlayClock';
import Root from '../../../app/_layout';
import Tabs from '../../../app/(tabs)/_layout';
import Draw from '../../../app/(tabs)/index';
import Catalogue from '../../../app/(tabs)/catalogue';
import Settings from '../../../app/(tabs)/settings';
import History from '../../../app/(tabs)/history';
import Details from '../../../app/card/[id]';
import {historyStorage} from '../../../platform/historyStorage';
import {sampleDeck} from '../../../decks/sample';
import {useHistory} from '../../../history/HistoryProvider';
import {useSession} from '../../../session/SessionProvider';
jest.mock('expo-router/build/testing-library/mocks',()=>({}));
let mockId=0;
jest.mock('expo-crypto',()=>({randomUUID:()=>`history-ui-${++mockId}`,getRandomValues:(values:Uint32Array)=>{values.fill(0);return values;}}));
let history:ReturnType<typeof useHistory>,session:ReturnType<typeof useSession>;
function Probe(){const h=useHistory(),s=useSession();useLayoutEffect(()=>{history=h;session=s;},[h,s]);return <Catalogue/>;}
const routes={_layout:Root,'(tabs)/info': Info, '(tabs)/_layout':Tabs,'(tabs)/index':Draw,'(tabs)/catalogue':Probe,'(tabs)/settings':Settings,'(tabs)/history':History,'card/[id]':Details};
function archive(enabled=true){const time=Date.now();return JSON.stringify({schemaVersion:1,enabled,sessions:['a','b'].map((id,index)=>({sessionId:id,firstRevealedAt:time-index*1000,finished:index===0,deck:{...sampleDeck,cards:[{...sampleDeck.cards[0],translations:{...sampleDeck.cards[0].translations,en:{...sampleDeck.cards[0].translations.en,name:'Saved seed',sections:{meaning:'Saved original meaning.',description:'Saved original description.'}}}}]},draws:[{cardId:0,revealedAt:time-index*1000}]}))});}
const nativeState=AppState.currentState;
const methods=jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default;
beforeEach(()=>{methods.measureInWindow.mockImplementation((done:(x:number,y:number,w:number,h:number)=>void)=>done(0,0,360,800));mockId=0;resetClock();AppState.currentState='active';jest.mocked(historyStorage.read).mockResolvedValue(null);});
afterEach(()=>{methods.measureInWindow.mockReset();AppState.currentState=nativeState;jest.mocked(historyStorage.read).mockResolvedValue(null);});
test('off has four tabs; enabling adds History without resetting the current session',async()=>{
  await renderRouter(routes,{initialUrl:'/catalogue'});const existing=session.state;
  expect(screen.getAllByRole('tab')).toHaveLength(4);await act(()=>router.navigate('/settings'));
  await fireEvent(screen.getByRole('switch',{name:'Save drawing history'}),'valueChange',true);
  expect(screen.getAllByRole('tab')).toHaveLength(5);expect(session.state).toBe(existing);
  await fireEvent.press(screen.getByRole('tab',{name:'History'}));expect(screen.getByText('History will start with your next session.')).toBeVisible();
});
test('archived ordered cards use saved text and do not replace the live session',async()=>{
  jest.mocked(historyStorage.read).mockResolvedValue(archive());await renderRouter(routes,{initialUrl:'/catalogue'});const existing=session.state;
  await fireEvent.press(screen.getByRole('tab',{name:'History'}));await fireEvent.press(screen.getByTestId('history-session-a'));
  expect(screen.getByRole('button',{name:'Saved seed'})).toBeVisible();expect(screen.queryByRole('button',{name:'New session'})).toBeNull();
  await fireEvent.press(screen.getByRole('button',{name:'Saved seed'}));await loadArtwork(screen.getByTestId('overlay-face-0'));
  await fireEvent(screen.getByTestId('overlay-face-surface'),'layout',{nativeEvent:{layout:{width:238,height:357}}});
  await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}),'layout',{nativeEvent:{layout:{height:64}}});await settle();await advance(420);await flushRn();
  expect(screen.getByText('Saved original meaning.')).toBeVisible();expect(session.state).toBe(existing);
  await act(()=>history.controller!.deleteSessions(['a']));
  expect(screen.getByTestId('history-session-b')).toBeVisible();expect(screen.queryByText('Saved original meaning.')).toBeNull();
  expect(screen.getByRole('tab',{name:'History'}).props.accessibilityState.disabled).toBe(false);expect(session.state).toBe(existing);
});
test('selective deletion requires confirmation and preserves other sessions',async()=>{
  jest.mocked(historyStorage.read).mockResolvedValue(archive());const alert=jest.spyOn(Alert,'alert');
  try{
    await renderRouter(routes,{initialUrl:'/catalogue'});await fireEvent.press(screen.getByRole('tab',{name:'History'}));
    await fireEvent(screen.getByTestId('history-session-a'),'longPress');
    await fireEvent.press(screen.getByRole('button',{name:'Delete selected (1)'}));expect(history.archive.sessions).toHaveLength(2);
    const buttons=alert.mock.calls.at(-1)![2]!;await act(()=>buttons.find(button=>button.style==='destructive')!.onPress!());
    expect(history.archive.sessions.map(item=>item.sessionId)).toEqual(['b']);
  }finally{alert.mockRestore();}
});
test('disabling retains stored records and Clear history can remove them while off',async()=>{
  jest.mocked(historyStorage.read).mockResolvedValue(archive());const alert=jest.spyOn(Alert,'alert');
  try{
    await renderRouter(routes,{initialUrl:'/catalogue'});await fireEvent.press(screen.getByRole('tab',{name:'History'}));await act(()=>router.navigate('/settings'));
    await fireEvent(screen.getByRole('switch',{name:'Save drawing history'}),'valueChange',false);expect(history.archive.sessions).toHaveLength(2);expect(screen.getAllByRole('tab')).toHaveLength(4);expect(screen.getByTestId('settings-screen')).toBeVisible();
    await fireEvent.press(screen.getByRole('button',{name:'Clear history'}));expect(history.archive.sessions).toHaveLength(2);
    await act(()=>alert.mock.calls.at(-1)![2]!.find(button=>button.style==='destructive')!.onPress!());expect(history.archive.sessions).toEqual([]);
  }finally{alert.mockRestore();}
});


test('disabled direct History navigation returns to Draw without exposing archived entries',async()=>{
  jest.mocked(historyStorage.read).mockResolvedValue(archive(false));await renderRouter(routes,{initialUrl:'/history'});
  expect(screen).toHavePathname('/');expect(screen.queryByRole('tab',{name:'History'})).toBeNull();expect(screen.queryByTestId('history-session-a')).toBeNull();
});
test('missing bundled images still allow reading the saved text',async()=>{
  const saved=JSON.parse(archive());saved.sessions[0].deck.cards[0].faceAsset='removed.image';
  jest.mocked(historyStorage.read).mockResolvedValue(JSON.stringify(saved));await renderRouter(routes,{initialUrl:'/catalogue'});
  await fireEvent.press(screen.getByRole('tab',{name:'History'}));await fireEvent.press(screen.getByTestId('history-session-a'));
  await fireEvent.press(screen.getByRole('button',{name:'Saved seed'}));
  await fireEvent(screen.getByTestId('overlay-face-surface'),'layout',{nativeEvent:{layout:{width:238,height:357}}});
  await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}),'layout',{nativeEvent:{layout:{height:64}}});await settle();await advance(420);await flushRn();
  expect(screen.getByText('Saved original meaning.')).toBeVisible();
});
test.each([280,320])('four tabs and Czech navigation keep dock clearance at %i dp with large text',async width=>{
  const native=jest.requireActual('react-native') as typeof import('react-native');
  const dimensions=jest.spyOn(native,'useWindowDimensions').mockReturnValue({width,height:700,scale:3,fontScale:1.6});
  try{
    jest.mocked(historyStorage.read).mockResolvedValue(archive());await renderRouter(routes,{initialUrl:'/catalogue'});
    await act(()=>router.navigate('/settings'));await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));
    const tabs=screen.getAllByRole('tab');expect(tabs.map(tab=>tab.props.accessibilityLabel)).toEqual(['Tahání','Katalog','Historie','O mně','Nastavení']);
    for(const tab of tabs)expect(tab).toHaveStyle({minHeight:48,minWidth:48});
    await fireEvent(screen.getByTestId('bottom-dock'),'layout',{nativeEvent:{layout:{width,height:180,x:0,y:520}}});
    await fireEvent.press(screen.getByRole('tab',{name:'Historie'}));
    expect(StyleSheet.flatten(screen.getByTestId('history-list').props.contentContainerStyle).paddingBottom).toBeGreaterThanOrEqual(180);
  }finally{dimensions.mockRestore();}
});
test('Android Back closes card details before returning to the history list',async()=>{
  const handlers=new Set<Parameters<typeof BackHandler.addEventListener>[1]>();const original=BackHandler.addEventListener;
  const implementation=jest.isMockFunction(original)?jest.mocked(original).getMockImplementation():undefined;
  const back=jest.spyOn(BackHandler,'addEventListener').mockImplementation((_event,handler)=>{handlers.add(handler);return {remove:()=>{handlers.delete(handler);}};});
  const press=()=>{for(const handler of [...handlers].reverse())if(handler({type:'hardwareBackPress',timeStamp:0}))break;};
  try{
    jest.mocked(historyStorage.read).mockResolvedValue(archive());await renderRouter(routes,{initialUrl:'/catalogue'});
    await fireEvent.press(screen.getByRole('tab',{name:'History'}));await fireEvent.press(screen.getByTestId('history-session-a'));
    await fireEvent.press(screen.getByRole('button',{name:'Saved seed'}));await loadArtwork(screen.getByTestId('overlay-face-0'));
    await fireEvent(screen.getByTestId('overlay-face-surface'),'layout',{nativeEvent:{layout:{width:238,height:357}}});
    await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}),'layout',{nativeEvent:{layout:{height:64}}});await settle();await advance(420);await flushRn();
    await act(press);await settle();await advance(420);await flushRn();
    expect(screen.getByTestId('history-session-host')).toBeVisible();expect(screen.queryByText('Saved original meaning.')).toBeNull();
    await act(press);expect(screen.getByTestId('history-list')).toBeVisible();
  }finally{back.mockRestore();if(implementation&&jest.isMockFunction(BackHandler.addEventListener))jest.mocked(BackHandler.addEventListener).mockImplementation(implementation);}
});

async function openHistory(){jest.mocked(historyStorage.read).mockResolvedValue(archive());await renderRouter(routes,{initialUrl:'/catalogue'});await fireEvent.press(screen.getByRole('tab',{name:'History'}));await settle();}
test('holding selects the record without opening on release, and only row colors indicate selection',async()=>{
  await openHistory();expect(screen.queryByRole('button',{name:'Select'})).toBeNull();expect(screen.queryByRole('button',{name:/Delete selected/})).toBeNull();
  const row=screen.getByTestId('history-session-a'),originalColor=StyleSheet.flatten(row.props.style).backgroundColor;
  const release=findEventHandler(row,'press',{bubbles:true}).handler!;
  await fireEvent(row,'longPress');await act(()=>{release();});
  expect(screen.queryByTestId('history-session-host')).toBeNull();
  expect(screen.getByTestId('history-session-a').props.accessibilityState.checked).toBe(true);
  expect(StyleSheet.flatten(screen.getByTestId('history-session-a').props.style).backgroundColor).not.toBe(originalColor);
  expect(screen.queryByText(/[☑☐]/)).toBeNull();expect(screen.getByText('1 selected')).toBeVisible();
  expect(within(screen.getByTestId('history-list')).queryByRole('button',{name:'Delete selected (1)'})).toBeNull();
  await fireEvent.press(screen.getByTestId('history-session-b'));expect(screen.getByText('2 selected')).toBeVisible();
  await fireEvent(screen.getByTestId('history-session-a'),'pressIn');await fireEvent.press(screen.getByTestId('history-session-a'));
  expect(screen.getByText('1 selected')).toBeVisible();
  await fireEvent.press(screen.getByRole('button',{name:'Cancel'}));expect(screen.queryByText('1 selected')).toBeNull();
  await fireEvent.press(screen.getByTestId('history-session-a'));expect(screen.getByTestId('history-session-host')).toBeVisible();
});
test('accessible selection exits when the last live selected record is removed',async()=>{
  await openHistory();await fireEvent(screen.getByTestId('history-session-a'),'accessibilityAction',{nativeEvent:{actionName:'select'}});
  expect(screen.getByTestId('history-session-a').props.accessibilityState.checked).toBe(true);
  await act(()=>history.controller!.deleteSessions(['a']));
  expect(screen.queryByTestId('history-selection-toolbar')).toBeNull();
  expect(screen.getByTestId('history-session-b').props.accessibilityRole).toBe('button');
  // A fresh archive snapshot with the same ID must not revive the canceled selection.
  const controller=history.controller!;
  const flip={...session.state!,sessionId:'a',phase:'flip',selectedId:0} as SessionState;
  await act(()=>{controller.beginSession(flip,sampleDeck);controller.transition(flip,{...flip,phase:'reveal'},sampleDeck);});
  expect(screen.getByTestId('history-session-a').props.accessibilityRole).toBe('button');
  expect(screen.queryByTestId('history-selection-toolbar')).toBeNull();
});
test('Android Back exits long-press selection without opening a reading or mutating the archive',async()=>{
  const handlers=new Set<Parameters<typeof BackHandler.addEventListener>[1]>();
  const back=jest.spyOn(BackHandler,'addEventListener').mockImplementation((_event,handler)=>{handlers.add(handler);return {remove:()=>{handlers.delete(handler);}};});
  try{
    await openHistory();await fireEvent(screen.getByTestId('history-session-a'),'longPress');
    await act(()=>{for(const handler of [...handlers].reverse())if(handler({type:'hardwareBackPress',timeStamp:0}))break;});
    expect(screen.queryByRole('button',{name:/Delete selected/})).toBeNull();expect(history.archive.sessions).toHaveLength(2);
    expect(screen.queryByTestId('history-session-host')).toBeNull();
  }finally{back.mockRestore();}
});
test('tapping saved card artwork closes only its detail and retains the reading and live session',async()=>{
  await openHistory();const existing=session.state;
  await fireEvent.press(screen.getByTestId('history-session-a'));await fireEvent.press(screen.getByRole('button',{name:'Saved seed'}));
  await loadArtwork(screen.getByTestId('overlay-face-0'));
  await fireEvent(screen.getByTestId('overlay-face-surface'),'layout',{nativeEvent:{layout:{width:238,height:358}}});
  await fireEvent(screen.getByTestId('detail-header',{includeHiddenElements:true}),'layout',{nativeEvent:{layout:{height:64}}});await settle();await advance(420);await flushRn();
  await fireEvent.press(screen.getByRole('button',{name:'Close card details'}));await settle();await advance(420);await flushRn();
  expect(screen.queryByTestId('card-detail-overlay')).toBeNull();expect(screen.getByTestId('history-session-host')).toBeVisible();
  expect(screen.getByRole('button',{name:'Saved seed'})).toBeVisible();expect(session.state).toBe(existing);
});
test('long-press release does not swallow a later independent accessible activation',async()=>{
  await openHistory();const row=screen.getByTestId('history-session-a');await fireEvent(row,'longPress');
  await fireEvent(screen.getByTestId('history-session-a'),'pressOut');
  await act(async()=>{await Promise.resolve();});
  await fireEvent.press(screen.getByTestId('history-session-a'));
  expect(screen.queryByTestId('history-selection-toolbar')).toBeNull();
});
test('selected History text uses contrasting theme selection ink',async()=>{
  await openHistory();await act(()=>router.navigate('/settings'));await fireEvent.press(screen.getByRole('radio',{name:'Celestial Midnight'}));
  await fireEvent.press(screen.getByRole('tab',{name:'History'}));await fireEvent(screen.getByTestId('history-session-a'),'longPress');
  const row=screen.getByTestId('history-session-a');
  expect(within(row).getByText('Cards drawn: 1')).toHaveStyle({color:'#2a1700'});
});

test('top floating selection keeps the header and list stable, and deselecting the final record cancels',async()=>{
  await openHistory();const list=screen.getByTestId('history-list');
  await fireEvent.scroll(list,{nativeEvent:{contentOffset:{x:0,y:120}}});
  const before=StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom;
  const header=screen.getByTestId('history-list-header');
  const beforeHeader=StyleSheet.flatten(header.props.style).minHeight;
  await fireEvent(screen.getByTestId('history-session-a'),'longPress');
  const toolbar=screen.getByTestId('history-selection-toolbar');
  expect(StyleSheet.flatten(toolbar.props.style)).toMatchObject({position:'absolute'});
  expect(screen.getByTestId('history-list')).toBe(list);
  expect(StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom).toBe(before);
  expect(StyleSheet.flatten(header.props.style).minHeight).toBe(beforeHeader);
  await fireEvent(toolbar,'layout',{nativeEvent:{layout:{x:0,y:400,width:240,height:90}}});
  const measured=StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom;
  expect(measured).toBe(before);
  expect(StyleSheet.flatten(header.props.style).minHeight).toBeGreaterThanOrEqual(90+8);
  await fireEvent(screen.getByTestId('history-session-a'),'pressIn');await fireEvent.press(screen.getByTestId('history-session-a'));
  expect(screen.queryByTestId('history-selection-toolbar')).toBeNull();
  expect(screen.getByTestId('history-list')).toBe(list);
  expect(StyleSheet.flatten(list.props.contentContainerStyle).paddingBottom).toBe(measured);
  expect(StyleSheet.flatten(header.props.style).minHeight).toBeGreaterThanOrEqual(90+8);
  expect(screen.queryByText('0 selected')).toBeNull();
});
test('History list and compact reading header omit deck and status, retaining only date/count and an icon return',async()=>{
  await openHistory();const deckName=history.archive.sessions[0].deck.name.en;
  expect(screen.queryByText(deckName)).toBeNull();expect(screen.queryByText(/Finished|Partial|In progress/)).toBeNull();
  expect(screen.getByTestId('history-session-a').props.accessibilityLabel).not.toContain(deckName);
  await fireEvent.press(screen.getByTestId('history-session-a'));
  expect(screen.queryByText(deckName)).toBeNull();expect(screen.queryByText(/Finished|Partial|In progress/)).toBeNull();
  const back=screen.getByRole('button',{name:'Back to history'});
  expect(within(back).queryByText('Back to history')).toBeNull();
  expect(screen.getByTestId('history-reading-header')).toBeVisible();
  expect(screen.getByText('Cards drawn: 1')).toBeVisible();
});

test('top floating toolbar stays below the top safe area and inside horizontal insets',async()=>{
  function SafeRoot(){return <SafeAreaInsetsContext.Provider value={{top:24,bottom:16,left:44,right:28}}><Root/></SafeAreaInsetsContext.Provider>;}
  jest.mocked(historyStorage.read).mockResolvedValue(archive());await renderRouter({...routes,_layout:SafeRoot},{initialUrl:'/catalogue'});
  await fireEvent.press(screen.getByRole('tab',{name:'History'}));
  await fireEvent(screen.getByTestId('bottom-dock'),'layout',{nativeEvent:{layout:{width:360,height:110,x:0,y:600}}});
  await fireEvent(screen.getByTestId('history-session-a'),'longPress');
  expect(StyleSheet.flatten(screen.getByTestId('history-selection-toolbar').props.style)).toMatchObject({left:60,right:44,top:32});
  expect(StyleSheet.flatten(screen.getByTestId('history-selection-toolbar').props.style).bottom).toBeUndefined();
});
