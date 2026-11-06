import {renderHook} from '@testing-library/react-native';
import {useLocale} from '../useLocale';

jest.mock('expo-localization',()=>({useLocales:()=>[{languageTag:'cs-CZ'}]}));
test('English is the initial app default even on a Czech phone',async()=>{
  const {result}=await renderHook(()=>useLocale());
  expect(result.current).toBe('en');
});
