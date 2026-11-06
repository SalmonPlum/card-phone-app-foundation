import {ThemeProvider,useThemeSettings} from '../ThemeProvider';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useEffect } from 'react';
import { ThemeFontGate, useThemeTypography } from '../ThemeFontGate';
import {TextSizeProvider} from '../../settings/TextSizeProvider';

const flush = () => act(async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); });
function Copy({ onMount = () => {} }: { onMount?: () => void }) {
  const typography = useThemeTypography();
  useEffect(onMount, [onMount]);
  return <Text style={typography.cardTitle}>Ready to draw</Text>;
}

test('holds the session tree until all fonts load, then mounts it once with resolved faces', async () => {
  let finish!: () => void;
  const load = () => new Promise<void>(resolve => { finish = resolve; });
  const onMount = jest.fn();
  await render(<ThemeFontGate loadFonts={load}><Copy onMount={onMount}/></ThemeFontGate>); await flush();
  expect(screen.queryByText('Ready to draw')).toBeNull();
  expect(screen.getByRole('progressbar')).toBeVisible();
  expect(onMount).not.toHaveBeenCalled();
  await act(() => finish()); await flush();
  expect(screen.getByText('Ready to draw')).toHaveStyle({ fontFamily: 'Theme_EBGaramond_500' });
  expect(onMount).toHaveBeenCalledTimes(1);
});

