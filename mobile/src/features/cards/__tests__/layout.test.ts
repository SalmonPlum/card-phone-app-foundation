import { getGridColumns } from '../layout';

test.each([[360, 1, 2], [300, 1, 1], [360, 1.5, 1], [332, 1, 2], [331, 1, 1]])(
  'fits readable tiles at width %i and font scale %s', (width, scale, columns) => {
    expect(getGridColumns(width, scale)).toBe(columns);
  },
);
