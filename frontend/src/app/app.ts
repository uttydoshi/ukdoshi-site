import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

// Dark mode is switched off for now: the site is always light and the toggle is hidden.
// To bring it back, set this to true AND DARK_MODE_ENABLED in src/index.html.
export const DARK_MODE_ENABLED = false;

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
    '(document:click)': 'closeMenuIfOutside($event)',
  },
})
export class App {
  protected readonly darkModeEnabled = DARK_MODE_ENABLED;
  protected readonly menuOpen = signal(false);
  private readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');

  // index.html sets data-theme before Angular starts; this keeps the button in sync with it.
  protected readonly theme = signal<Theme>(
    document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light',
  );

  constructor() {
    // Close the menu on any navigation, including the browser's back button.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenu());

    if (!DARK_MODE_ENABLED) {
      return;
    }

    // Until the visitor picks a theme, follow the device when its setting changes.
    const deviceDark = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onDeviceChange = (event: MediaQueryListEvent) => {
      if (!readSavedTheme()) {
        this.applyTheme(event.matches ? 'dark' : 'light');
      }
    };
    deviceDark?.addEventListener('change', onDeviceChange);
    inject(DestroyRef).onDestroy(() => deviceDark?.removeEventListener('change', onDeviceChange));
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected closeMenuIfOutside(event: Event): void {
    if (!this.menu().nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  protected toggleTheme(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked (e.g. private mode): the toggle still works for this visit.
    }
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.dataset['theme'] = theme;
    this.theme.set(theme);
  }
}

function readSavedTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}
