import {render,screen} from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import {ShuffleSurface} from '../ShuffleSurface';

// The preset's Image mock omits intrinsic asset-size styles. Exercise the real
// platform wrappers with a tile-sized source, as in the card geometry regressions.
jest.mock('../../../themes/shuffleTextureAssets',()=>({
  shuffleTextureAssets:{
    'woven-linen':{uri:'fabric.png',width:128,height:128},
    'checked-cloth':{uri:'checks.png',width:320,height:320},
  },
}));
const native=jest.requireActual('react-native') as {Image:unknown};
const implementations=[
  ['iOS',jest.requireActual('react-native/Libraries/Image/Image.ios').default],
  ['Android',jest.requireActual('react-native/Libraries/Image/Image.android').default],
] as const;

test.each(implementations)('%s repeat image fills its parent instead of retaining the tile-sized native view',async(_platform,Image)=>{
  const image=jest.spyOn(native,'Image','get').mockReturnValue(Image);
  try{
    await render(<ReactNative.View style={{width:360,height:540}}><ShuffleSurface/></ReactNative.View>);
    const fabric=screen.getByTestId('shuffle-fabric',{includeHiddenElements:true});
    const style=ReactNative.StyleSheet.flatten(fabric.props.style);
    expect(style.width).toBe('100%');expect(style.height).toBe('100%');
    expect(style.position).toBe('absolute');
    expect(fabric.props.source[0]).toMatchObject({width:320,height:320});
    expect(fabric.props.resizeMode).toBe('repeat');
  }finally{image.mockRestore();}
});
