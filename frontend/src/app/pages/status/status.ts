import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Hello {
  message: string;
}

// Not in the menu: a quick check that the site and its Python API are talking to each other.
@Component({
  selector: 'app-status',
  styleUrl: './status.css',
  templateUrl: './status.html',
})
export class Status {
  protected readonly hello = httpResource<Hello>(() => '/api/hello');
}
