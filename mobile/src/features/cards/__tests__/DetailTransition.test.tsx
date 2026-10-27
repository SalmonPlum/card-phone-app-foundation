import { render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { DetailTransition } from '../DetailTransition';

test.each([true, null])('avoids scale/translation for reduced or unresolved motion preference %s', async reducedMotion => {
  const view = await render(<DetailTransition origin={{ scrollKey: 'grid', rect: { x: 0, y: 0, width: 150, height: 225 } }} reducedMotion={reducedMotion}><Text>Card</Text></DetailTransition>);
  expect(StyleSheet.flatten(view.toJSON()!.props.style).transform).toEqual([]);
});
test.each([null, { scrollKey: 'grid', rect: { x: 0, y: -300, width: 150, height: 225 } }])('uses native fade without targeting a missing/offscreen tile', async origin => {
  const view = await render(<DetailTransition origin={origin} reducedMotion={false}><Text>Card</Text></DetailTransition>);
  expect(StyleSheet.flatten(view.toJSON()!.props.style).transform).toEqual([]);
});
