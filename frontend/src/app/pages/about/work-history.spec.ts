import { TestBed } from '@angular/core/testing';
import { WorkHistory } from './work-history';

describe('WorkHistory', () => {
  function render() {
    const fixture = TestBed.createComponent(WorkHistory);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('shows each company once, oldest last', () => {
    const { root } = render();
    const names = Array.from(root.querySelectorAll('img')).map((img) => img.alt);
    expect(names).toEqual(['Culture Amp', 'Coles Group', 'MYOB', 'JB Hi-Fi', 'UHG', 'Racing Australia']);
  });

  it('opens a card with the roles at a company, and closes it with Escape', () => {
    const { fixture, root } = render();
    const myob = root.querySelector<HTMLButtonElement>('img[alt="MYOB"]')!.closest('button')!;
    myob.click();
    fixture.detectChanges();

    const card = root.querySelector('#work-card');
    expect(card?.querySelector('h4')?.textContent).toBe('MYOB');
    expect(card?.querySelectorAll('.roles li').length).toBe(3);
    expect(myob.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('#work-card')).toBeNull();
  });
});
