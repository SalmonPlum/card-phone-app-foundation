import {act,fireEvent,render,screen,within} from '@testing-library/react-native';
import {Linking} from 'react-native';
import {InfoScreen} from '../InfoScreen';
import {parseInfoMarkdown,type InfoPage} from '../../../info/markdown';
let mockLocale:'en'|'cs'='en';
let mockPage:InfoPage;
jest.mock('../../../i18n/useLocale',()=>({useLocale:()=>mockLocale}));
jest.mock('../../../info',()=>({get configuredInfoPage(){return mockPage;}}));
jest.mock('../../../navigation/useDockHeight',()=>({useDockHeight:()=>123}));
jest.mock('expo-router',()=>({Redirect:()=>null}));
const markdown=(label:string,title:string)=>parseInfoMarkdown(`---\nmenuLabel: ${label}\n---\n# ${title}\n\nHello **strong** and *gentle*.\n\n> Quoted words\n\n2. First\n3. Second\n\n---\n\n[Website](https://example.com) and [Email](mailto:hi@example.com)`);
beforeEach(()=>{jest.clearAllMocks();mockLocale='en';mockPage={en:markdown('About me','About me'),cs:markdown('O mně','O mně')};});
afterEach(()=>jest.restoreAllMocks());
test('renders native Markdown content with headings, lists and dock clearance in both locales',async()=>{
  const view=await render(<InfoScreen/>);
  expect(screen.getByRole('header',{name:'About me'})).toBeVisible();
  expect(screen.getByText('Quoted words')).toBeVisible();
  expect(screen.getByText('First')).toBeVisible();
  expect(screen.getByText('2.')).toBeVisible();
  expect(screen.getByTestId('info-scroll').props.contentContainerStyle).toEqual(expect.arrayContaining([expect.objectContaining({paddingBottom:147})]));
  mockLocale='cs';await view.rerender(<InfoScreen/>);
  expect(screen.getByRole('header',{name:'O mně'})).toBeVisible();
});
test('opens only allowlisted links and reports late failures in the currently selected language',async()=>{
  let reject!:(error:Error)=>void;
  const open=jest.spyOn(Linking,'openURL').mockImplementationOnce(()=>new Promise((_,no)=>{reject=no;})).mockResolvedValue();
  const view=await render(<InfoScreen/>);
  await fireEvent.press(screen.getByRole('link',{name:'Website'}));
  expect(open).toHaveBeenCalledWith('https://example.com');
  mockLocale='cs';await view.rerender(<InfoScreen/>);
  await act(()=>reject(new Error('native failure')));
  expect(within(screen.getByTestId('info-scroll')).queryByRole('alert')).toBeNull();
  expect(screen.getByRole('alert')).toHaveTextContent('Odkaz se nepodařilo otevřít. Zkuste to znovu.');
  await fireEvent.press(screen.getByRole('link',{name:'Email'}));
  expect(open).toHaveBeenLastCalledWith('mailto:hi@example.com');
  expect(screen.queryByRole('alert')).toBeNull();
});
test('unmount during link opening leaves no stale UI update',async()=>{
  let reject!:(error:Error)=>void;
  jest.spyOn(Linking,'openURL').mockImplementation(()=>new Promise((_,no)=>{reject=no;}));
  const view=await render(<InfoScreen/>);await fireEvent.press(screen.getByRole('link',{name:'Website'}));
  await view.unmount();await act(()=>reject(new Error('late failure')));
});
test('omitted resource has no visible information content',async()=>{
  mockPage=null;await render(<InfoScreen/>);expect(screen.queryByTestId('info-scroll')).toBeNull();
});
test('invalid generated destination is never launched',async()=>{
  const open=jest.spyOn(Linking,'openURL').mockResolvedValue();
  mockPage!.en.blocks=[{type:'paragraph',children:[{type:'link',url:'file:///tmp/a',children:[{type:'text',text:'Invalid'}]}]}];
  await render(<InfoScreen/>);await fireEvent.press(screen.getByRole('link',{name:'Invalid'}));
  expect(open).not.toHaveBeenCalled();expect(screen.getByRole('alert')).toHaveTextContent('Could not open the link. Please try again.');
});
