import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { App, DARK_MODE_ENABLED } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
    })
      .compileComponents();
  });

  function setup() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const menuButton = root.querySelector<HTMLButtonElement>('.menu-button')!;
    const panel = root.querySelector<HTMLElement>('.site-nav')!;
    return { fixture, root, menuButton, panel };
  }

  it.skipIf(DARK_MODE_ENABLED)('should hide the theme toggle while dark mode is switched off', () => {
    const { root } = setup();
    expect(root.querySelector('.theme-toggle')).toBeNull();
  });

  it.skipIf(!DARK_MODE_ENABLED)('should toggle the theme and remember the choice', () => {
    document.documentElement.dataset['theme'] = 'light';
    localStorage.removeItem('theme');
    const { fixture, root } = setup();
    const button = root.querySelector<HTMLButtonElement>('.theme-toggle')!;
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');

    button.click();
    fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');

    button.click();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should list the pages in the menu', () => {
    const { panel } = setup();
    const links = Array.from(panel.querySelectorAll('a')).map((a) => [a.textContent?.trim(), a.getAttribute('href')]);
    expect(links).toEqual([
      ['About me', '/about'],
      ['Inner Circle', '/inner-circle'],
    ]);
  });

  it('should open and close the menu with its button', () => {
    const { fixture, menuButton, panel } = setup();
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');

    menuButton.click();
    fixture.detectChanges();
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList).toContain('open');

    menuButton.click();
    fixture.detectChanges();
    expect(panel.classList).not.toContain('open');
  });

  it('should close the menu on Escape and on a click outside it', () => {
    const { fixture, root, menuButton, panel } = setup();

    menuButton.click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(panel.classList).not.toContain('open');

    menuButton.click();
    fixture.detectChanges();
    root.querySelector<HTMLElement>('footer')!.click();
    fixture.detectChanges();
    expect(panel.classList).not.toContain('open');
  });

  it('should close the menu after navigating', async () => {
    const { fixture, menuButton, panel } = setup();
    menuButton.click();
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/about');
    fixture.detectChanges();
    expect(panel.classList).not.toContain('open');
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('About me');
  });
});
