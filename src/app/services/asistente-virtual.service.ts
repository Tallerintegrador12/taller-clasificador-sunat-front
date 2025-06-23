import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

export interface AsistenteConsulta {
  consulta: string;
  usuarioId?: number;
  contexto?: string;
  incluirHistorial?: boolean;
}

export interface AsistenteRespuesta {
  respuesta: string;
  confianza: number;
  categoria: string;
  fuentes: string[];
  recomendaciones: string[];
  tiempoRespuesta: number;
  timestamp: string;
  requiereSeguimiento: boolean;
  sesionId: string;
}

export interface CapacidadesAsistente {
  descripcion: string;
  especialidades: string[];
  idiomas: string[];
  disponibilidad: string;
  modelo_ia: string;
}

export interface ConsultasFrecuentes {
  consultas: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AsistenteVirtualService {
  private readonly apiUrl = 'https://sunatapi-arcehmesgqb2f8en.brazilsouth-01.azurewebsites.net/api/asistente';
  private readonly timeoutMs = 30000; // 30 segundos

  constructor(private http: HttpClient) {}

  /**
   * Envía una consulta al asistente virtual
   */
  consultar(payload: AsistenteConsulta): Observable<AsistenteRespuesta> {
    return this.http.post<AsistenteRespuesta>(`${this.apiUrl}/consultar`, payload)
      .pipe(
        timeout(this.timeoutMs),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene el estado del asistente
   */
  obtenerEstado(): Observable<string> {
    return this.http.get(`${this.apiUrl}/estado`, { responseType: 'text' })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene las capacidades del asistente
   */
  obtenerCapacidades(): Observable<CapacidadesAsistente> {
    return this.http.get<CapacidadesAsistente>(`${this.apiUrl}/capacidades`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene las consultas frecuentes
   */
  obtenerConsultasFrecuentes(): Observable<ConsultasFrecuentes> {
    return this.http.get<ConsultasFrecuentes>(`${this.apiUrl}/consultas-frecuentes`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error inesperado';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de conexión: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 0:
          errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión.';
          break;
        case 400:
          errorMessage = 'Consulta inválida. Por favor, revisa tu pregunta.';
          break;
        case 401:
          errorMessage = 'No autorizado. Inicia sesión nuevamente.';
          break;
        case 403:
          errorMessage = 'No tienes permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'Servicio no encontrado. El asistente podría estar inactivo.';
          break;
        case 429:
          errorMessage = 'Demasiadas consultas. Espera un momento antes de intentar nuevamente.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta nuevamente en unos minutos.';
          break;
        case 503:
          errorMessage = 'Servicio temporalmente no disponible. Intenta más tarde.';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('Error en AsistenteVirtualService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
