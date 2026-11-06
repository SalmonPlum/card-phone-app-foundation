import {act,fireEvent,render,screen,within} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {BottomTabBarHeightContext} from 'expo-router/js-tabs';
import {LanguageProvider} from '../../../i18n/LanguageProvider';
import {RevealModeProvider} from '../../../settings/RevealModeProvider';
import {SettingsScreen} from '../SettingsScreen';
import type {LanguageStorage} from '../../../platform/languageStorage';
import {ThemeProvider} from '../../../themes/ThemeProvider';
import {themeResource} from '../../../themes';
import {TextSizeProvider} from '../../../settings/TextSizeProvider';
const flush=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
async function changeTextSize(target:number) {
  const current=screen.getByRole('adjustable').props.accessibilityValue.now as number;
  for(let step=0;step<Math.abs(target-current);step++) {
    await fireEvent(screen.getByRole('adjustable'),'accessibilityAction',{nativeEvent:{actionName:target>current?'increment':'decrement'}});
  }
}

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

const native = jest.requireActual('react-native') as typeof import('react-native');

test.each([
  {width:390,fontScale:1,direction:'row'},
  {width:320,fontScale:1,direction:'column'},
  {width:390,fontScale:1.6,direction:'column'},
] as const)('binary settings adapt at $width dp and font scale $fontScale',async({width,fontScale,direction})=>{
  const dimensions=jest.spyOn(native,'useWindowDimensions').mockReturnValue({width,height:800,scale:3,fontScale});
  try {
    await render(<LanguageProvider storage={storage()}><RevealModeProvider><SettingsScreen/></RevealModeProvider></LanguageProvider>);
    await flush();
    for(const name of ['Language','Card reveal']) {
      const group=screen.getByLabelText(name);
      expect(group).toHaveStyle({flexDirection:direction});
      const choices=within(group).getAllByRole('radio');
      expect(choices).toHaveLength(2);
      for(const choice of choices) expect(choice).toHaveStyle({minHeight:48});
    }
    await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));
    await flush();
    expect(screen.getByRole('radio',{name:'Otočit klepnutím'})).toBeVisible();
    const label=screen.getByText('Otočit klepnutím');
    expect(label.props.numberOfLines).toBeUndefined();
    expect(label.props.allowFontScaling).not.toBe(false);
  } finally {
    dimensions.mockRestore();
  }
});

test('custom theme previews keep their candidate colors when the active theme changes',async()=>{
  const name='A separately authored theme with a long name that must wrap';
  const candidate={...themeResource.themes[0],id:'custom',name:{en:name,cs:'Vlastní dlouhý název motivu'},
    colors:{...themeResource.themes[0].colors,canvas:'#fafafa',primary:'#123456',accent:'#654321',mat:'#234567'}};
  const custom={...themeResource,defaultThemeId:'custom',themes:[candidate,themeResource.themes[1]]};
  await render(<ThemeProvider resource={custom} storage={{read:async()=>null,write:async()=>{}}}><LanguageProvider storage={storage()}><SettingsScreen/></LanguageProvider></ThemeProvider>);
  await flush();
  const preview=screen.getByTestId('theme-preview-custom',{includeHiddenElements:true});
  expect(preview.props.accessibilityElementsHidden).toBe(true);
  expect(preview.props.importantForAccessibility).toBe('no-hide-descendants');
  expect(within(preview).getAllByTestId(/^theme-swatch-/,{includeHiddenElements:true})).toHaveLength(4);
  for(const role of ['canvas','primary','accent','mat'] as const) {
    expect(within(preview).getByTestId(`theme-swatch-${role}`,{includeHiddenElements:true})).toHaveStyle({backgroundColor:candidate.colors[role]});
  }
  await fireEvent.press(screen.getByRole('radio',{name:'Celestial Midnight'}));
  await flush();
  expect(screen.getByTestId('theme-preview-custom',{includeHiddenElements:true})).toBe(preview);
  expect(within(preview).getByTestId('theme-swatch-primary',{includeHiddenElements:true})).toHaveStyle({backgroundColor:'#123456'});
  expect(screen.getByText(name).props.numberOfLines).toBeUndefined();
  expect(screen.getAllByRole('radio')).toHaveLength(6);
});

