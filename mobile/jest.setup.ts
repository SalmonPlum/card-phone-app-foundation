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

jest.mock('./src/platform/textSizeStorage',()=>({
  textSizeStorage:{read:jest.fn(async()=>null),write:jest.fn(async()=>{})},
}));

// Only the native font loader is mocked; resource resolution and startup gating stay real.
jest.mock('./src/platform/themeFonts',()=>({loadThemeFonts:jest.fn(async()=>{})}));

// Native preference I/O only; haptics provider behavior stays real.
jest.mock('./src/platform/hapticsStorage',()=>({
  hapticsStorage:{read:jest.fn(async()=>null),write:jest.fn(async()=>{})},
}));

// Native reminder scheduling/I/O only; controller/provider and navigation remain real.
jest.mock('./src/platform/reminderStorage',()=>({reminderStorage:{read:jest.fn(async()=>null),write:jest.fn(async()=>{})}}));
jest.mock('./src/platform/localNotifications',()=>({
  localNotifications:{getPermission:jest.fn(async()=>({granted:true,canAskAgain:true})),requestPermission:jest.fn(async()=>({granted:true,canAskAgain:true})),cancelOwned:jest.fn(async()=>{}),schedule:jest.fn(async()=>{}),subscribeResponses:jest.fn(()=>()=>{}),getLastResponse:jest.fn(async()=>null),clearResponse:jest.fn(async()=>{})},
}));

// Native history I/O only; recording, archive and navigation stay real.
jest.mock('./src/platform/historyStorage',()=>({historyStorage:{read:jest.fn(async()=>null),write:jest.fn(async()=>{})}}));
