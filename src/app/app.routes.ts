import { Routes } from '@angular/router';
import {NotificacionDetalleComponent} from './components/notificacion-detalle/notificacion-detalle.component';
import {EmailPanelComponent} from './components/email-panel/email-panel.component';
import {EmailClientComponent} from './components/email-client/email-client.component';
import {LoginComponent} from './components/login/login.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {AsistentePageComponent} from './components/asistente-page/asistente-page.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'email-client', component: EmailClientComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'asistente-virtual', component: AsistentePageComponent },
  { path: 'notificacion', component: EmailPanelComponent },
  { path: 'panel-email', component: EmailPanelComponent},
  { path: '**', redirectTo: '/login' }
];
