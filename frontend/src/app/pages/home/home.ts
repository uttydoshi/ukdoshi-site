import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The landing page: a warm hello, a personal philosophy, and a way into About me. */
@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  // Words behind the portrait, in two groups beside my head: `left` words grow out from the photo's
  // left edge, `right` words from its right edge, so they never hide behind me. `top` is % of the
  // photo's height, `size` in rem (scaled down on phones).
  protected readonly words = [
    { text: 'Optimist', side: 'left', top: 6, size: 1.9, serif: true },
    { text: 'Husband', side: 'left', top: 17, size: 1.15 },
    { text: 'Dad', side: 'left', top: 24, size: 2.6, serif: true },
    { text: 'Runner', side: 'left', top: 40, size: 1.35 },
    { text: 'Curious mind', side: 'right', top: 3, size: 1.45, serif: true },
    { text: 'Hiker', side: 'right', top: 13, size: 1.2 },
    { text: 'Enabler', side: 'right', top: 22, size: 1.7, serif: true },
    { text: 'Nature lover', side: 'right', top: 34, size: 1.2 },
  ];
}
