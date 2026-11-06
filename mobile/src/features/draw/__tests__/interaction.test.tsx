import {templateFixture} from '../../../domain/__tests__/templateFixture';
import { act,fireEvent, render, screen, within } from '@testing-library/react-native';
import { ShuffleScene } from '../ShuffleScene';
import { sampleDeck } from '../../../decks/sample';
import type { SessionState } from '../../../domain/contracts';

// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated',()=>({__esModule:true,default:{View:require('react-native').View,ScrollView:require('react-native').ScrollView},useSharedValue:(value:unknown)=>({value,set(next:unknown){this.value=next;}}),useAnimatedStyle:()=>({}),useAnimatedScrollHandler:(handlers:{onScroll:(event:unknown)=>void})=>(event:{nativeEvent?:unknown})=>handlers.onScroll(event.nativeEvent ?? event)}));
jest.mock('../Stack', () => ({ Stack: () => null }));
jest.mock('../useShuffleAnimation', () => ({ useShuffleAnimation: (state:SessionState) => ({ frame:{value:{phase:state.phase}},progress: { value: 0 }, samplePose: (cb: (pose: object, id: string, epoch: number) => void) => cb({x:620,y:330,angle:.12,scale:1}, 'session', 0) }) }));
const base: SessionState = {sessionId:'session',deckId:'sample',deckVersion:'1.0.0',remainingIds:[0,7],drawnIds:[],sourceIds:[],receivedIds:[],flyingIds:[],selectedId:null,phase:'regrip',epoch:0,drawQueued:false,phaseOrigin:null};
const handlers = () => ({onDraw:jest.fn(),onConfirm:jest.fn(),onPhaseComplete:jest.fn()});
test.each([['en','Draw a card','Confirm card'],['cs','Vytáhnout kartu','Potvrdit kartu']] as const)('accessible actions and flip lock in %s', async (locale,draw,confirm) => {
 const h=handlers(); const view=await render(<ShuffleScene state={base} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:draw})); expect(h.onDraw).toHaveBeenCalledTimes(1);
 await view.rerender(<ShuffleScene state={{...base,phase:'flip',selectedId:0}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:confirm})); expect(h.onConfirm).not.toHaveBeenCalled(); expect(h.onDraw).toHaveBeenCalledTimes(1);
 expect(screen.queryByRole('button',{name:draw})).toBeNull();
 await view.rerender(<ShuffleScene state={{...base,phase:'reveal',selectedId:0}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:confirm})); expect(h.onConfirm).toHaveBeenCalledTimes(1);
});
test('queued and paused input cannot request another draw', async () => {
 const h=handlers();const view=await render(<ShuffleScene state={{...base,drawQueued:true}} deck={sampleDeck} locale="en" paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:'Draw a card'}));expect(h.onDraw).not.toHaveBeenCalled();
 await view.rerender(<ShuffleScene state={base} deck={sampleDeck} locale="en" paused {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:'Draw a card'}));expect(h.onDraw).not.toHaveBeenCalled();
});

test.each([
 ['cs','Potvrdit kartu','Pro potvrzení klepněte na kartu.'],
 ['en','Confirm card','Tap the card to confirm.'],
] as const)('plain confirmation instruction leaves the card as the action in %s',async(locale,confirm,hint)=>{
 const h=handlers();
 const state={...base,phase:'reveal' as const,selectedId:0,drawnIds:[0]};
 const view=await render(<ShuffleScene state={state} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 const instruction=screen.getByText(hint);
 expect(screen.queryByText(confirm)).toBeNull();
 expect(screen.getAllByRole('button',{name:confirm})).toHaveLength(1);
 expect(screen.getByRole('button',{name:confirm})).toBe(screen.getByTestId('draw-foreground-confirm'));
 await fireEvent.press(instruction);
 expect(h.onConfirm).not.toHaveBeenCalled();
 await fireEvent.press(screen.getByTestId('draw-foreground-confirm'));
 expect(h.onConfirm).toHaveBeenCalledTimes(1);
 await view.rerender(<ShuffleScene state={state} deck={sampleDeck} locale={locale} paused {...h}/>);
 await fireEvent.press(screen.getByTestId('draw-foreground-confirm'));
 expect(h.onConfirm).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('button',{name:confirm})).toBeDisabled();
});

