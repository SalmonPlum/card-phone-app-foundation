import {act,fireEvent,render,screen} from '@testing-library/react-native';
import {ThemeProvider,useThemeSettings} from '../../../themes/ThemeProvider';
import {themeResource} from '../../../themes';
import {Pressable,Text} from 'react-native';
import {ShuffleSurface} from '../ShuffleSurface';

function SurfaceWithChoice(){
 const {setTheme}=useThemeSettings();
 return <><ShuffleSurface/><Pressable accessibilityRole="button" onPress={()=>setTheme('solstice-ochre')}><Text>Change theme</Text></Pressable></>;
}
const storage={read:async()=>null,write:async()=>{}};
test('fabric is a noninteractive repeat image using resource intensity and stays mounted on theme changes',async()=>{
 await render(<ThemeProvider storage={storage}><SurfaceWithChoice/></ThemeProvider>);
 const image=screen.getByTestId('shuffle-fabric',{includeHiddenElements:true});
 const source=image.props.source;
 expect(image.props.resizeMode).toBe('repeat');expect(image.props.fadeDuration).toBe(0);
 expect(image).toHaveStyle({opacity:.26});
 expect(screen.getByTestId('shuffle-surface',{includeHiddenElements:true}).props.pointerEvents).toBe('none');
 expect(screen.queryByTestId('shuffle-fabric')).toBeNull();
 await fireEvent.press(screen.getByRole('button',{name:'Change theme'}));
 expect(screen.getByTestId('shuffle-fabric',{includeHiddenElements:true})).toBe(image);
 expect(image.props.source).toBe(source);expect(image).toHaveStyle({opacity:.24});
});

test('separately authored themes can omit or disable fabric without a component change',async()=>{
 const plain={...themeResource.themes[0]};Reflect.deleteProperty(plain,'shuffleSurface');
 const resource={...themeResource,defaultThemeId:plain.id,themes:[plain]};
 const view=await render(<ThemeProvider resource={resource} storage={storage}><ShuffleSurface/></ThemeProvider>);
 await act(async()=>{await Promise.resolve();});
 expect(screen.queryByTestId('shuffle-fabric',{includeHiddenElements:true})).toBeNull();
 await view.rerender(<ThemeProvider resource={{...resource,themes:[{...plain,shuffleSurface:{texture:'woven-linen',opacity:0}}]}} storage={storage}><ShuffleSurface/></ThemeProvider>);
 expect(screen.queryByTestId('shuffle-fabric',{includeHiddenElements:true})).toBeNull();
});
