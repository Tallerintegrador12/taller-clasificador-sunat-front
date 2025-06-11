import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-notificaciones-anteriores',
  imports: [],
  templateUrl: './notificaciones-anteriores.component.html',
  styleUrl: './notificaciones-anteriores.component.css'
})
export class NotificacionesAnterioresComponent {

  @Input() data: any;

}
