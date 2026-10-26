import { TestBed } from '@angular/core/testing';
import { WorkHistory } from './work-history';

describe('WorkHistory', () => {
  function render() {
    const fixture = TestBed.createComponent(WorkHistory);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('repeats the logos for a seamless loop, hiding the copy from screen readers and the keyboard', () => {
    const { root } = render();
    const copies = root.querySelectorAll('li.copy');
    expect(copies.length).toBe(7); // six logos and the restart marker
    copies.forEach((li) => expect(li.getAttribute('aria-hidden')).toBe('true'));
    expect(root.querySelector('li.copy button')?.getAttribute('tabindex')).toBe('-1');
  });

  it('opens a card with the roles at a company, and closes it with Escape', () => {
    const { fixture, root } = render();
    const myob = root.querySelector<HTMLButtonElement>('li:not(.copy) img[alt="MYOB"]')!.closest('button')!;
    myob.click();
    fixture.detectChanges();

    const card = root.querySelector('#work-card');
    expect(card?.querySelector('h4')?.textContent).toBe('MYOB');
    expect(card?.querySelectorAll('.roles li').length).toBe(3);
    expect(myob.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('.track')?.classList).toContain('paused');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(root.querySelector('#work-card')).toBeNull();
  });
});
