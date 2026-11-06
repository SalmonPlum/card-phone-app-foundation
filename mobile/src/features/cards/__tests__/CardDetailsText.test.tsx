import {ThemeProvider} from '../../../themes/ThemeProvider';
import {ThemeFontGate} from '../../../themes/ThemeFontGate';
import {themeResource} from '../../../themes';
import {render,screen} from '@testing-library/react-native';
import {templateFixture} from '../../../domain/__tests__/templateFixture';
import {CardDetailsText} from '../CardDetailsText';

test.each(['en','cs'] as const)('renders all deck headings and full paragraphs in template order in %s',async locale=>{
 const deck=templateFixture();
 await render(<CardDetailsText detailTemplate={deck.detailTemplate} card={deck.cards[0]} locale={locale}/>);
 expect(screen.getAllByRole('header').map(node=>node.props.children)).toEqual([deck.cards[0].translations[locale].name,...deck.detailTemplate.sections.map(section=>section.titles[locale])]);
 for(const section of deck.detailTemplate.sections) {
  const body=screen.getByText(deck.cards[0].translations[locale].sections[section.id]);
  expect(body).toBeVisible();expect(body.props.numberOfLines).toBeUndefined();
 }
});
test('uses each supplied deck template and updates titles/content with locale without a fixed section fallback',async()=>{
 const deck=templateFixture();
 const view=await render(<CardDetailsText detailTemplate={deck.detailTemplate} card={deck.cards[0]} locale="en" includeName={false}/>);
 expect(screen.queryByText('Meaning')).toBeNull();
 await view.rerender(<CardDetailsText detailTemplate={{sections:[deck.detailTemplate.sections[2],deck.detailTemplate.sections[0]]}} card={deck.cards[0]} locale="cs" includeName={false}/>);
 expect(screen.getAllByRole('header').map(node=>node.props.children)).toEqual(['Souvislosti','Zamyšlení']);
 expect(screen.queryByText('English context.')).toBeNull();
});

test.each([
 ['mystic-arbor','Theme_EBGaramond_500','Theme_EBGaramond_500','Theme_DMSans_400',32,22,16],
 ['celestial-midnight','Theme_NotoSerif_400','Theme_NotoSerif_500','Theme_Manrope_400',32,22,18],
 ['solstice-ochre','Theme_Literata_600','Theme_Literata_500','Theme_PlusJakartaSans_400',38,20,18],
] as const)('uses distinct resource title/section/body roles in %s without truncating text',async(id,titleFont,headingFont,bodyFont,titleSize,headingSize,bodySize)=>{
 const deck=templateFixture();
 await render(<ThemeProvider resource={{...themeResource,defaultThemeId:id}} storage={{read:async()=>id,write:async()=>{}}}>
  <ThemeFontGate loadFonts={async()=>{}}><CardDetailsText detailTemplate={deck.detailTemplate} card={deck.cards[0]} locale="cs"/></ThemeFontGate>
 </ThemeProvider>);
 const title=screen.getByRole('header',{name:deck.cards[0].translations.cs.name});
 const heading=screen.getByRole('header',{name:deck.detailTemplate.sections[0].titles.cs});
 const body=screen.getByText(deck.cards[0].translations.cs.sections.reflection);
 expect(title).toHaveStyle({fontFamily:titleFont,fontSize:titleSize});
 expect(heading).toHaveStyle({fontFamily:headingFont,fontSize:headingSize});
 expect(body).toHaveStyle({fontFamily:bodyFont,fontSize:bodySize});
 for(const node of [title,heading,body]){
  expect(node.props.numberOfLines).toBeUndefined();
  expect(node.props.allowFontScaling).not.toBe(false);
 }
});
