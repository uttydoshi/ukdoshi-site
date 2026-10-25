import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../auth/auth.service';
import { Restricted } from './restricted';

describe('Restricted', () => {
  const signedIn = signal(false);
  const auth = { signedIn, signIn: vi.fn(), signOut: vi.fn(), clear: vi.fn() };

  beforeEach(async () => {
    signedIn.set(false);
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [Restricted],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: auth }],
    }).compileComponents();
  });

  // Doesn't wait for stability: the page stays busy until the test answers its API call.
  function render() {
    const fixture = TestBed.createComponent(Restricted);
    fixture.detectChanges();
    TestBed.tick();
    return { fixture, root: fixture.nativeElement as HTMLElement, http: TestBed.inject(HttpTestingController) };
  }

  // Lets the page react to an answered API call (it may start its next call, so no whenStable).
  async function settle(fixture: { detectChanges(): void }) {
    await Promise.resolve();
    TestBed.tick();
    fixture.detectChanges();
  }

  it('asks signed-out visitors to sign in, without calling the API', async () => {
    const { root, http } = render();
    expect(root.textContent).toContain('Sign in with Google or your email address');
    root.querySelector<HTMLButtonElement>('.button')!.click();
    expect(auth.signIn).toHaveBeenCalled();
    http.expectNone('/api/me');
  });

  it('tells signed-in visitors who are not approved how to ask for access', async () => {
    signedIn.set(true);
    const { fixture, root, http } = render();
    http.expectOne('/api/me').flush({ email: 'stranger@example.com', name: null, approved: false });
    await settle(fixture);

    expect(root.textContent).toContain("you don't have access yet");
    expect(root.textContent).toContain('stranger@example.com');
    http.expectNone('/api/restricted/welcome');
  });

  it('shows restricted content to approved visitors', async () => {
    signedIn.set(true);
    const { fixture, root, http } = render();
    http.expectOne('/api/me').flush({ email: 'me@example.com', name: 'Me', approved: true });
    await settle(fixture);
    http.expectOne('/api/restricted/welcome').flush({ message: 'Welcome to the Restricted Area, Me.' });
    await settle(fixture);

    expect(root.querySelector('.welcome')?.textContent).toContain('Welcome to the Restricted Area, Me.');
    root.querySelector<HTMLButtonElement>('.link-button')!.click();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('offers to sign in again when the API rejects the sign-in', async () => {
    signedIn.set(true);
    const { fixture, root, http } = render();
    http.expectOne('/api/me').flush({ detail: 'Sign-in expired or invalid' }, { status: 401, statusText: 'Unauthorized' });
    await settle(fixture);

    root.querySelector<HTMLButtonElement>('.button')!.click();
    expect(auth.clear).toHaveBeenCalled();
    expect(auth.signIn).toHaveBeenCalled();
  });
});
