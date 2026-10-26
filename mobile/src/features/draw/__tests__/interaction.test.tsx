import { fireEvent, render, screen } from '@testing-library/react-native';
import { ShuffleScene } from '../ShuffleScene';
import { sampleDeck } from '../../../decks/sample';
import type { SessionState } from '../../../domain/contracts';

jest.mock('../Stack', () => ({ Stack: () => null }));
jest.mock('../useShuffleAnimation', () => ({ useShuffleAnimation: () => ({ progress: { value: 0 }, samplePose: (cb: (pose: object, id: string, epoch: number) => void) => cb({x:620,y:330,angle:.12,scale:1}, 'session', 0) }) }));
const base: SessionState = {sessionId:'session',deckId:'sample',deckVersion:'1.0.0',remainingIds:[0,7],drawnIds:[],sourceIds:[],receivedIds:[],flyingIds:[],selectedId:null,phase:'regrip',epoch:0,drawQueued:false,phaseOrigin:null};
const handlers = () => ({onDraw:jest.fn(),onConfirm:jest.fn(),onPhaseComplete:jest.fn()});
test.each([['en','Draw a card','Confirm card'],['cs','Vytáhnout kartu','Potvrdit kartu']] as const)('accessible actions and flip lock in %s', async (locale,draw,confirm) => {
 const h=handlers(); const view=await render(<ShuffleScene state={base} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:draw})); expect(h.onDraw).toHaveBeenCalledTimes(1);
 await view.rerender(<ShuffleScene state={{...base,phase:'flip',selectedId:0}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:draw})); expect(h.onConfirm).not.toHaveBeenCalled(); expect(h.onDraw).toHaveBeenCalledTimes(1);
 await view.rerender(<ShuffleScene state={{...base,phase:'reveal',selectedId:0}} deck={sampleDeck} locale={locale} paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:confirm})); expect(h.onConfirm).toHaveBeenCalledTimes(1);
});
test('queued and paused input cannot request another draw', async () => {
 const h=handlers();const view=await render(<ShuffleScene state={{...base,drawQueued:true}} deck={sampleDeck} locale="en" paused={false} {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:'Draw a card'}));expect(h.onDraw).not.toHaveBeenCalled();
 await view.rerender(<ShuffleScene state={base} deck={sampleDeck} locale="en" paused {...h}/>);
 await fireEvent.press(screen.getByRole('button',{name:'Draw a card'}));expect(h.onDraw).not.toHaveBeenCalled();
});
