import { Component } from '@angular/core';

/** The person behind the work: family, what I do off the clock, and a few photos. */
@Component({
  selector: 'app-about',
  styleUrl: './about.css',
  templateUrl: './about.html',
})
export class About {
  // My own photos from public/photos, stripped of metadata (no location) and resized for the web.
  protected readonly photos = [
    { src: 'photos/half-marathon.webp', alt: 'Me waving to the camera mid-race at a half marathon' },
    { src: 'photos/toy-poodles.webp', alt: 'Our two curly, apricot toy poodles sitting side by side on a footpath' },
    { src: 'photos/lake-sunset.webp', alt: 'Sunset over a still lake, with a bench by the water' },
    { src: 'photos/mountain-view.webp', alt: 'View from a mountain top over a river winding through hills' },
    { src: 'photos/island-beach.webp', alt: 'Clear turquoise water by a white-sand island beach' },
  ];
}
