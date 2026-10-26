import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  styleUrl: './about.css',
  templateUrl: './about.html',
})
export class About {
  // Most recent first. Official logos, unaltered, from public/logos. `scale` evens out heavy logos.
  protected readonly companies = [
    { name: 'Culture Amp', logo: 'logos/culture-amp.png' },
    { name: 'Coles', logo: 'logos/coles.svg' },
    { name: 'MYOB', logo: 'logos/myob.png' },
    { name: 'JB Hi-Fi', logo: 'logos/jb-hi-fi.png', scale: 0.8 },
    { name: 'UHG (Unified Healthcare Group)', logo: 'logos/uhg.svg' },
    { name: 'Racing Australia (formerly Racing Information Services Australia)', logo: 'logos/racing-australia.png' },
  ];

  // My own photos from public/photos, stripped of metadata (no location) and resized for the web.
  protected readonly photos = [
    { src: 'photos/half-marathon.webp', alt: 'Me waving to the camera mid-race at a half marathon' },
    { src: 'photos/lake-sunset.webp', alt: 'Sunset over a still lake, with a bench by the water' },
    { src: 'photos/mountain-view.webp', alt: 'View from a mountain top over a river winding through hills' },
    { src: 'photos/island-beach.webp', alt: 'Clear turquoise water by a white-sand island beach' },
  ];
}
