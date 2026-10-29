import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The landing page: a warm hello, a personal philosophy, and two doors: Work (for recruiters) and About me. */
@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  // Words behind the portrait, scattered just outside my outline (measured from the cut-out photo).
  // `top` and `x` are % of the photo's box; `left` words end at x (they grow away from me), `right`
  // words start at it. Size in rem (scaled down on phones), tilt in degrees.
  protected readonly words = [
    { text: 'Curious mind', side: 'right', x: 69, top: 1, size: 1.45, serif: true, tilt: -3 },
    { text: 'Optimist', side: 'left', x: 42, top: 3, size: 1.75, serif: true },
    { text: 'Hiker', side: 'right', x: 84, top: 12, size: 1.15, tilt: 2 },
    { text: 'Listener', side: 'left', x: 37, top: 15, size: 2.1, serif: true },
    { text: 'Coffee fan', side: 'right', x: 84, top: 24, size: 1.4, serif: true },
    { text: 'Runner', side: 'left', x: 40, top: 31, size: 1.2, tilt: -2 },
    { text: 'Nature lover', side: 'right', x: 78.5, top: 39, size: 1.2 },
    { text: 'Husband', side: 'left', x: 42, top: 43, size: 1.1, tilt: 2 },
    { text: 'Podcast lover', side: 'left', x: 33, top: 52, size: 1.1, serif: true, tilt: -2 },
  ];
}
