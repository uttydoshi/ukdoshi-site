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
    expect(root.textContent).toContain('Sign in with your Google account');
    root.querySelector<HTMLButtonElement>('.button')!.click();
    expect(auth.signIn).toHaveBeenCalled();
    http.expectNone('/api/me');
    expect(root.querySelector('.tiles')).toBeNull();
  });

  it('tells signed-in visitors who are not approved how to ask for access', async () => {
    signedIn.set(true);
    const { fixture, root, http } = render();
    http.expectOne('/api/me').flush({ email: 'stranger@example.com', name: null, approved: false });
    await settle(fixture);

    expect(root.textContent).toContain("you're not in the Inner Circle yet");
    expect(root.textContent).toContain('stranger@example.com');
    http.expectNone('/api/restricted/welcome');
  });

  it('shows restricted content to approved visitors', async () => {
    signedIn.set(true);
    const { fixture, root, http } = render();
    http.expectOne('/api/me').flush({ email: 'me@example.com', name: 'Me', approved: true });
    await settle(fixture);
    http.expectOne('/api/restricted/welcome').flush({
      message: 'Welcome to the Inner Circle, Me.',
      tiles: [
        { id: 'a', title: 'Tile A' },
        { id: 'b', title: 'Tile B' },
      ],
    });
    await settle(fixture);

    expect(root.querySelector('.welcome')?.textContent).toContain('Welcome to the Inner Circle, Me.');
    expect(Array.from(root.querySelectorAll('.tile h2')).map((h) => h.textContent)).toEqual(['Tile A', 'Tile B']);
    root.querySelector<HTMLButtonElement>('.link-button')!.click();
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('hides the tiles as soon as the visitor is signed out', async () => {
    signedIn.set(true);
    const { fixture, root, http } = render();
    http.expectOne('/api/me').flush({ email: 'me@example.com', name: 'Me', approved: true });
    await settle(fixture);
    http.expectOne('/api/restricted/welcome').flush({ message: 'Welcome', tiles: [{ id: 'a', title: 'Tile A' }] });
    await settle(fixture);
    expect(root.querySelector('.tiles')).not.toBeNull();

    signedIn.set(false);
    await settle(fixture);

    expect(root.querySelector('.tiles')).toBeNull();
    expect(root.textContent).not.toContain('Tile A');
    expect(root.textContent).toContain('Sign in with your Google account');
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
