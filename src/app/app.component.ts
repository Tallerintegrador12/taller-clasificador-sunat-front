import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {EmailClientComponent} from './components/email-client/email-client.component';
import {EmailPanelComponent} from './components/email-panel/email-panel.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'notificador-sunat-front';
}
