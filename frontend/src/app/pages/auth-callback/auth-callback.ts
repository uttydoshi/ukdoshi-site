import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/** Where Cognito sends the browser after sign-in: finish it, then return to where the visitor started. */
@Component({
  imports: [RouterLink],
  selector: 'app-auth-callback',
  template: `
    <section class="card">
      @if (error()) {
        <h1>Sign-in failed</h1>
        <p>{{ error() }}</p>
        <p><a routerLink="/restricted">Try again</a></p>
      } @else {
        <p>Signing you in…</p>
      }
    </section>
  `,
})
export class AuthCallback {
  protected readonly error = signal<string | null>(null);

  constructor() {
    const router = inject(Router);
    inject(AuthService)
      .completeSignIn(new URL(location.href))
      .then((returnTo) => router.navigateByUrl(returnTo, { replaceUrl: true }))
      .catch((error: Error) => this.error.set(error.message));
  }
}
