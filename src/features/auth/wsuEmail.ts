export const WSU_EMAIL_HINT = 'Use your WSU email (@wichita.edu or @shockers.wichita.edu).';
export const WSU_SIGNUP_REJECTED =
  'Sign up with your WSU email (@wichita.edu or @shockers.wichita.edu).';

// Matches is_wsu_email in the WSU verification gate migration.
const WSU_EMAIL_DOMAINS = ['wichita.edu', 'shockers.wichita.edu'];

export function isWsuEmail(email: string): boolean {
  const [, domain, ...rest] = email.trim().toLowerCase().split('@');
  return rest.length === 0 && domain !== undefined && WSU_EMAIL_DOMAINS.includes(domain);
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