test('Settings keeps scroll-end clearance for a tall floating dock',async()=>{
  await render(<BottomTabBarHeightContext.Provider value={146}><LanguageProvider storage={storage()}><SettingsScreen/></LanguageProvider></BottomTabBarHeightContext.Provider>);
  await flush();
  let scroll=screen.getByText('Language').parent;
  while(scroll && scroll.type!=='RCTScrollView') scroll=scroll.parent;
  expect(scroll).not.toBeNull();
  const content=StyleSheet.flatten(scroll!.props.contentContainerStyle);
  expect(content.paddingBottom).toBeGreaterThanOrEqual(146+24);
  expect(StyleSheet.flatten(screen.getByTestId('settings-screen').props.style).paddingBottom).toBeUndefined();
});

test('size choices update all Settings text and retain selection through theme/language changes',async()=>{
  const sizeStorage={read:async()=>null,write:jest.fn(async()=>{})};
  await render(<ThemeProvider><TextSizeProvider storage={sizeStorage}><LanguageProvider storage={storage()}><SettingsScreen/></LanguageProvider></TextSizeProvider></ThemeProvider>);
  await flush();
  expect(screen.getByRole('adjustable').props.accessibilityValue.now).toBe(1);
  await changeTextSize(2);await flush();
  expect(screen.getByText('English')).toHaveStyle({fontSize:13*1.15});
  expect(screen.getByRole('header',{name:'Font size'})).toHaveStyle({fontSize:22*1.15});
  await fireEvent.press(screen.getByRole('radio',{name:'Celestial Midnight'}));await flush();
  expect(screen.getByRole('adjustable').props.accessibilityValue.now).toBe(2);
  expect(screen.getByText('English')).toHaveStyle({fontSize:13.48*1.15});
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await flush();
  expect(screen.getByRole('header',{name:'Velikost písma'})).toBeVisible();
  expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Velká');
  expect(screen.getByRole('adjustable')).toHaveStyle({minHeight:48});
  await changeTextSize(0);await flush();
  expect(screen.getByText('English')).toHaveStyle({fontSize:13.48*.9});
  expect(sizeStorage.write).toHaveBeenLastCalledWith('small');
});

test('text size save failure remains local and retry uses the current selection after language changes',async()=>{
  const sizeStorage={read:async()=>null,write:jest.fn().mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue(undefined)};
  await render(<TextSizeProvider storage={sizeStorage}><LanguageProvider storage={storage()}><SettingsScreen/></LanguageProvider></TextSizeProvider>);
  await flush();
  await changeTextSize(2);await flush();
  expect(screen.getByRole('alert')).toHaveTextContent(/Text size changed for now/);
  await fireEvent.press(screen.getByRole('radio',{name:'Čeština'}));await flush();
  expect(screen.getByRole('alert')).toHaveTextContent(/Velikost písma byla změněna/);
  expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Velká');
  await fireEvent.press(screen.getByRole('button',{name:'Zkusit znovu'}));await flush();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(sizeStorage.write).toHaveBeenLastCalledWith('large');
});

test('combined app and OS text scaling stacks controls while Standard keeps the accepted row layout',async()=>{
  const dimensions=jest.spyOn(native,'useWindowDimensions').mockReturnValue({width:390,height:800,scale:3,fontScale:1.2});
  try {
    await render(<TextSizeProvider><LanguageProvider storage={storage()}><SettingsScreen/></LanguageProvider></TextSizeProvider>);await flush();
    expect(screen.getByLabelText('Language')).toHaveStyle({flexDirection:'row'});
    await changeTextSize(2);await flush();
    expect(screen.getByLabelText('Language')).toHaveStyle({flexDirection:'column'});
    expect(screen.getByRole('adjustable').props.accessibilityValue.now).toBe(2);
  } finally {dimensions.mockRestore();}
});
