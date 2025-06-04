import {Component, OnInit} from '@angular/core';
import {Notificacion} from '../../models/notificacion';
import {NotificacionService} from '../../services/notificacion.service';
import {ActivatedRoute} from '@angular/router';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-notificacion-detalle',
  imports: [
    NgIf,
    NgForOf
  ],
  templateUrl: './notificacion-detalle.component.html',
  styleUrl: './notificacion-detalle.component.css'
})
export class NotificacionDetalleComponent implements OnInit {
  notificacion?: Notificacion;

  constructor(
    private servicio: NotificacionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const codigo = this.route.snapshot.paramMap.get('codigoMensaje');
    if (codigo) {
      this.servicio.obtenerNotificacion(codigo).subscribe({
        next: (data) => (this.notificacion = data),
        error: (err) => console.error('Error al cargar notificación', err),
      });
    }
  }
}
