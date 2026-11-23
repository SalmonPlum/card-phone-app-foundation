import {pulseDrawHaptic} from '../drawHaptics';
const mockImpact = jest.fn();
jest.mock('expo-haptics', () => ({
  impactAsync: (...args: unknown[]) => mockImpact(...args),
  ImpactFeedbackStyle: {Light: 'light', Heavy: 'heavy'},
}));
beforeEach(() => mockImpact.mockReset());
test.each([['shuffle','light'],['reveal','heavy']] as const)('requests %s native feedback at the right strength', (kind, expected) => {
  mockImpact.mockResolvedValue(undefined);
  pulseDrawHaptic(kind);
  expect(mockImpact).toHaveBeenCalledWith(expected);
  expect(mockImpact).toHaveBeenCalledTimes(1);
});
test('a synchronous native failure cannot interrupt drawing', () => {
  mockImpact.mockImplementation(() => {throw new Error('native module unavailable');});
  expect(() => pulseDrawHaptic('reveal')).not.toThrow();
});
test('a rejected native request is handled without retrying feedback', async () => {
  mockImpact.mockRejectedValue(new Error('unsupported'));
  pulseDrawHaptic('reveal');
  await Promise.resolve(); await Promise.resolve();
  expect(mockImpact).toHaveBeenCalledTimes(1);
});

test('an older client missing the native module remains usable', () => {
  jest.isolateModules(() => {
    jest.doMock('expo-haptics', () => {throw new Error('Cannot find native module ExpoHaptics');});
    const missing = jest.requireActual('../drawHaptics') as typeof import('../drawHaptics');
    expect(() => missing.pulseDrawHaptic('reveal')).not.toThrow();
  });
});