test('load failure offers retry before mounting children; retry succeeds without a fallback session', async () => {
  const load = jest.fn().mockRejectedValueOnce(new Error('native font error')).mockResolvedValue(undefined);
  await render(<ThemeFontGate loadFonts={load}><Copy/></ThemeFontGate>); await flush();
  expect(screen.getByRole('alert')).toBeVisible();
  expect(screen.queryByText('Ready to draw')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' })); await flush();
  expect(screen.getByText('Ready to draw')).toHaveStyle({ fontFamily: 'Theme_EBGaramond_500' });
});

test('system fallback remains usable and does not hot-swap font metrics later in the run', async () => {
  const load = jest.fn().mockRejectedValue(new Error('unavailable'));
  const onMount = jest.fn();
  const view = await render(<ThemeFontGate loadFonts={load}><Copy onMount={onMount}/></ThemeFontGate>); await flush();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue with system fonts' })); await flush();
  expect(screen.getByText('Ready to draw').props.style.fontFamily).not.toBe('Theme_EBGaramond_500');
  await view.rerender(<ThemeFontGate loadFonts={load}><Copy onMount={onMount}/></ThemeFontGate>); await flush();
  expect(onMount).toHaveBeenCalledTimes(1);
  expect(load).toHaveBeenCalledTimes(1);
});

test('a late completion after unmount cannot mount the old session tree', async () => {
  let finish!: () => void;
  const load = () => new Promise<void>(resolve => { finish = resolve; });
  const onMount = jest.fn();
  const view = await render(<ThemeFontGate loadFonts={load}><Copy onMount={onMount}/></ThemeFontGate>); await flush();
  await view.unmount();
  await act(() => finish()); await flush();
  expect(onMount).not.toHaveBeenCalled();
});

test('timeout can enter a stable fallback and a late native success cannot replace it', async () => {
  jest.useFakeTimers();
  try {
    let finish!: () => void;
    const load = () => new Promise<void>(resolve => { finish = resolve; });
    await render(<ThemeFontGate loadFonts={load}><Copy/></ThemeFontGate>); await flush();
    await act(() => jest.advanceTimersByTime(15000));
    expect(screen.getByRole('alert')).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Continue with system fonts' })); await flush();
    const copy = screen.getByText('Ready to draw'), family = copy.props.style.fontFamily;
    await act(() => finish()); await flush();
    expect(screen.getByText('Ready to draw')).toBe(copy);
    expect(copy).toHaveStyle({fontFamily:family});
    expect(family).not.toBe('Theme_EBGaramond_500');
  } finally { jest.useRealTimers(); }
});

function ActiveTheme() { return <Text>{useThemeSettings().theme.id}</Text>; }

test('the full startup deadline bounds both fonts and a stalled theme read, and fallback ignores late hydration', async () => {
  jest.useFakeTimers();
  try {
    let restore!: (id:string) => void, fonts!: () => void;
    const storage={read:()=>new Promise<string>(resolve=>{restore=resolve;}),write:async()=>{}};
    const load=()=>new Promise<void>(resolve=>{fonts=resolve;});
    const onMount=jest.fn();
    await render(<ThemeProvider storage={storage}><ThemeFontGate loadFonts={load}><Copy onMount={onMount}/><ActiveTheme/></ThemeFontGate></ThemeProvider>);await flush();
    await act(()=>jest.advanceTimersByTime(14000));
    await act(()=>fonts());await flush();
    expect(screen.queryByText('Ready to draw')).toBeNull();
    await act(()=>jest.advanceTimersByTime(1000));
    expect(screen.getByRole('alert')).toBeVisible();
    await fireEvent.press(screen.getByRole('button',{name:'Continue with system fonts'}));await flush();
    expect(screen.getByText('mystic-arbor')).toBeVisible();
    await act(()=>restore('solstice-ochre'));await flush();
    expect(screen.queryByText('solstice-ochre')).toBeNull();
    expect(screen.getByText('Ready to draw')).toHaveStyle({fontSize:32});
    expect(onMount).toHaveBeenCalledTimes(1);
  } finally {jest.useRealTimers();}
});

test('startup retry repeats a stalled preference read and prevents the first read overwriting the retry', async () => {
  jest.useFakeTimers();
  try {
    let oldRestore!: (id:string)=>void;
    const storage={read:jest.fn().mockImplementationOnce(()=>new Promise<string>(resolve=>{oldRestore=resolve;})).mockResolvedValue('celestial-midnight'),write:async()=>{}};
    await render(<ThemeProvider storage={storage}><ThemeFontGate loadFonts={async()=>{}}><Copy/><ActiveTheme/></ThemeFontGate></ThemeProvider>);await flush();
    await act(()=>jest.advanceTimersByTime(15000));
    await fireEvent.press(screen.getByRole('button',{name:'Try again'}));await flush();
    expect(screen.getByText('celestial-midnight')).toBeVisible();
    expect(screen.getByText('Ready to draw')).toHaveStyle({fontFamily:'Theme_NotoSerif_400'});
    await act(()=>oldRestore('solstice-ochre'));await flush();
    expect(screen.queryByText('solstice-ochre')).toBeNull();
  } finally {jest.useRealTimers();}
});

test('startup restores text size before mounting once and scales loading, errors and recovery buttons',async()=>{
  let finish!:()=>void;
  const load=()=>new Promise<void>(resolve=>{finish=resolve;});
  const onMount=jest.fn();
  await render(<TextSizeProvider storage={{read:async()=>'large',write:async()=>{}}}><ThemeFontGate loadFonts={load}><Copy onMount={onMount}/></ThemeFontGate></TextSizeProvider>);
  await flush();
  expect(screen.getByRole('progressbar')).toHaveStyle({fontSize:16*1.15,lineHeight:30});
  expect(onMount).not.toHaveBeenCalled();
  await act(()=>finish());await flush();
  expect(screen.getByText('Ready to draw')).toHaveStyle({fontSize:32*1.15,lineHeight:56});
  expect(onMount).toHaveBeenCalledTimes(1);
});

test('a stalled size read is bounded and fallback ignores late restore without saving a default',async()=>{
  jest.useFakeTimers();
  try {
    let restore!:(size:string)=>void;
    const storage={read:()=>new Promise<string>(resolve=>{restore=resolve;}),write:jest.fn(async()=>{})};
    const onMount=jest.fn();
    await render(<TextSizeProvider storage={storage}><ThemeFontGate loadFonts={async()=>{}}><Copy onMount={onMount}/></ThemeFontGate></TextSizeProvider>);await flush();
    expect(screen.queryByText('Ready to draw')).toBeNull();
    await act(()=>jest.advanceTimersByTime(15000));
    expect(screen.getByRole('alert')).toBeVisible();
    await fireEvent.press(screen.getByRole('button',{name:'Continue with system fonts'}));await flush();
    const copy=screen.getByText('Ready to draw');
    expect(copy).toHaveStyle({fontSize:32});
    await act(()=>restore('large'));await flush();
    expect(screen.getByText('Ready to draw')).toBe(copy);
    expect(copy).toHaveStyle({fontSize:32});
    expect(onMount).toHaveBeenCalledTimes(1);expect(storage.write).not.toHaveBeenCalled();
  } finally {jest.useRealTimers();}
});

test('size restore retry rejects an earlier read and recovery text follows the restored size',async()=>{
  jest.useFakeTimers();
  try {
    let oldRestore!:(size:string)=>void;
    const storage={read:jest.fn().mockImplementationOnce(()=>new Promise<string>(resolve=>{oldRestore=resolve;})).mockResolvedValue('large'),write:async()=>{}};
    const load=jest.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('font unavailable'));
    await render(<TextSizeProvider storage={storage}><ThemeFontGate loadFonts={load}><Copy/></ThemeFontGate></TextSizeProvider>);await flush();
    await act(()=>jest.advanceTimersByTime(15000));
    await fireEvent.press(screen.getByRole('button',{name:'Try again'}));await flush();
    expect(screen.getByRole('alert')).toHaveStyle({fontSize:16*1.15,lineHeight:30});
    expect(screen.getByText('Try again')).toHaveStyle({fontSize:13*1.15,lineHeight:26});
    expect(screen.getByText('Continue with system fonts')).toHaveStyle({fontSize:13*1.15});
    await fireEvent.press(screen.getByRole('button',{name:'Continue with system fonts'}));await flush();
    await act(()=>oldRestore('small'));await flush();
    expect(screen.getByText('Ready to draw')).toHaveStyle({fontSize:32*1.15});
  } finally {jest.useRealTimers();}
});

test('startup recovery keeps both actions in a scrollable viewport for enlarged text',async()=>{
  const load=async()=>{throw new Error('font unavailable');};
  await render(<TextSizeProvider storage={{read:async()=>'large',write:async()=>{}}}><ThemeFontGate loadFonts={load}><Copy/></ThemeFontGate></TextSizeProvider>);
  await flush();
  const recovery=screen.getByRole('button',{name:'Continue with system fonts'});
  let scroll=recovery.parent;
  while(scroll && scroll.type!=='RCTScrollView') scroll=scroll.parent;
  expect(scroll).not.toBeNull();
  expect(scroll!.props.contentContainerStyle).toMatchObject({flexGrow:1});
  expect(recovery).toHaveStyle({minHeight:48});
  expect(screen.getByRole('button',{name:'Try again'})).toHaveStyle({minHeight:48});
  expect(screen.getByRole('alert')).toHaveStyle({fontSize:16*1.15});
});
