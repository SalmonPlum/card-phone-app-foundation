import {parseInfoMarkdown,type InfoPage} from '../markdown';

/** Stable examples for behavioral tests; authors may freely replace or omit real resources. */
export const infoFixture:NonNullable<InfoPage>={
  en:parseInfoMarkdown('---\nmenuLabel: About me\n---\n# About me\n\nA quiet space to pause, draw a card and reflect.'),
  cs:parseInfoMarkdown('---\nmenuLabel: O mně\n---\n# O mně\n\nKlidné místo, kde se můžete zastavit, vytáhnout si kartu a zamyslet se.'),
};
