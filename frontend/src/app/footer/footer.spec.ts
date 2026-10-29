import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

describe('Footer', () => {
  it('links to the main pages and shows this year’s copyright', async () => {
    await TestBed.configureTestingModule({ imports: [Footer], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const links = Array.from(root.querySelectorAll('.footer-links a')).map((a) => a.textContent?.trim());
    expect(links).toEqual(['About me', 'Inner Circle', 'How this site is built', 'Email', 'Privacy policy']);
    expect(root.querySelector('.copyright')?.textContent).toContain(`© ${new Date().getFullYear()} Utkarsh Doshi`);
    expect(root.querySelector('.build')).toBeNull(); // the staging version line only shows on staging
  });
});
