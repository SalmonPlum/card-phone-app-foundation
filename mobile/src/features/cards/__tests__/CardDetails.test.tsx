import {templateFixture} from '../../../domain/__tests__/templateFixture';
import {resetClock,settle} from './helpers/overlayClock';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { sampleDeck } from '../../../decks/sample';
import { assetRegistry } from '../../../decks/assets';
import { CardDetails } from '../CardDetails';
beforeEach(()=>{resetClock();jest.spyOn(AccessibilityInfo,'isReduceMotionEnabled').mockResolvedValue(false);});

test.each(['cs', 'en'] as const)('shows complete card zero content in %s', async locale => {
  await render(<CardDetails detailTemplate={sampleDeck.detailTemplate} card={sampleDeck.cards[0]} locale={locale} assetRegistry={assetRegistry} />);
  const content = sampleDeck.cards[0].translations[locale];
  expect(screen.getByRole('header', { name: content.name })).toBeVisible();
  expect(screen.getByText(content.sections.meaning)).toBeVisible();
  expect(screen.getByText(content.sections.description).props.numberOfLines).toBeUndefined();
  expect(screen.getByTestId('detail-face-0').props.resizeMode).toBe('contain');
});
test('uses locale-specific artwork and displays an accessible localized image error', async () => {
  const card = { ...sampleDeck.cards[0], translations: {
    ...sampleDeck.cards[0].translations, cs: { ...sampleDeck.cards[0].translations.cs, faceAsset: 'sample.spring' },
  } };
  await render(<CardDetails detailTemplate={sampleDeck.detailTemplate} card={card} locale="cs" assetRegistry={assetRegistry} />);
  expect(screen.getByTestId('detail-face-0').props.source).toEqual(assetRegistry['sample.spring']);
  await fireEvent(screen.getByTestId('detail-face-0'), 'error');
  expect(screen.getByText('Obrázek karty se nepodařilo načíst.')).toBeVisible();
});


test('direct card details share a fixed name/Back header and reversible scroll collapse',async()=>{
  const back=jest.fn();
  await render(<CardDetails detailTemplate={sampleDeck.detailTemplate} card={sampleDeck.cards[0]} locale="en" assetRegistry={assetRegistry} onBack={back}/>);
  await fireEvent(screen.getByTestId('direct-detail-host'),'layout',{nativeEvent:{layout:{width:320,height:600}}});
  await fireEvent(screen.getByTestId('detail-header'),'layout',{nativeEvent:{layout:{height:88}}});await settle();
  const title=screen.getByRole('header',{name:'Seed'});
  const image=screen.getByTestId('detail-face-0');
  const pose=()=>screen.getByTestId('direct-detail-face-surface').props.style[1].__read();
  const expanded=pose();
  await fireEvent.scroll(screen.getByTestId('direct-detail-scroll'),{nativeEvent:{contentOffset:{y:120}}});await settle();
  expect(pose().transform[3].scaleY).toBeLessThan(expanded.transform[3].scaleY);
  expect(screen.getByRole('header',{name:'Seed'})).toBe(title);
  expect(screen.getByTestId('detail-face-0')).toBe(image);
  await fireEvent.scroll(screen.getByTestId('direct-detail-scroll'),{nativeEvent:{contentOffset:{y:0}}});await settle();
  expect(pose()).toEqual(expanded);
  await fireEvent.press(screen.getByRole('button',{name:'Back'}));expect(back).toHaveBeenCalledTimes(1);
});


test('direct details stay compact while the native reduced-motion preference is unresolved',async()=>{
  let resolve!:(value:boolean)=>void;
  const preference=jest.spyOn(AccessibilityInfo,'isReduceMotionEnabled').mockImplementationOnce(()=>new Promise<boolean>(done=>{resolve=done;}));
  try{
    await render(<CardDetails detailTemplate={sampleDeck.detailTemplate} card={sampleDeck.cards[0]} locale="en" assetRegistry={assetRegistry}/>);
    await fireEvent(screen.getByTestId('direct-detail-host'),'layout',{nativeEvent:{layout:{width:320,height:600}}});
    await fireEvent(screen.getByTestId('detail-header'),'layout',{nativeEvent:{layout:{height:88}}});
    const image=screen.getByTestId('detail-face-0');
    const pose=()=>screen.getByTestId('direct-detail-face-surface').props.style[1].__read();
    const compact=pose();
    expect(compact.transform[3].scaleY*357).toBeLessThanOrEqual(112);
    await act(()=>resolve(true));await settle();
    expect(pose()).toEqual(compact);
    expect(screen.getByTestId('detail-face-0')).toBe(image);
  }finally{preference.mockRestore();}
});

test('direct reader displays a third deck-defined section and updates headings/content with locale',async()=>{
 const deck=templateFixture(),card={...deck.cards[0],faceAsset:'sample.seed'};
 const view=await render(<CardDetails detailTemplate={deck.detailTemplate} card={card} locale="en" assetRegistry={assetRegistry}/>);
 expect(screen.getByRole('header',{name:'Context'})).toBeVisible();expect(screen.getByText('English context.')).toBeVisible();
 expect(screen.getByText('First paragraph.\n\nSecond paragraph.').props.numberOfLines).toBeUndefined();
 await view.rerender(<CardDetails detailTemplate={deck.detailTemplate} card={card} locale="cs" assetRegistry={assetRegistry}/>);
 expect(screen.getByRole('header',{name:'Souvislosti'})).toBeVisible();expect(screen.getByText('České souvislosti.')).toBeVisible();
 expect(screen.queryByText('Meaning')).toBeNull();
});
