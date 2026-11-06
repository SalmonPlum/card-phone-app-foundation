// RNTL registers its native visibility/accessibility matchers on import.
import '@testing-library/react-native';

// Native preference I/O is isolated; app/provider behavior stays real in router tests.
jest.mock('./src/platform/languageStorage',()=>({
  languageStorage:{read:jest.fn(async()=>null),write:jest.fn(async()=>{})},
}));

jest.mock('./src/platform/revealModeStorage',()=>({
  revealModeStorage:{read:jest.fn(async()=>null),write:jest.fn(async()=>{})},
}));

jest.mock('./src/platform/themeStorage',()=>({
  themeStorage:{read:jest.fn(async()=>null),write:jest.fn(async()=>{})},
}));

// Only the native font loader is mocked; resource resolution and startup gating stay real.
jest.mock('./src/platform/themeFonts',()=>({loadThemeFonts:jest.fn(async()=>{})}));
