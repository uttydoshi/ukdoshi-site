import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

interface Me {
  email: string;
  name: string | null;
  approved: boolean;
  asked: boolean; // not approved, but has already clicked "Ask to join"
}

interface Tile {
  id: string;
  title: string;
}

// The tiles come from the API, never from this code: the site's code is public, the API isn't.
interface Welcome {
  message: string;
  tiles: Tile[];
}

// Sign-in is hidden from visitors until there's something to show inside. To bring it back, set this to
// true. (Anyone already signed in still sees the page as before.)
export const SIGN_IN_OPEN = false;

// Signing in only proves who the visitor is; the API decides whether they're approved.
@Component({
  selector: 'app-restricted',
  styleUrl: './restricted.css',
  templateUrl: './restricted.html',
})
export class Restricted {
  protected readonly auth = inject(AuthService);
  protected readonly signInOpen = SIGN_IN_OPEN;
  protected readonly me = httpResource<Me>(() => (this.auth.signedIn() ? '/api/me' : undefined));
  protected readonly welcome = httpResource<Welcome>(() =>
    this.me.value()?.approved ? '/api/restricted/welcome' : undefined,
  );
  protected readonly firstName = computed(() => this.me.value()?.name?.split(' ')[0] ?? null);
  protected readonly asking = signal<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  private readonly http = inject(HttpClient);

  /** Emails me their name and Google address; the API sends at most one email a day per person. */
  protected askToJoin(): void {
    this.asking.set('sending');
    this.http.post('/api/inner-circle/join-requests', {}).subscribe({
      next: () => this.asking.set('sent'),
      error: () => this.asking.set('failed'),
    });
  }

  protected signInAgain(): void {
    this.auth.clear();
    void this.auth.signIn();
  }
}
