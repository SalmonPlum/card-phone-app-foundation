import {t} from '../../i18n/locale';
import {validatePresentation,type AppPresentation} from '../presentationResource';
let mockPresentation:AppPresentation;
jest.mock('../presentation',()=>({get appPresentation(){return mockPresentation;}}));
beforeEach(()=>{mockPresentation=validatePresentation({schemaVersion:1});});
test('translation falls back by key and interpolates bilingual overrides',()=>{
  mockPresentation=validatePresentation({schemaVersion:1,texts:{drawnCount:{en:'Reading: {count}',cs:'Výklad: {count}'},stop:{en:'Finish',cs:'Dokončit'}}});
  expect(t('stop','en')).toBe('Finish');expect(t('stop','cs')).toBe('Dokončit');
  expect(t('drawnCount','en',{count:3})).toBe('Reading: 3');
  expect(t('drawnCount','cs',{count:0})).toBe('Výklad: 0');
  expect(t('drawnCount','en')).toBe('Reading: {count}');
  expect(t('retry','en')).toBe('Try again');expect(t('retry','cs')).toBe('Zkusit znovu');
});
