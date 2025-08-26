const tokenStore = { accessToken: null, refreshToken: null, expiresAt: 0, scope: null };


function setTokens({ access_token, refresh_token, expires_in, scope }) {
if (access_token) tokenStore.accessToken = access_token;
if (refresh_token) tokenStore.refreshToken = refresh_token;
if (typeof expires_in === 'number') tokenStore.expiresAt = Date.now() + (expires_in - 30) * 1000; // margen 30s
if (scope) tokenStore.scope = scope;
}
function getTokens() { return { ...tokenStore }; }
function getAccessToken() { return tokenStore.accessToken; }
function getRefreshToken() { return tokenStore.refreshToken; }
function isExpired() { return !tokenStore.accessToken || Date.now() >= tokenStore.expiresAt; }


module.exports = { setTokens, getTokens, getAccessToken, getRefreshToken, isExpired };