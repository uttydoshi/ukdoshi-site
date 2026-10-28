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

  it('explains why a box is there when it is tapped or focused', () => {
    const { fixture, root } = render();
    const explanation = root.querySelector('app-diagram .explanation')!;
    expect(explanation.textContent).toContain('Hover over or tap a box');

    const lambda = Array.from(root.querySelectorAll<SVGGElement>('svg.wide g.node')).find((g) =>
      g.textContent?.includes('Lambda'),
    )!;
    lambda.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    expect(explanation.textContent).toContain('Lambda:');
    expect(explanation.textContent).toContain('costs nothing while idle');
    expect(lambda.classList).toContain('selected');
  });
});
