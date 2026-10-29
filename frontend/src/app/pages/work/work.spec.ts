import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Work } from './work';

describe('Work', () => {
  it('puts what I delivered first, then how I work, where, and how to get in touch', async () => {
    await TestBed.configureTestingModule({ imports: [Work], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(Work);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const sections = Array.from(root.querySelectorAll('.section > h2')).map((h) => h.textContent?.trim());
    expect(sections).toEqual(["What I've delivered", 'How I work', "Where I've worked"]);

    const companies = Array.from(root.querySelectorAll('.outcomes .logo')).map((img) => img.getAttribute('alt'));
    expect(companies).toEqual(['Culture Amp', 'Coles Group', 'MYOB']);
    expect(root.querySelector('.outcomes')?.textContent).not.toMatch(/\d+\s*%|\$\d/); // no numbers, by choice

    expect(root.querySelector('.talk a[href^="https://www.linkedin.com"]')).not.toBeNull();
    expect(root.querySelector('.talk a[href^="mailto:"]')).toBeNull(); // LinkedIn only, by choice
  });
});
