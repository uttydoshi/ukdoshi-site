import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Placeholder: nothing is actually restricted until sign-in is added.
@Component({
  imports: [RouterLink],
  selector: 'app-restricted',
  styleUrl: './restricted.css',
  templateUrl: './restricted.html',
})
export class Restricted {}
