import { Component, ElementRef, inject, signal } from '@angular/core';

interface Role {
  title: string;
  dates: string;
}

interface Company {
  name: string;
  years: string; // shown under the logo, so the strip reads as a timeline
  note?: string;
  logo: string;
  scale?: number; // evens out heavy logos
  roles: Role[];
  highlight?: string;
}

// Most recent first, from my CV. Official logos, unaltered, from public/logos.
const COMPANIES: Company[] = [
  {
    name: 'Culture Amp',
    years: '2021 – 2026',
    logo: 'logos/culture-amp.png',
    roles: [{ title: 'Engineering Manager', dates: 'Aug 2021 – Oct 2026' }],
    highlight:
      'Led the team that built and ran Culture Amp’s AI Platform, so product teams could ship AI features ' +
      'quickly and safely: an LLM gateway, tracing, model evaluation and de-identification of customer data.',
  },
  {
    name: 'Coles Group',
    years: '2020 – 2021',
    logo: 'logos/coles.svg',
    roles: [{ title: 'Engineering Manager', dates: 'Oct 2020 – Aug 2021' }],
    highlight:
      'Built the Enterprise Services team from scratch and launched Coles’ first cloud-based file transfer ' +
      'service for its suppliers.',
  },
  {
    name: 'MYOB',
    years: '2016 – 2020',
    logo: 'logos/myob.png',
    roles: [
      { title: 'Delivery Manager', dates: 'May – Sep 2020' },
      { title: 'Development Lead', dates: 'Aug 2017 – Apr 2020' },
      { title: 'Business Analyst', dates: 'Apr 2016 – Jul 2017' },
    ],
    highlight:
      'Led DevOps and developer experience across MYOB: rolled out a new CI/CD platform, brought AWS costs ' +
      'down and gave teams a secure, friction-free path to production.',
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
      { title: 'Business Analyst', dates: 'Feb – Oct 2013' },
      { title: 'Senior Developer', dates: 'Dec 2009 – Feb 2013' },
    ],
  },
];

const CARD_WIDTH_PX = 352; // 22rem, kept in sync with work-history.css

/**
 * "Where I've worked": grey logos scrolling right to left. Hovering (or tapping, or tabbing to) a logo
 * stops the strip, colours the logo and opens a card with my roles there.
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
  protected readonly companies = COMPANIES;
  // The strip holds two copies of the logos so it can loop seamlessly; only the first is interactive.
  protected readonly copies = [0, 1];
  protected readonly open = signal<{ company: Company; logo: HTMLElement; left: number; arrow: number } | null>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Opens the card under this logo, kept within the section's width, with its pointer at the logo. */
  protected show(company: Company, logo: HTMLElement): void {
    const box = this.host.nativeElement.getBoundingClientRect();
    const target = logo.getBoundingClientRect();
    const width = Math.min(CARD_WIDTH_PX, box.width);
    const centre = target.left + target.width / 2 - box.left;
    const left = Math.max(0, Math.min(centre - width / 2, box.width - width));
    this.open.set({ company, logo, left, arrow: centre - left });
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
