import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUILD, IS_STAGING } from '../staging';

/** Every page's footer: a dark band with a tagline, link columns, the brand and copyright. */
@Component({
  imports: [DatePipe, RouterLink],
  selector: 'app-footer',
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly isStaging = IS_STAGING;
  protected readonly build = BUILD; // staging only: which version testers are looking at
  protected readonly year = new Date().getFullYear();
}
