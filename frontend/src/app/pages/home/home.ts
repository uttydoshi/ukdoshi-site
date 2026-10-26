import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { About } from '../about/about';

// The landing page: a short hello, then everything from About me underneath.
@Component({
  imports: [About, RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
