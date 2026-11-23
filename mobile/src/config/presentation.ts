import resource from '../../resources/app/presentation.json' with {type:'json'};
import {validatePresentation} from './presentationResource.ts';

/** Bundled author configuration, validated once; never edited through Settings. */
export const appPresentation = validatePresentation(resource);
