import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Restricted } from './pages/restricted/restricted';
import { Privacy } from './pages/privacy/privacy';
import { AuthCallback } from './pages/auth-callback/auth-callback';

export const routes: Routes = [
  { path: '', component: Home, title: 'ukdoshi.com' },
  { path: 'about', component: About, title: 'About me · ukdoshi.com' },
  { path: 'restricted', component: Restricted, title: 'Restricted Area · ukdoshi.com' },
  { path: 'privacy', component: Privacy, title: 'Privacy policy · ukdoshi.com' },
  { path: 'auth/callback', component: AuthCallback, title: 'Signing in · ukdoshi.com' },
  { path: '**', redirectTo: '' },
];
