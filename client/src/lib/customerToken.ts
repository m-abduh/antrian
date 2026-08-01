const TOKEN_KEY = 'tunggu-customer-token';
const TOKEN_MAX_AGE = 365 * 24 * 60 * 60;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

export function getCustomerToken(): string | null {
  return getCookie(TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  setCookie(TOKEN_KEY, token, TOKEN_MAX_AGE);
}
