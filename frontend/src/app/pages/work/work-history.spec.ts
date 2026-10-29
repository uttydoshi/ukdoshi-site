import { TestBed } from '@angular/core/testing';
import { WorkHistory } from './work-history';

describe('WorkHistory', () => {
  function render() {
    const fixture = TestBed.createComponent(WorkHistory);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('shows a timeline of each company once, oldest first, with its years', () => {
    const { root } = render();
    const names = Array.from(root.querySelectorAll('img')).map((img) => img.alt);
    expect(names).toEqual(['Racing Australia', 'UHG', 'JB Hi-Fi', 'MYOB', 'Coles Group', 'Culture Amp']);
    expect(root.querySelector('.timeline li:last-child .years')?.textContent).toBe('2021 – 2026');
  });

  it('opens a card with the roles at a company, and closes it with Escape', () => {
    const { fixture, root } = render();
    const myob = root.querySelector<HTMLButtonElement>('img[alt="MYOB"]')!.closest('button')!;
    myob.click();
    fixture.detectChanges();

    const card = root.querySelector('#work-card');
    expect(card?.querySelector('h4')?.textContent).toBe('MYOB');
    expect(card?.querySelectorAll('.roles li').length).toBe(3);
    expect(card?.querySelector('.highlight')).toBeNull(); // roles and dates only; the detail lives in the cards above
    expect(myob.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('#work-card')).toBeNull();
  });
});
