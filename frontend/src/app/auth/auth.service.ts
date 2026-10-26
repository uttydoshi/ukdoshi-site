import { computed, Injectable, signal } from '@angular/core';
import { IS_STAGING } from '../staging';

// Cognito's login page and the website's client, per copy of the site (from the UkdoshiAuth and
// UkdoshiStagingAuth stacks). Neither is secret. Anything else, like localhost, signs in to live.
const LIVE = { domain: 'https://auth.ukdoshi.com', clientId: '6kiv6va120pk34ud3isunm9lte' };
const STAGING = { domain: 'https://auth-staging.ukdoshi.com', clientId: 'mell2hvqapdr1dn2c3dtqht3d' };
const { domain: AUTH_DOMAIN, clientId: CLIENT_ID } = IS_STAGING ? STAGING : LIVE;
const SCOPES = 'openid email profile';

const TOKENS_KEY = 'auth.tokens';
const PENDING_KEY = 'auth.pending';

interface Tokens {
  idToken: string;
  refreshToken?: string;
  expiresAt: number; // ms since epoch
}

// What signIn() leaves for the callback page: proves the response answers our request.
interface PendingSignIn {
  state: string;
  verifier: string;
  returnTo: string;
}

/**
 * Sign-in with Cognito's login page, using the authorization-code flow with PKCE.
 *
 * 1. signIn() sends the browser to auth.ukdoshi.com with a one-time challenge.
 * 2. After Google or the emailed code, Cognito sends it back to /auth/callback with a code.
 * 3. completeSignIn() swaps that code (plus the challenge's secret half) for tokens.
 * The ID token is sent to our API, which checks it and decides what the visitor may see.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokens = signal<Tokens | null>(readJson<Tokens>(localStorage, TOKENS_KEY));
  private refreshing: Promise<string | null> | null = null;

  readonly signedIn = computed(() => this.tokens() !== null);

  async signIn(returnTo = location.pathname): Promise<void> {
    const pending: PendingSignIn = { state: randomString(), verifier: randomString(), returnTo };
    writeJson(sessionStorage, PENDING_KEY, pending);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: redirectUri(),
      scope: SCOPES,
      state: pending.state,
      code_challenge: await sha256Base64Url(pending.verifier),
      code_challenge_method: 'S256',
    });
    location.assign(`${AUTH_DOMAIN}/oauth2/authorize?${params}`);
  }

  /** Finishes sign-in on /auth/callback. Returns the page the visitor started from. */
  async completeSignIn(callbackUrl: URL): Promise<string> {
    const pending = readJson<PendingSignIn>(sessionStorage, PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);

    const params = callbackUrl.searchParams;
    if (params.has('error')) {
      throw new Error(params.get('error_description') ?? params.get('error')!);
    }
    const code = params.get('code');
    if (!pending || !code || params.get('state') !== pending.state) {
      throw new Error('This sign-in link is no longer valid. Please try again.');
    }

    this.store(
      await requestTokens({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri(),
        code_verifier: pending.verifier,
      }),
    );
    return pending.returnTo;
  }

  /** A valid ID token for API calls, refreshed when it's about to expire; null if signed out. */
  idToken(): Promise<string | null> {
    const tokens = this.tokens();
    if (!tokens) {
      return Promise.resolve(null);
    }
    if (Date.now() < tokens.expiresAt - 60_000) {
      return Promise.resolve(tokens.idToken);
    }
    // Several API calls may notice expiry at once; refresh only once.
    this.refreshing ??= this.refresh(tokens).finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  signOut(): void {
    const refreshToken = this.tokens()?.refreshToken;
    if (refreshToken) {
      // Best effort: stop the refresh token working anywhere else too.
      void fetch(`${AUTH_DOMAIN}/oauth2/revoke`, {
        method: 'POST',
        body: new URLSearchParams({ token: refreshToken, client_id: CLIENT_ID }),
        keepalive: true,
      }).catch(() => undefined);
    }
    this.clear();
    const params = new URLSearchParams({ client_id: CLIENT_ID, logout_uri: `${location.origin}/` });
    location.assign(`${AUTH_DOMAIN}/logout?${params}`);
  }

  /** Forget the tokens locally, e.g. when the API no longer accepts them. */
  clear(): void {
    this.tokens.set(null);
    try {
      localStorage.removeItem(TOKENS_KEY);
    } catch {
      // Storage blocked: nothing was saved.
    }
  }

  private async refresh(tokens: Tokens): Promise<string | null> {
    if (!tokens.refreshToken) {
      this.clear();
      return null;
    }
    try {
      const fresh = await requestTokens({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken });
      this.store({ ...fresh, refreshToken: fresh.refreshToken ?? tokens.refreshToken });
      return fresh.idToken;
    } catch {
      this.clear();
      return null;
    }
  }

  private store(tokens: Tokens): void {
    this.tokens.set(tokens);
    writeJson(localStorage, TOKENS_KEY, tokens);
  }
}

function redirectUri(): string {
  return `${location.origin}/auth/callback`;
}

async function requestTokens(body: Record<string, string>): Promise<Tokens> {
  const response = await fetch(`${AUTH_DOMAIN}/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({ ...body, client_id: CLIENT_ID }),
  });
  if (!response.ok) {
    throw new Error('Sign-in could not be completed. Please try again.');
  }
  const json = await response.json();
  return {
    idToken: json.id_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

function randomString(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

async function sha256Base64Url(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return base64Url(new Uint8Array(digest));
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (e.g. private mode): sign-in still works until the tab closes.
  }
}
