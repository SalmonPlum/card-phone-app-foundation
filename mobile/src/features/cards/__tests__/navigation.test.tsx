import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import Home from '../../../app/index';
import Catalogue from '../../../app/catalogue';
import Details from '../../../app/card/[id]';
import Layout from '../../../app/_layout';
import * as Localization from 'expo-localization';

const routes = { _layout: Layout, index: Home, catalogue: Catalogue, 'card/[id]': Details };
test('opens the live catalogue from Home, opens zero, and can open another card after Back', async () => {
  await renderRouter(routes);
  await fireEvent.press(screen.getByText('Browse cards'));
  expect(screen).toHavePathname('/catalogue');
  const mountedGrid = screen.getByTestId('card-grid');
  await fireEvent.scroll(mountedGrid, { nativeEvent: { contentOffset: { x: 0, y: 160 } } });
  await fireEvent.press(screen.getByRole('button', { name: 'Seed' }));
  expect(screen).toHavePathname('/card/0');
  expect(screen.getByText('A small beginning that needs care.')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen).toHavePathname('/catalogue');
  expect(screen.getByTestId('card-grid')).toBe(mountedGrid);
  await fireEvent.press(screen.getByRole('button', { name: 'Spring' }));
  expect(screen).toHavePathname('/card/7');
});
test('follows the Czech app locale throughout Home, catalogue, details and Back', async () => {
  const locale = Localization.getLocales()[0];
  const locales = jest.spyOn(Localization, 'useLocales').mockReturnValue([{ ...locale, languageTag: 'cs-CZ', languageCode: 'cs' }]);
  try {
    await renderRouter(routes);
    expect(screen.getByRole('header', { name: 'Tichá zahrada' })).toBeVisible();
    await fireEvent.press(screen.getByText('Prohlížet karty'));
    expect(screen.getByRole('header', { name: 'Všechny karty' })).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Semínko' }));
    expect(screen).toHavePathname('/card/0');
    expect(screen.getByText('Malý začátek, který potřebuje péči.')).toBeVisible();
    await fireEvent.press(screen.getByRole('button', { name: 'Zpět' }));
    expect(screen).toHavePathname('/catalogue');
  } finally { locales.mockRestore(); }
});
test.each(['/card/7x', '/card/100', '/card/00'])('offers safe localized recovery for %s', async initialUrl => {
  await renderRouter(routes, { initialUrl });
  expect(screen.getByText('This card could not be found.')).toBeVisible();
  expect(screen.queryByText('A small beginning that needs care.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen).toHavePathname('/catalogue');
});
test('a valid deep link uses the same full details and Back fallback', async () => {
  await renderRouter(routes, { initialUrl: '/card/99' });
  expect(screen.getByRole('header', { name: 'Circle' })).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(screen).toHavePathname('/catalogue');
});
