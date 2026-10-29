import { TestBed } from '@angular/core/testing';
import { HowItsBuilt } from './how-its-built';

describe('HowItsBuilt', () => {
  function render() {
    const fixture = TestBed.createComponent(HowItsBuilt);
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('shows both diagrams, each with a wide and a phone layout', () => {
    const { root } = render();
    expect(root.querySelectorAll('app-diagram').length).toBe(2);
    expect(root.querySelectorAll('svg.wide').length).toBe(2);
    expect(root.querySelectorAll('svg.narrow').length).toBe(2);
  });

  it('explains every acronym in a glossary table, A to Z', () => {
    const { root } = render();
    const terms = Array.from(root.querySelectorAll('.glossary tbody th')).map((th) => th.firstChild?.textContent?.trim());
    expect(terms).toEqual([...terms].sort((a, b) => a!.localeCompare(b!)));
    for (const acronym of ['API', 'AWS', 'CDK', 'CDN', 'DNS', 'OIDC', 'S3']) {
      expect(terms).toContain(acronym);
    }
  });

  it('gives every decision an icon', () => {
    const { root } = render();
    const decisions = root.querySelectorAll('.decisions li');
    expect(decisions.length).toBe(8);
    decisions.forEach((li) => expect(li.querySelector('svg path')).not.toBeNull());
  });

  it('opens a card under an icon saying why it is there, and closes it with Escape', () => {
    const { fixture, root } = render();
    const diagram = root.querySelector('app-diagram')!;
    expect(diagram.querySelector('.hint')?.textContent).toContain('Hover over or tap an icon');
    expect(diagram.querySelector('.card')).toBeNull();

    const lambda = Array.from(diagram.querySelectorAll<SVGGElement>('svg.wide g.node')).find((g) =>
      g.textContent?.includes('Lambda'),
    )!;
    lambda.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    const card = diagram.querySelector('.card')!;
    expect(card.querySelector('h4')?.textContent).toBe('Lambda');
    expect(card.textContent).toContain('costs nothing while idle');
    expect(lambda.classList).toContain('selected');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(diagram.querySelector('.card')).toBeNull();
  });

});
