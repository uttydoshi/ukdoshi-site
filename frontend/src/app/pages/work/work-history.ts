import { Component, ElementRef, inject, signal } from '@angular/core';

interface Role {
  title: string;
  dates: string;
}

interface Company {
  name: string;
  years: string; // shown under the logo on the timeline
  note?: string;
  logo: string;
  scale?: number; // evens out heavy logos
  roles: Role[];
}

// Most recent first, from my CV (the timeline shows them oldest first). Official logos, unaltered, from public/logos.
const COMPANIES: Company[] = [
  {
    name: 'Culture Amp',
    years: '2021 – 2026',
    logo: 'logos/culture-amp.png',
    roles: [{ title: 'Engineering Manager', dates: 'Aug 2021 – Oct 2026' }],
  },
  {
    name: 'Coles Group',
    years: '2020 – 2021',
    logo: 'logos/coles.svg',
    roles: [{ title: 'Engineering Manager', dates: 'Oct 2020 – Aug 2021' }],
  },
  {
    name: 'MYOB',
    years: '2016 – 2020',
    logo: 'logos/myob.png',
    roles: [
      { title: 'Delivery Manager', dates: 'May 2020 – Sep 2020' },
      { title: 'Development Lead', dates: 'Aug 2017 – Apr 2020' },
      { title: 'Business Analyst', dates: 'Apr 2016 – Jul 2017' },
    ],
  },
  {
    name: 'JB Hi-Fi',
    years: '2015 – 2016',
    logo: 'logos/jb-hi-fi.png',
    scale: 0.8,
    roles: [{ title: 'Technical Business Analyst', dates: 'Nov 2015 – Apr 2016' }],
  },
  {
    name: 'UHG',
    years: '2013 – 2015',
    note: 'Unified Healthcare Group',
    logo: 'logos/uhg.svg',
    roles: [{ title: 'Business Analyst', dates: 'Oct 2013 – Nov 2015' }],
  },
  {
    name: 'Racing Australia',
    years: '2009 – 2013',
    note: 'then Racing Information Services Australia (RISA)',
    logo: 'logos/racing-australia.png',
    roles: [
      { title: 'Business Analyst', dates: 'Feb 2013 – Oct 2013' },
      { title: 'Senior Developer', dates: 'Dec 2009 – Feb 2013' },
    ],
  },
];

const CARD_WIDTH_PX = 352; // 22rem, kept in sync with work-history.css

/**
 * "Where I've worked" as a timeline: grey logos along a line, oldest on the left (top, on phones), each
 * with its years. Hovering (or tapping, or tabbing to) a logo colours it and opens a card with my roles there.
 */
@Component({
  selector: 'app-work-history',
  styleUrl: './work-history.css',
  templateUrl: './work-history.html',
  host: {
    '(mouseleave)': 'close()',
    '(document:click)': 'closeIfOutside($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class WorkHistory {
  protected readonly companies = [...COMPANIES].reverse(); // oldest first, like a timeline
  protected readonly open = signal<{
    company: Company;
    logo: HTMLElement;
    top: number;
    left: number;
    arrow: number;
  } | null>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Opens the card just under this logo, kept within the section's width, with its pointer at the logo. */
  protected show(company: Company, logo: HTMLElement): void {
    const box = this.host.nativeElement.getBoundingClientRect();
    const target = logo.getBoundingClientRect();
    const width = Math.min(CARD_WIDTH_PX, box.width);
    const centre = target.left + target.width / 2 - box.left;
    const left = Math.max(0, Math.min(centre - width / 2, box.width - width));
    this.open.set({ company, logo, top: target.bottom - box.top, left, arrow: centre - left });
  }

  protected close(): void {
    this.open.set(null);
  }

  protected closeIfOutside(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
