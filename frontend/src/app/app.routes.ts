import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Restricted } from './pages/restricted/restricted';
import { Privacy } from './pages/privacy/privacy';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { Status } from './pages/status/status';

export const routes: Routes = [
  { path: '', component: Home, title: 'Utty Doshi · ukdoshi.com' },
  { path: 'about', redirectTo: '' }, // About me now lives on the home page
  { path: 'inner-circle', component: Restricted, title: 'Inner Circle · ukdoshi.com' },
  { path: 'restricted', redirectTo: 'inner-circle' }, // the page's old address
  { path: 'privacy', component: Privacy, title: 'Privacy policy · ukdoshi.com' },
  { path: 'status', component: Status, title: 'Status · ukdoshi.com' },
  { path: 'auth/callback', component: AuthCallback, title: 'Signing in · ukdoshi.com' },
  { path: '**', redirectTo: '' },
];