test.each(['cs','en'] as const)('card information and swipe hint are available after flip in %s without confirming',async locale=>{
 const h=handlers();const card=sampleDeck.cards[0];
 const view=await render(<ShuffleScene state={{...base,phase:'flip',selectedId:0,drawnIds:[0]}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 expect(screen.queryByText(card.translations[locale].sections.meaning)).toBeNull();
 await view.rerender(<ShuffleScene state={{...base,phase:'reveal',selectedId:0,drawnIds:[0]}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 expect(screen.getByText(locale==='en'?'Swipe up for details':'Přejeďte nahoru pro podrobnosti')).toBeVisible();
 expect(screen.getByText(card.translations[locale].sections.meaning)).toBeVisible();
 expect(screen.getByText(card.translations[locale].sections.description)).toBeVisible();
 expect(h.onConfirm).not.toHaveBeenCalled();
});


test('swiping or tapping information cannot confirm, but a fresh card tap or accessibility activation can',async()=>{
  const h=handlers();
  await render(<ShuffleScene state={{...base,phase:'reveal',selectedId:0,drawnIds:[0]}} deck={sampleDeck} locale="en" paused={false} {...h}/>);
  const card=screen.getByTestId('draw-foreground-confirm');
  await fireEvent(card,'pressIn');
  await fireEvent(screen.getByTestId('draw-reveal-scroll'),'scrollBeginDrag',{nativeEvent:{contentOffset:{y:0}}});
  await fireEvent.scroll(screen.getByTestId('draw-reveal-scroll'),{nativeEvent:{contentOffset:{y:100}}});
  await fireEvent.press(card);expect(h.onConfirm).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(sampleDeck.cards[0].translations.en.sections.meaning));
  expect(h.onConfirm).not.toHaveBeenCalled();
  await fireEvent(card,'pressIn');await fireEvent.press(card);expect(h.onConfirm).toHaveBeenCalledTimes(1);
  await fireEvent(screen.getByTestId('draw-reveal-scroll'),'scrollBeginDrag',{nativeEvent:{contentOffset:{y:100}}});
  await fireEvent(card,'accessibilityAction',{nativeEvent:{actionName:'activate'}});
  expect(h.onConfirm).toHaveBeenCalledTimes(2);
});

test('old confirmation callbacks cannot confirm a later session and remain locked while paused',async()=>{
  const h=handlers(),state={...base,phase:'reveal' as const,selectedId:0,drawnIds:[0]};
  const view=await render(<ShuffleScene state={state} deck={sampleDeck} locale="en" paused={false} {...h}/>);
  const oldPress=screen.getByTestId('draw-foreground-confirm').props.onAccessibilityTap;
  await view.rerender(<ShuffleScene state={{...state,sessionId:'fresh'}} deck={sampleDeck} locale="en" paused={false} {...h}/>);
  await act(()=>oldPress());expect(h.onConfirm).not.toHaveBeenCalled();
  const currentPress=screen.getByTestId('draw-foreground-confirm').props.onAccessibilityTap;
  await view.rerender(<ShuffleScene state={{...state,sessionId:'fresh'}} deck={sampleDeck} locale="en" paused {...h}/>);
  await act(()=>currentPress());expect(h.onConfirm).not.toHaveBeenCalled();
});

test.each([['en','Flip card','Tap the card to reveal.'],['cs','Otočit kartu','Pro odhalení klepněte na kartu.']] as const)('manual wait hides identity and has a separate flip action in %s',async(locale,flip,prompt)=>{
 const h={...handlers(),onReveal:jest.fn()},waiting={...base,phase:'awaitingReveal' as const,selectedId:0,drawnIds:[0],epoch:3};
 const view=await render(<ShuffleScene state={waiting} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 expect(screen.getByText(prompt)).toBeVisible();
 expect(screen.queryByText(sampleDeck.cards[0].translations[locale].name)).toBeNull();
 expect(screen.queryByText(sampleDeck.cards[0].translations[locale].sections.meaning)).toBeNull();
 const action=screen.getByRole('button',{name:flip});
 const stale=action.props.onAccessibilityTap;
 await fireEvent.press(action);expect(h.onReveal).toHaveBeenCalledWith(waiting.sessionId,waiting.epoch);expect(h.onConfirm).not.toHaveBeenCalled();
 await view.rerender(<ShuffleScene state={{...waiting,phase:'flip',epoch:4}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 await act(()=>stale());expect(h.onReveal).toHaveBeenCalledTimes(1);expect(h.onConfirm).not.toHaveBeenCalled();
 await view.rerender(<ShuffleScene state={{...waiting,phase:'reveal',epoch:5}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 expect(screen.getByText(sampleDeck.cards[0].translations[locale].sections.meaning)).toBeVisible();
 await act(()=>stale());expect(h.onConfirm).not.toHaveBeenCalled();
 await fireEvent.press(screen.getByRole('button',{name:locale==='en'?'Confirm card':'Potvrdit kartu'}));expect(h.onConfirm).toHaveBeenCalledTimes(1);
});

test('drawn-card reader shows all template sections only after reveal in the chosen language',async()=>{
 const deck=templateFixture(),h={...handlers(),onReveal:jest.fn()};
 const waiting={...base,phase:'awaitingReveal' as const,selectedId:0,drawnIds:[0]};
 const view=await render(<ShuffleScene state={waiting} deck={deck} locale="en" paused={false} {...h}/>);
 expect(screen.queryByText('English context.')).toBeNull();
 await view.rerender(<ShuffleScene state={{...waiting,phase:'reveal',epoch:3}} deck={deck} locale="en" paused={false} {...h}/>);
 expect(screen.getByRole('header',{name:'Context'})).toBeVisible();
 await fireEvent.press(screen.getByText('English context.'));expect(h.onConfirm).not.toHaveBeenCalled();
 await view.rerender(<ShuffleScene state={{...waiting,phase:'reveal',epoch:3}} deck={deck} locale="cs" paused={false} {...h}/>);
 expect(screen.getByRole('header',{name:'Souvislosti'})).toBeVisible();expect(screen.getByText('České souvislosti.')).toBeVisible();
});

test.each([
 ['en','Tap to draw a card','Draw a card'],
 ['cs','Klepnutím vytáhnete kartu','Vytáhnout kartu'],
] as const)('draw hint stays inside the bottom of the mat while unavailable in %s',async(locale,hintText,action)=>{
 const h=handlers();
 const view=await render(<ShuffleScene state={base} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 const hint=screen.getByText(hintText);
 expect(hint).toBeVisible();
 expect(within(screen.getByTestId('shuffle-mat')).getByText(hintText)).toBe(hint);
 expect(hint).toHaveStyle({position:'absolute',bottom:16});
 await view.rerender(<ShuffleScene state={{...base,drawQueued:true}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 expect(screen.queryByText(hintText)).toBeNull();
 expect(screen.getByText(hintText,{includeHiddenElements:true})).toBe(hint);
 await view.rerender(<ShuffleScene state={base} deck={sampleDeck} locale={locale} paused {...h}/>);
 expect(screen.queryByText(hintText)).toBeNull();
 await view.rerender(<ShuffleScene state={base} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 expect(screen.getByText(hintText)).toBe(hint);
 await fireEvent.press(screen.getByRole('button',{name:action}));
 expect(h.onDraw).toHaveBeenCalledTimes(1);
 await view.rerender(<ShuffleScene state={{...base,phase:'reveal',selectedId:0}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 expect(screen.queryByText(hintText)).toBeNull();
});
