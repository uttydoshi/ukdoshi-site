import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  const auth = { idToken: vi.fn<() => Promise<string | null>>() };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
  });

  async function send(url: string) {
    const done = firstValueFrom(TestBed.inject(HttpClient).get(url));
    await Promise.resolve(); // let the interceptor await the token
    const request = TestBed.inject(HttpTestingController).expectOne(url);
    request.flush({});
    await done;
    return request.request;
  }

  it('adds the ID token to our API calls when signed in', async () => {
    auth.idToken.mockResolvedValue('the-token');
    expect((await send('/api/me')).headers.get('Authorization')).toBe('Bearer the-token');
  });

  it('sends API calls without a token when signed out', async () => {
    auth.idToken.mockResolvedValue(null);
    expect((await send('/api/hello')).headers.has('Authorization')).toBe(false);
  });

  it('never sends the token to other sites', async () => {
    auth.idToken.mockResolvedValue('the-token');
    expect((await send('https://example.com/api/me')).headers.has('Authorization')).toBe(false);
  });
});
