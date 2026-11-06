export const WSU_EMAIL_HINT = 'Use your @wichita.edu email.';
export const WSU_SIGNUP_REJECTED = 'Sign up with your @wichita.edu email address.';

export function isWsuEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@wichita.edu');
}

// The database enforces the WSU domain (with an allowlist for test accounts), so the app
// doesn't block other domains itself. Depending on the Supabase Auth version, a rejection
// arrives either as our own message or as a generic "Database error saving new user".
export function getSignupErrorMessage(message: string, email: string): string {
  if (!isWsuEmail(email) && /database error saving new user/i.test(message)) {
    return WSU_SIGNUP_REJECTED;
  }
  return message;
}
