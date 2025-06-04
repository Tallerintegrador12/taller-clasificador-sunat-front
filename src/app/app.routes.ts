import { Routes } from '@angular/router';
import {NotificacionDetalleComponent} from './components/notificacion-detalle/notificacion-detalle.component';
import {EmailPanelComponent} from './components/email-panel/email-panel.component';
import {LoginComponent} from './components/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'notificacion', component: EmailPanelComponent },
  { path: 'panel-email', component: EmailPanelComponent},
  { path: '**', redirectTo: '/login' }

];
