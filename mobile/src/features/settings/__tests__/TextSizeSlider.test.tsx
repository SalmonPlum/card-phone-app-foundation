import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Locale } from '../../../domain/contracts';
import type { TextSize } from '../../../settings/textSize';
import { TextSizeSlider } from '../TextSizeSlider';

function Harness({ initial = 'standard', locale = 'en', changed = () => {} }: {
  initial?: TextSize; locale?: Locale; changed?: (size: TextSize) => void;
}) {
  const [value, setValue] = useState(initial);
  return <TextSizeSlider value={value} locale={locale} onChange={size => { setValue(size); changed(size); }}/>;
}
const touch = (x: number, y = 0) => ({ nativeEvent: { locationX: x, pageX: x + 40, pageY: y + 80 } });
async function layout(width = 200) {
  await fireEvent(screen.getByRole('adjustable'), 'layout', { nativeEvent: { layout: { width, height: 48 } } });
}
async function tap(x: number) {
  const slider = screen.getByRole('adjustable');
  await fireEvent(slider, 'responderGrant', touch(x));
  await fireEvent(slider, 'responderRelease', touch(x));
}

test('slider taps select three stops with localized accessible values and no visible option words', async () => {
  await render(<Harness/>); await layout();
  expect(screen.getByRole('adjustable', { name: 'Font size' })).toHaveStyle({ minHeight: 48 });
  for (const [x, now, text] of [[12, 0, 'Small'], [100, 1, 'Standard'], [188, 2, 'Large']] as const) {
    await tap(x);
    expect(screen.getByRole('adjustable').props.accessibilityValue).toEqual({ min: 0, max: 2, now, text });
    expect(screen.queryByText(text)).toBeNull();
  }
  expect(screen.getAllByRole('adjustable')).toHaveLength(1);
});

test('horizontal dragging clamps and saves only the released stop without resizing during the gesture', async () => {
  const changed = jest.fn();
  await render(<Harness initial="small" changed={changed}/>); await layout();
  const slider = screen.getByRole('adjustable');
  await fireEvent(slider, 'responderGrant', touch(12));
  for (const x of [100, 101, 188, 350, 360]) await fireEvent(slider, 'responderMove', touch(x));
  expect(changed).not.toHaveBeenCalled();
  await fireEvent(slider, 'responderRelease', touch(360));
  expect(changed.mock.calls).toEqual([['large']]);
  await tap(-50);
  expect(changed).toHaveBeenLastCalledWith('small');
});

test('thumb and fill follow the finger between stops and snap only on release', async () => {
  const changed = jest.fn();
  await render(<Harness changed={changed}/>); await layout();
  const slider = screen.getByRole('adjustable');
  await fireEvent(slider, 'responderGrant', touch(100));
  await fireEvent(slider, 'responderMove', touch(144));
  expect(screen.getByTestId('text-size-thumb',{includeHiddenElements:true})).toHaveStyle({left:134});
  expect(screen.getByTestId('text-size-fill',{includeHiddenElements:true})).toHaveStyle({width:132});
  expect(changed).not.toHaveBeenCalled();
  await fireEvent(slider, 'responderRelease', touch(144));
  expect(changed).toHaveBeenCalledWith('large');
  expect(screen.getByTestId('text-size-thumb',{includeHiddenElements:true})).toHaveStyle({left:178});
});

test('drag uses page displacement rather than a moving event target and preserves thumb grab offset', async () => {
  await render(<Harness/>); await layout();
  const slider = screen.getByRole('adjustable');
  await fireEvent(slider, 'responderGrant', touch(108));
  const moved={nativeEvent:{locationX:1,pageX:192,pageY:80}};
  await fireEvent(slider, 'responderMove', moved);
  // Grabbed 8dp right of the thumb: finger is now at x152, thumb center is x144.
  expect(screen.getByTestId('text-size-thumb',{includeHiddenElements:true})).toHaveStyle({left:134});
  await fireEvent(slider, 'responderTerminate', moved);
  expect(screen.getByTestId('text-size-thumb',{includeHiddenElements:true})).toHaveStyle({left:90});
  expect(screen.getByRole('adjustable').props.accessibilityValue.now).toBe(1);
});

test('a width change cancels an in-flight drag without committing a stale coordinate', async () => {
  const changed=jest.fn();
  await render(<Harness changed={changed}/>); await layout();
  const slider=screen.getByRole('adjustable');
  await fireEvent(slider,'responderGrant',touch(100));
  await fireEvent(slider,'responderMove',touch(170));
  await layout(300);
  await fireEvent(slider,'responderRelease',touch(170));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByRole('adjustable').props.accessibilityValue.now).toBe(1);
});

test('vertical gestures do not change size and can yield to the parent scroll responder', async () => {
  const changed = jest.fn();
  await render(<Harness changed={changed}/>); await layout();
  const slider = screen.getByRole('adjustable');
  await fireEvent(slider, 'responderGrant', touch(100));
  expect(slider.props.onResponderTerminationRequest()).toBe(true);
  await fireEvent(slider, 'responderMove', touch(102, 40));
  await fireEvent(slider, 'responderRelease', touch(102, 40));
  expect(changed).not.toHaveBeenCalled();
  await fireEvent(slider, 'responderGrant', touch(100));
  await fireEvent(slider, 'responderMove', touch(188));
  expect(slider.props.onResponderTerminationRequest()).toBe(false);
  await fireEvent(slider, 'responderTerminate', touch(188));
});

test('screen-reader adjustments work without layout and clamp at both ends in Czech', async () => {
  const changed = jest.fn();
  await render(<Harness locale="cs" changed={changed}/>);
  const action = async (actionName: string) => fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName } });
  expect(screen.getByRole('adjustable', { name: 'Velikost písma' }).props.accessibilityValue.text).toBe('Standardní');
  await action('increment'); await action('increment');
  expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Velká');
  await action('decrement'); await action('decrement'); await action('decrement');
  expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Malá');
  await action('activate');
  expect(changed.mock.calls).toEqual([['large'], ['standard'], ['small']]);
});

test('touch input waits for a usable layout and ignores non-finite coordinates', async () => {
  const changed = jest.fn();
  await render(<Harness changed={changed}/>);
  await tap(188); await layout(0); await tap(188);
  expect(changed).not.toHaveBeenCalled();
  await layout(); await tap(NaN);
  expect(changed).not.toHaveBeenCalled();
  await tap(188);
  expect(changed).toHaveBeenLastCalledWith('large');
});

test('external preference restoration updates the next adjustment rather than using the old stop', async () => {
  const changed = jest.fn();
  const view = await render(<TextSizeSlider value="large" locale="en" onChange={changed}/>);
  await view.rerender(<TextSizeSlider value="small" locale="en" onChange={changed}/>);
  await fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
  expect(changed).toHaveBeenCalledWith('standard');
});

test('an external value change cancels a drag preview without reviving it when the value returns', async () => {
  const changed=jest.fn();
  const view=await render(<TextSizeSlider value="standard" locale="en" onChange={changed}/>);await layout();
  const slider=screen.getByRole('adjustable');
  await fireEvent(slider,'responderGrant',touch(100));
  await fireEvent(slider,'responderMove',touch(150));
  await view.rerender(<TextSizeSlider value="large" locale="en" onChange={changed}/>);
  await view.rerender(<TextSizeSlider value="standard" locale="en" onChange={changed}/>);
  expect(screen.getByTestId('text-size-thumb',{includeHiddenElements:true})).toHaveStyle({left:90});
  await fireEvent(screen.getByRole('adjustable'),'responderRelease',touch(150));
  expect(changed).not.toHaveBeenCalled();
});
