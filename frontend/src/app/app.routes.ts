import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Restricted } from './pages/restricted/restricted';

export const routes: Routes = [
  { path: '', component: Home, title: 'ukdoshi.com' },
  { path: 'about', component: About, title: 'About me · ukdoshi.com' },
  { path: 'restricted', component: Restricted, title: 'Restricted Area · ukdoshi.com' },
  { path: '**', redirectTo: '' },
];
