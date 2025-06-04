// services/mail.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import {Etiqueta, MensajeSunat, RespuestaControlador} from '../models/mesage-sunat';



@Injectable({
  providedIn: 'root'
})
export class MailService {
  private apiUrl = 'https://sunatapi-arcehmesgqb2f8en.brazilsouth-01.azurewebsites.net//api';

  // Observables para estado reactivo
  private mensajesSubject = new BehaviorSubject<MensajeSunat[]>([]);
  private etiquetasSubject = new BehaviorSubject<Etiqueta[]>([]);

  public mensajes$ = this.mensajesSubject.asObservable();
  public etiquetas$ = this.etiquetasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Métodos para Mensajes
  obtenerMensajes(): Observable<RespuestaControlador<MensajeSunat[]>> {
    return this.http.get<RespuestaControlador<MensajeSunat[]>>(`${this.apiUrl}/sunat/mensajes`);
  }

  obtenerMensajesPaginados(pagina: number = 0, cantidad: number = 10): Observable<RespuestaControlador<any>> {
    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('cantidad', cantidad.toString());

    return this.http.get<RespuestaControlador<any>>(`${this.apiUrl}/sunat/mensajes/paginados`, { params });
  }

  obtenerMensajesPorEtiqueta(etiqueta: string): Observable<RespuestaControlador<MensajeSunat[]>> {
    return this.http.get<RespuestaControlador<MensajeSunat[]>>(`${this.apiUrl}/sunat/mensajes/etiqueta/${etiqueta}`);
  }

  obtenerMensajesPorEtiquetaPaginados(
    etiqueta: string,
    pagina: number = 0,
    cantidad: number = 10
  ): Observable<RespuestaControlador<any>> {
    const params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('cantidad', cantidad.toString());

    return this.http.get<RespuestaControlador<any>>(`${this.apiUrl}/sunat/mensajes/etiqueta/${etiqueta}/paginados`, { params });
  }

  sincronizarMensajes(): Observable<RespuestaControlador<string>> {
    return this.http.get<RespuestaControlador<string>>(`${this.apiUrl}/sunat/sincronizar`);
  }

  // Métodos para actualizar propiedades de mensajes
  actualizarUrgente(id: number, urgente: number): Observable<RespuestaControlador<MensajeSunat>> {
    const params = new HttpParams().set('urgente', urgente.toString());
    return this.http.put<RespuestaControlador<MensajeSunat>>(`${this.apiUrl}/sunat/mensajes/${id}/urgente`, {}, { params });
  }

  actualizarLeido(id: number, leido: number): Observable<RespuestaControlador<MensajeSunat>> {
    const params = new HttpParams().set('leido', leido.toString());
    return this.http.put<RespuestaControlador<MensajeSunat>>(`${this.apiUrl}/sunat/mensajes/${id}/leido`, {}, { params });
  }

  actualizarEtiqueta(id: number, codigoEtiqueta: string): Observable<RespuestaControlador<MensajeSunat>> {
    const params = new HttpParams().set('codigoEtiqueta', codigoEtiqueta);
    return this.http.put<RespuestaControlador<MensajeSunat>>(`${this.apiUrl}/sunat/mensajes/${id}/etiqueta`, {}, { params });
  }

  actualizarEstado(id: number, estado: number): Observable<RespuestaControlador<MensajeSunat>> {
    const params = new HttpParams().set('estado', estado.toString());
    return this.http.put<RespuestaControlador<MensajeSunat>>(`${this.apiUrl}/sunat/mensajes/${id}/estado`, {}, { params });
  }

  actualizarDestacado(id: number, destacado: number): Observable<RespuestaControlador<MensajeSunat>> {
    const params = new HttpParams().set('destacado', destacado.toString());
    return this.http.put<RespuestaControlador<MensajeSunat>>(`${this.apiUrl}/sunat/mensajes/${id}/destacado`, {}, { params });
  }

  actualizarArchivado(id: number, archivado: number): Observable<RespuestaControlador<MensajeSunat>> {
    const params = new HttpParams().set('archivado', archivado.toString());
    return this.http.put<RespuestaControlador<MensajeSunat>>(`${this.apiUrl}/sunat/mensajes/${id}/archivado`, {}, { params });
  }

  // Métodos para Etiquetas
  obtenerEtiquetas(): Observable<RespuestaControlador<Etiqueta[]>> {
    return this.http.get<RespuestaControlador<Etiqueta[]>>(`${this.apiUrl}/etiquetas`);
  }

  obtenerEtiquetasPorSunat(): Observable<RespuestaControlador<{[key: string]: string}>> {
    return this.http.get<RespuestaControlador<{[key: string]: string}>>(`${this.apiUrl}/sunat/etiquetas`);
  }

  obtenerEtiquetaPorId(id: number): Observable<RespuestaControlador<Etiqueta>> {
    return this.http.get<RespuestaControlador<Etiqueta>>(`${this.apiUrl}/etiquetas/${id}`);
  }

  obtenerEtiquetaPorCodigo(codigo: string): Observable<RespuestaControlador<Etiqueta>> {
    return this.http.get<RespuestaControlador<Etiqueta>>(`${this.apiUrl}/etiquetas/codigo/${codigo}`);
  }

  crearEtiqueta(vcNombre: string, vcColor?: string): Observable<RespuestaControlador<Etiqueta>> {
    let params = new HttpParams().set('vcNombre', vcNombre);
    if (vcColor) {
      params = params.set('vcColor', vcColor);
    }
    return this.http.post<RespuestaControlador<Etiqueta>>(`${this.apiUrl}/etiquetas`, {}, { params });
  }

 /* actualizarEtiqueta(id: number, vcNombre?: string, vcColor?: string): Observable<RespuestaControlador<Etiqueta>> {
    let params = new HttpParams();
    if (vcNombre) params = params.set('vcNombre', vcNombre);
    if (vcColor) params = params.set('vcColor', vcColor);

    return this.http.put<RespuestaControlador<Etiqueta>>(`${this.apiUrl}/etiquetas/${id}`, {}, { params });
  }*/

  eliminarEtiqueta(id: number): Observable<RespuestaControlador<{[key: string]: any}>> {
    return this.http.delete<RespuestaControlador<{[key: string]: any}>>(`${this.apiUrl}/etiquetas/${id}`);
  }

  // Métodos para Notificaciones SUNAT
  obtenerDetalleNotificacion(codigoMensaje: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sunat/notificaciones/${codigoMensaje}`);
  }

  obtenerOProcesarNotificacion(codigoMensaje: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/sunat/notificaciones/obtener-o-procesar/${codigoMensaje}`);
  }

  procesarNotificacion(codigoMensaje: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sunat/notificaciones/procesar/${codigoMensaje}`, {});
  }

  refrescarNotificacion(codigoMensaje: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/sunat/notificaciones/refrescar/${codigoMensaje}`, {});
  }

  // Métodos de estado local
  actualizarMensajesLocal(mensajes: MensajeSunat[]) {
    this.mensajesSubject.next(mensajes);
  }

  actualizarEtiquetasLocal(etiquetas: Etiqueta[]) {
    this.etiquetasSubject.next(etiquetas);
  }

  obtenerMensajesLocal(): MensajeSunat[] {
    return this.mensajesSubject.value;
  }

  obtenerEtiquetasLocal(): Etiqueta[] {
    return this.etiquetasSubject.value;
  }



}

