import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Notificacion} from '../models/notificacion';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private apiUrl = 'https://sunatapi-arcehmesgqb2f8en.brazilsouth-01.azurewebsites.net/api/sunat/notificaciones';

  constructor(private http: HttpClient) {}

  obtenerNotificacion(codigoMensaje: string): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.apiUrl}/${codigoMensaje}`);
  }
}
