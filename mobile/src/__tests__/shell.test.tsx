import { render, screen } from '@testing-library/react-native';

import { HomeShell } from '../app/index';

describe('HomeShell', () => {
  it('shows the home screen on launch', async () => {
    await render(<HomeShell />);

    expect(screen.getByTestId('home-screen')).toBeVisible();
  });
});
