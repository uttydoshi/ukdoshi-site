import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Hello {
  message: string;
}

@Component({
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  protected readonly hello = httpResource<Hello>(() => '/api/hello');
}
