import {act,fireEvent,render,screen} from '@testing-library/react-native';
import {LanguageProvider} from '../../../i18n/LanguageProvider';
import {RevealModeProvider} from '../../../settings/RevealModeProvider';
import {SettingsScreen} from '../SettingsScreen';
import type {LanguageStorage} from '../../../platform/languageStorage';
import {ThemeProvider} from '../../../themes/ThemeProvider';
import {themeResource} from '../../../themes';
const flush=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
function storage():LanguageStorage{return {read:jest.fn(async()=>null),write:jest.fn(async()=>{})};}
test('language and reveal choices remain selectable alongside resource theme choices',async()=>{
  const saved=storage();
  await render(<LanguageProvider storage={saved}><RevealModeProvider storage={{read:async()=>null,write:async()=>{}}}><SettingsScreen/></RevealModeProvider></LanguageProvider>);await flush();
  expect(screen.getByRole('radio',{name:'English'}).props.accessibilityState).toEqual({checked:true});
  expect(screen.getByRole('radio',{name:'Mystic Arbor'}).props.accessibilityState).toEqual({checked:true});
  expect(screen.getByRole('radio',{name:'Celestial Midnight'})).toBeVisible();
  expect(screen.queryByRole('switch')).toBeNull();
  await fireEvent.press(screen.getByRole('radio',{name:'Tap to flip'}));
  expect(screen.getByRole('radio',{name:'Tap to flip'}).props.accessibilityState).toEqual({checked:true});
  expect(saved.write).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await flush();
  expect(screen.queryByRole('header',{name:'Nastavení'})).toBeNull();
  expect(screen.getByRole('header',{name:'Jazyk'})).toBeVisible();
  expect(screen.getByRole('radio',{name:'Nebeská půlnoc'})).toBeVisible();
  expect(screen.getByRole('radio',{name:'Čeština'}).props.accessibilityState).toEqual({checked:true});
  await fireEvent.press(screen.getByRole('radio',{name:'English'}));await flush();
  expect(screen.queryByRole('header',{name:'Settings'})).toBeNull();
});
test('failed saving keeps the language selected and offers a localized retry',async()=>{
  const saved=storage();saved.write=jest.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue(undefined);
  await render(<LanguageProvider storage={saved}><RevealModeProvider storage={{read:async()=>null,write:async()=>{}}}><SettingsScreen/></RevealModeProvider></LanguageProvider>);await flush();
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await flush();
  expect(screen.getByRole('radio',{name:'Čeština'}).props.accessibilityState).toEqual({checked:true});
  expect(screen.getByRole('alert')).toHaveTextContent(/nepodařilo se ho uložit/);
  await fireEvent.press(screen.getByRole('button',{name:'Zkusit znovu'}));await flush();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(saved.write).toHaveBeenLastCalledWith('cs');
});

test('reveal mode saving failure keeps selection and offers a localized retry independently of language',async()=>{
 const saved={read:jest.fn(async()=>null),write:jest.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue(undefined)};
 await render(<LanguageProvider storage={storage()}><RevealModeProvider storage={saved}><SettingsScreen/></RevealModeProvider></LanguageProvider>);await flush();
 await fireEvent.press(screen.getByRole('radio',{name:'Tap to flip'}));await flush();
 expect(screen.getByRole('radio',{name:'Tap to flip'}).props.accessibilityState).toEqual({checked:true});
 expect(screen.getByRole('alert')).toHaveTextContent(/Reveal mode changed for now/);
 await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await flush();
 expect(screen.getByRole('alert')).toHaveTextContent(/Způsob odhalení byl změněn/);
 await fireEvent.press(screen.getByRole('button',{name:'Zkusit znovu'}));await flush();
 expect(saved.write).toHaveBeenLastCalledWith('manual');expect(screen.queryByRole('alert')).toBeNull();
});

test('theme changes screen and selected-control colors; save failure and localized retry stay independent',async()=>{
  const language=storage();
  const theme={read:jest.fn(async()=>null),write:jest.fn().mockRejectedValueOnce(new Error('offline storage')).mockResolvedValue(undefined)};
  await render(<ThemeProvider storage={theme}><LanguageProvider storage={language}><RevealModeProvider storage={{read:async()=>null,write:async()=>{}}}><SettingsScreen/></RevealModeProvider></LanguageProvider></ThemeProvider>);await flush();
  const host=screen.getByTestId('settings-screen');
  await fireEvent.press(screen.getByRole('radio',{name:'Celestial Midnight'}));await flush();
  expect(screen.getByTestId('settings-screen')).toBe(host);
  expect(host).toHaveStyle({backgroundColor:'#0d1322'});
  expect(screen.getByText('Celestial Midnight')).toHaveStyle({color:'#2a1700'});
  expect(screen.getByRole('radio',{name:'Celestial Midnight'})).toHaveStyle({backgroundColor:'#ffddb8'});
  expect(screen.getByRole('radio',{name:'English'})).toHaveStyle({backgroundColor:'#ffddb8'});
  expect(screen.getByRole('alert')).toHaveTextContent(/Theme changed for now/);
  expect(language.write).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await flush();
  expect(screen.getByRole('radio',{name:'Nebeská půlnoc'}).props.accessibilityState.checked).toBe(true);
  expect(screen.getByRole('alert')).toHaveTextContent(/Motiv byl změněn/);
  await fireEvent.press(screen.getByRole('button',{name:'Zkusit znovu'}));await flush();
  expect(theme.write).toHaveBeenLastCalledWith('celestial-midnight');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('Settings lists a separately supplied resource without hardcoded theme names',async()=>{
  const custom={...themeResource,defaultThemeId:'custom',themes:[{...themeResource.themes[2],id:'custom',name:{en:'My custom theme',cs:'Můj vlastní motiv'}}]};
  await render(<ThemeProvider resource={custom} storage={{read:async()=>null,write:async()=>{}}}><LanguageProvider storage={storage()}><SettingsScreen/></LanguageProvider></ThemeProvider>);await flush();
  expect(screen.getByRole('radio',{name:'My custom theme'}).props.accessibilityState.checked).toBe(true);
  expect(screen.queryByRole('radio',{name:'Mystic Arbor'})).toBeNull();
});
