import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Hello {
  message: string;
}

@Component({
  imports: [],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly hello = httpResource<Hello>(() => '/api/hello');
}
