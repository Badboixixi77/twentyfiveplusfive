import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Pomodoro Clock main heading', () => {
  render(<App />);
  const heading = screen.getByText(/25 \+ 5 Clock/i);
  expect(heading).toBeInTheDocument();
});
