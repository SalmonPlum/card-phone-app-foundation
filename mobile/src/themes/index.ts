import resource from './resource.json';
import { validateThemeResource } from './validateThemeResource';

// The resource is the single source of available themes and the default.
export const themeResource = validateThemeResource(resource);
