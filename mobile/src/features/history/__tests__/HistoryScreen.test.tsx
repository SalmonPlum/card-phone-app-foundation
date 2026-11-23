import {loadArtwork} from '../../../artwork/__tests__/helpers/nativeArtwork';
import {act,fireEvent,renderRouter,screen} from 'expo-router/testing-library';
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
const routes={_layout:Root,'(tabs)/_layout':Tabs,'(tabs)/index':Draw,'(tabs)/catalogue':Probe,'(tabs)/settings':Settings,'(tabs)/history':History,'card/[id]':Details};
function archive(enabled=true){const time=Date.now();return JSON.stringify({schemaVersion:1,enabled,sessions:['a','b'].map((id,index)=>({sessionId:id,firstRevealedAt:time-index*1000,finished:index===0,deck:{...sampleDeck,cards:[{...sampleDeck.cards[0],translations:{...sampleDeck.cards[0].translations,en:{...sampleDeck.cards[0].translations.en,name:'Saved seed',sections:{meaning:'Saved original meaning.',description:'Saved original description.'}}}}]},draws:[{cardId:0,revealedAt:time-index*1000}]}))});}
const nativeState=AppState.currentState;
const methods=jest.requireActual('@react-native/jest-preset/jest/MockNativeMethods').default;
beforeEach(()=>{methods.measureInWindow.mockImplementation((done:(x:number,y:number,w:number,h:number)=>void)=>done(0,0,360,800));mockId=0;resetClock();AppState.currentState='active';jest.mocked(historyStorage.read).mockResolvedValue(null);});
afterEach(()=>{methods.measureInWindow.mockReset();AppState.currentState=nativeState;jest.mocked(historyStorage.read).mockResolvedValue(null);});
test('off has three tabs; enabling adds History without resetting the current session',async()=>{
  await renderRouter(routes,{initialUrl:'/catalogue'});const existing=session.state;
  expect(screen.getAllByRole('tab')).toHaveLength(3);await act(()=>router.navigate('/settings'));
  await fireEvent(screen.getByRole('switch',{name:'Save drawing history'}),'valueChange',true);
  expect(screen.getAllByRole('tab')).toHaveLength(4);expect(session.state).toBe(existing);
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
    await fireEvent.press(screen.getByRole('button',{name:'Select'}));await fireEvent.press(screen.getByTestId('history-session-a'));
    await fireEvent.press(screen.getByRole('button',{name:'Delete selected (1)'}));expect(history.archive.sessions).toHaveLength(2);
    const buttons=alert.mock.calls.at(-1)![2]!;await act(()=>buttons.find(button=>button.style==='destructive')!.onPress!());
    expect(history.archive.sessions.map(item=>item.sessionId)).toEqual(['b']);
  }finally{alert.mockRestore();}
});
test('disabling retains stored records and Clear history can remove them while off',async()=>{
  jest.mocked(historyStorage.read).mockResolvedValue(archive());const alert=jest.spyOn(Alert,'alert');
  try{
    await renderRouter(routes,{initialUrl:'/catalogue'});await fireEvent.press(screen.getByRole('tab',{name:'History'}));await act(()=>router.navigate('/settings'));
    await fireEvent(screen.getByRole('switch',{name:'Save drawing history'}),'valueChange',false);expect(history.archive.sessions).toHaveLength(2);expect(screen.getAllByRole('tab')).toHaveLength(3);expect(screen.getByTestId('settings-screen')).toBeVisible();
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
    const tabs=screen.getAllByRole('tab');expect(tabs.map(tab=>tab.props.accessibilityLabel)).toEqual(['Tahání','Katalog','Historie','Nastavení']);
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
