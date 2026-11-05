import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';

jest.mock('../../../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

describe('auth screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the login form, required-field validation, and signup link', () => {
    const onShowSignup = jest.fn();
    render(<LoginScreen onShowSignup={onShowSignup} />);

    expect(screen.getByLabelText('WUnified')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();

    fireEvent.press(screen.getAllByText('Log in')[1]);
    expect(screen.getByText('Enter your email and password.')).toBeTruthy();

    fireEvent.press(screen.getByText('Create an account'));
    expect(onShowSignup).toHaveBeenCalledTimes(1);
  });

  it('keeps the signup fields, validation, and login link', () => {
    const onShowLogin = jest.fn();
    render(<SignupScreen onShowLogin={onShowLogin} />);

    expect(screen.getByLabelText('WUnified')).toBeTruthy();
    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();

    fireEvent.press(screen.getAllByText('Create account')[1]);
    expect(screen.getByText('Enter a username, email, and password.')).toBeTruthy();

    fireEvent.press(screen.getByText('I already have an account'));
    expect(onShowLogin).toHaveBeenCalledTimes(1);
  });

  it('preserves signup password length validation', () => {
    render(<SignupScreen onShowLogin={jest.fn()} />);
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'shocker');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'student@wichita.edu');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'short');

    fireEvent.press(screen.getAllByText('Create account')[1]);
    expect(screen.getByText('Password must be at least 6 characters.')).toBeTruthy();
  });
});
