import { Component, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

interface Me {
  email: string;
  name: string | null;
  approved: boolean;
}

interface Welcome {
  message: string;
}

// Signing in only proves who the visitor is; the API decides whether they're approved.
@Component({
  selector: 'app-restricted',
  styleUrl: './restricted.css',
  templateUrl: './restricted.html',
})
export class Restricted {
  protected readonly auth = inject(AuthService);
  protected readonly me = httpResource<Me>(() => (this.auth.signedIn() ? '/api/me' : undefined));
  protected readonly welcome = httpResource<Welcome>(() =>
    this.me.value()?.approved ? '/api/restricted/welcome' : undefined,
  );

  protected signInAgain(): void {
    this.auth.clear();
    void this.auth.signIn();
  }
}
