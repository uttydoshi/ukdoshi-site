import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('welcomes visitors and invites them to get to know me', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain("Hi, I'm Utty.");
    expect(root.querySelector('.philosophy')?.textContent).toContain('leading with care, building with clarity');
    expect(root.querySelector('.button')?.getAttribute('href')).toBe('/about');
  });
});
