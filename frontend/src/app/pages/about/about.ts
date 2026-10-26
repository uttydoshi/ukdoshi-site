import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  styleUrl: './about.css',
  templateUrl: './about.html',
})
export class About {
  // Most recent first. Official logos, unaltered, from public/logos.
  protected readonly companies = [
    { name: 'Culture Amp', logo: 'logos/culture-amp.png' },
    { name: 'Coles', logo: 'logos/coles.svg' },
    { name: 'MYOB', logo: 'logos/myob.png' },
    { name: 'JB Hi-Fi', logo: 'logos/jb-hi-fi.png' },
    { name: 'UHG (Unified Healthcare Group)', logo: 'logos/uhg.svg' },
    { name: 'Racing Australia (formerly Racing Information Services Australia)', logo: 'logos/racing-australia.png' },
  ];
}
