const TOKEN_KEY = 'kynex_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}
