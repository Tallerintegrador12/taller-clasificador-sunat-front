import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Notificacion} from '../models/notificacion';
import {environment} from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obtenerNotificacion(codigoMensaje: string): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.apiUrl}/sunat/notificaciones/${codigoMensaje}`);
  }
}
