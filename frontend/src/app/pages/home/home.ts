import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The landing page: a warm hello, a personal philosophy, and a way into About me. */
@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {}
