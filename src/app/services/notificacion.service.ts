import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subject } from 'rxjs';
import { switchMap, catchError, tap, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';
import {Notificacion} from '../models/notificacion';
import {environment} from '../../environments/environment';

export interface CorreoNotificacion {
  id: number;
  asunto: string;
  emisor: string;
  fechaPublica: string;
  etiquetaCodigo: string;
  etiquetaNombre: string;
  clasificacion: 'MUY IMPORTANTE' | 'IMPORTANTE' | 'RECURRENTE';
  emoji: string;
  urgente: number;
  destacado: number;
}

export interface NotificacionToast {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'success' | 'info' | 'warning' | 'error';
  emoji: string;
  duracion?: number;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = environment.apiUrl;
  private readonly RUC_DEFAULT = '20000000001';
  
  // Subjects para manejar estado
  private correosNuevosSubject = new BehaviorSubject<CorreoNotificacion[]>([]);
  private notificacionesSubject = new BehaviorSubject<NotificacionToast[]>([]);
  private pollingActivoSubject = new BehaviorSubject<boolean>(false);
  private cancelarOperacionesSubject = new Subject<void>(); // Para cancelar operaciones pendientes
  private operacionesCanceladas = false; // Flag para evitar mostrar notificaciones después del logout
  
  // Observables públicos
  public correosNuevos$ = this.correosNuevosSubject.asObservable();
  public notificaciones$ = this.notificacionesSubject.asObservable();
  public pollingActivo$ = this.pollingActivoSubject.asObservable();
  
  private intervalPolling: any;
  private ultimaVerificacion: number = 0;

  constructor(private http: HttpClient) {
    this.inicializarUltimaVerificacion();
  }

  // Método original para compatibilidad
  obtenerNotificacion(codigoMensaje: string): Observable<Notificacion> {
    return this.http.get<Notificacion>(`${this.apiUrl}/sunat/notificaciones/${codigoMensaje}`);
  }

  /**
   * Inicializa la última verificación desde localStorage
   */
  private inicializarUltimaVerificacion(): void {
    const stored = localStorage.getItem('sunat_ultima_verificacion');
    this.ultimaVerificacion = stored ? parseInt(stored) : Date.now();
  }

  /**
   * Guarda la última verificación en localStorage
   */
  private guardarUltimaVerificacion(): void {
    this.ultimaVerificacion = Date.now();
    localStorage.setItem('sunat_ultima_verificacion', this.ultimaVerificacion.toString());
  }

  /**
   * Obtiene correos nuevos desde el backend
   */
  public obtenerCorreosNuevos(ruc: string = this.RUC_DEFAULT, limit: number = 10): Observable<any> {
    const url = `${this.apiUrl}/sunat/correos-nuevos-notificaciones`;
    const params = {
      ruc: ruc,
      limit: limit.toString(),
      desde: this.ultimaVerificacion.toString()
    };

    return this.http.get(url, { params }).pipe(
      tap((response: any) => {
        if (response && response.datos) {
          this.procesarCorreosNuevos(response.datos);
        }
      }),
      catchError(error => {
        console.error('Error al obtener correos nuevos:', error);
        return of({ datos: [] });
      })
    );
  }

  /**
   * Procesa correos nuevos y crea notificaciones
   */
  private procesarCorreosNuevos(correos: CorreoNotificacion[]): void {
    if (!correos || correos.length === 0) {
      return;
    }

    // Actualizar lista de correos
    this.correosNuevosSubject.next(correos);

    // Crear notificaciones toast para correos muy importantes e importantes
    const correosImportantes = correos.filter(correo => 
      correo.clasificacion === 'MUY IMPORTANTE' || correo.clasificacion === 'IMPORTANTE'
    );

    correosImportantes.forEach(correo => {
      this.mostrarNotificacionCorreo(correo);
    });

    // Mostrar resumen si hay múltiples correos
    if (correos.length > 1) {
      this.mostrarResumenCorreos(correos);
    }

    this.guardarUltimaVerificacion();
  }

  /**
   * Muestra notificación individual para un correo
   */
  private mostrarNotificacionCorreo(correo: CorreoNotificacion): void {
    const asuntoCorto = correo.asunto.length > 50 
      ? correo.asunto.substring(0, 50) + '...' 
      : correo.asunto;

    const notificacion: NotificacionToast = {
      id: `correo-${correo.id}-${Date.now()}`,
      titulo: `${correo.emoji} Correo ${correo.clasificacion}`,
      mensaje: `${correo.etiquetaNombre}: ${asuntoCorto}`,
      tipo: correo.clasificacion === 'MUY IMPORTANTE' ? 'error' : 'warning',
      emoji: correo.emoji,
      duracion: correo.clasificacion === 'MUY IMPORTANTE' ? 10000 : 5000,
      visible: true
    };

    this.agregarNotificacion(notificacion);
  }

  /**
   * Muestra resumen de múltiples correos
   */
  private mostrarResumenCorreos(correos: CorreoNotificacion[]): void {
    const muyImportantes = correos.filter(c => c.clasificacion === 'MUY IMPORTANTE').length;
    const importantes = correos.filter(c => c.clasificacion === 'IMPORTANTE').length;
    const recurrentes = correos.filter(c => c.clasificacion === 'RECURRENTE').length;

    let mensaje = `${correos.length} correos nuevos: `;
    const partes = [];
    
    if (muyImportantes > 0) partes.push(`🔴 ${muyImportantes} muy importantes`);
    if (importantes > 0) partes.push(`🟡 ${importantes} importantes`);
    if (recurrentes > 0) partes.push(`🟢 ${recurrentes} recurrentes`);

    mensaje += partes.join(', ');

    const notificacion: NotificacionToast = {
      id: `resumen-${Date.now()}`,
      titulo: '📧 Resumen de correos nuevos',
      mensaje: mensaje,
      tipo: muyImportantes > 0 ? 'error' : importantes > 0 ? 'warning' : 'info',
      emoji: '📧',
      duracion: 8000,
      visible: true
    };

    this.agregarNotificacion(notificacion);
  }

  /**
   * Agrega una notificación toast
   */
  public agregarNotificacion(notificacion: NotificacionToast): void {
    // No agregar notificaciones si las operaciones han sido canceladas
    if (this.operacionesCanceladas) {
      console.log('🚫 Notificación no agregada - operaciones canceladas:', notificacion.titulo);
      return;
    }
    
    const notificacionesActuales = this.notificacionesSubject.value;
    this.notificacionesSubject.next([...notificacionesActuales, notificacion]);

    // Auto-ocultar después de la duración especificada
    if (notificacion.duracion && notificacion.duracion > 0) {
      setTimeout(() => {
        this.ocultarNotificacion(notificacion.id);
      }, notificacion.duracion);
    }
  }

  /**
   * Oculta una notificación específica
   */
  public ocultarNotificacion(id: string): void {
    const notificaciones = this.notificacionesSubject.value
      .map(n => n.id === id ? { ...n, visible: false } : n);
    this.notificacionesSubject.next(notificaciones);

    // Eliminar completamente después de animación
    setTimeout(() => {
      const notificacionesFiltradas = this.notificacionesSubject.value
        .filter(n => n.id !== id);
      this.notificacionesSubject.next(notificacionesFiltradas);
    }, 300);
  }

  /**
   * Limpia todas las notificaciones
   */
  public limpiarNotificaciones(): void {
    this.notificacionesSubject.next([]);
  }

  /**
   * Cancela todas las operaciones HTTP pendientes
   */
  public cancelarOperacionesPendientes(): void {
    console.log('🚫 Cancelando todas las operaciones HTTP pendientes');
    this.operacionesCanceladas = true; // Marcar que las operaciones han sido canceladas
    this.cancelarOperacionesSubject.next();
    // Reiniciar el subject para futuras operaciones
    this.cancelarOperacionesSubject = new Subject<void>();
  }

  /**
   * Limpia todo: notificaciones y cancela operaciones pendientes
   */
  public limpiarTodo(): void {
    console.log('🧹 Limpiando todas las notificaciones y cancelando operaciones pendientes');
    this.cancelarOperacionesPendientes();
    this.limpiarNotificaciones();
  }

  /**
   * Inicia el polling automático
   */
  public iniciarPolling(intervaloSegundos: number = 30): void {
    if (this.intervalPolling) {
      clearInterval(this.intervalPolling);
    }

    this.pollingActivoSubject.next(true);
    
    this.intervalPolling = setInterval(() => {
      this.obtenerCorreosNuevos().subscribe();
    }, intervaloSegundos * 1000);

    console.log(`🔄 Polling iniciado cada ${intervaloSegundos} segundos`);
  }

  /**
   * Detiene el polling automático
   */
  public detenerPolling(): void {
    if (this.intervalPolling) {
      clearInterval(this.intervalPolling);
      this.intervalPolling = null;
    }
    this.pollingActivoSubject.next(false);
    console.log('⏹️ Polling detenido');
  }

  /**
   * Verifica correos al iniciar sesión
   */
  public verificarCorreosAlIniciarSesion(): void {
    console.log('🔍 Verificando correos nuevos al iniciar sesión...');
    this.obtenerCorreosNuevos().subscribe(response => {
      const correos = response?.datos || [];
      if (correos.length > 0) {
        this.mostrarNotificacionBienvenida(correos);
      } else {
        this.mostrarNotificacionSinCorreos();
      }
    });
  }

  /**
   * Verifica estadísticas post-login basadas en el RUC del usuario
   */
  public verificarEstadisticasPostLogin(ruc: string): void {
    console.log('📊 Verificando estadísticas post-login para RUC:', ruc);
    
    // Resetear flag de operaciones canceladas para nueva sesión
    this.operacionesCanceladas = false;
    
    const url = `${this.apiUrl}/sunat/estadisticas-post-login`;
    const params = {
      ruc: ruc,
      soloNuevos: 'false' // Obtener todos los correos para estadísticas completas
    };

    this.http.get(url, { params }).pipe(
      takeUntil(this.cancelarOperacionesSubject), // Cancelar si se emite la señal
      catchError(error => {
        console.error('Error al obtener estadísticas post-login:', error);
        return of({ mensaje: 'Error al obtener estadísticas', nuCodigo: 500, datos: null });
      })
    ).subscribe({
      next: (response: any) => {
        // Solo mostrar notificaciones si no han sido canceladas
        if (!this.operacionesCanceladas) {
          if (response && response.datos) {
            this.mostrarNotificacionEstadisticasPostLogin(response);
          } else {
            this.mostrarNotificacionSinCorreos();
          }
        } else {
          console.log('🚫 Notificaciones no mostradas - operaciones canceladas');
        }
      },
      error: (error) => {
        console.log('❌ Operación de estadísticas post-login cancelada o falló:', error);
      }
    });
  }

  /**
   * Muestra notificación de bienvenida con resumen
   */
  private mostrarNotificacionBienvenida(correos: CorreoNotificacion[]): void {
    const muyImportantes = correos.filter(c => c.clasificacion === 'MUY IMPORTANTE').length;
    const importantes = correos.filter(c => c.clasificacion === 'IMPORTANTE').length;

    if (muyImportantes > 0 || importantes > 0) {
      const notificacion: NotificacionToast = {
        id: `bienvenida-${Date.now()}`,
        titulo: '👋 ¡Bienvenido!',
        mensaje: `Tienes ${muyImportantes + importantes} correos importantes pendientes`,
        tipo: muyImportantes > 0 ? 'error' : 'warning',
        emoji: '👋',
        duracion: 6000,
        visible: true
      };

      this.agregarNotificacion(notificacion);
    }
  }

  /**
   * Muestra notificación cuando no hay correos nuevos
   */
  private mostrarNotificacionSinCorreos(): void {
    const notificacion: NotificacionToast = {
      id: `sin-correos-${Date.now()}`,
      titulo: '✅ Sin correos nuevos',
      mensaje: 'NO HAY CORREOS NUEVOS en este momento',
      tipo: 'info',
      emoji: '✅',
      duracion: 4000,
      visible: true
    };

    this.agregarNotificacion(notificacion);
  }

  /**
   * Muestra notificación con estadísticas detalladas post-login
   */
  private mostrarNotificacionEstadisticasPostLogin(response: any): void {
    const datos = response.datos;
    const totalExtraidos = datos.totalExtraidos || 0;
    const clasificaciones = datos.clasificaciones || {};
    const etiquetas = datos.etiquetas || {};
    const nombresEtiquetas = datos.nombresEtiquetas || {};

    if (totalExtraidos === 0) {
      this.mostrarNotificacionSinCorreos();
      return;
    }

    // Construir mensaje principal
    let mensaje = `Se han extraído un total de ${totalExtraidos} correos.`;
    
    // Agregar clasificaciones
    const partes = [];
    if (clasificaciones['MUY IMPORTANTE'] > 0) {
      partes.push(`🔴 ${clasificaciones['MUY IMPORTANTE']} muy importantes`);
    }
    if (clasificaciones['IMPORTANTE'] > 0) {
      partes.push(`🟡 ${clasificaciones['IMPORTANTE']} importantes`);
    }
    if (clasificaciones['RECURRENTE'] > 0) {
      partes.push(`🟢 ${clasificaciones['RECURRENTE']} recurrentes`);
    }

    if (partes.length > 0) {
      mensaje += ` Clasificación: ${partes.join(', ')}.`;
    }

    // Determinar tipo de notificación según prioridad
    let tipo: 'success' | 'info' | 'warning' | 'error' = 'info';
    let emoji = '📊';
    
    if (clasificaciones['MUY IMPORTANTE'] > 0) {
      tipo = 'error';
      emoji = '🚨';
    } else if (clasificaciones['IMPORTANTE'] > 0) {
      tipo = 'warning';
      emoji = '⚠️';
    } else if (totalExtraidos > 0) {
      tipo = 'success';
      emoji = '📧';
    }

    const notificacion: NotificacionToast = {
      id: `estadisticas-${Date.now()}`,
      titulo: `${emoji} Resumen de correos extraídos`,
      mensaje: mensaje,
      tipo: tipo,
      emoji: emoji,
      duracion: 8000, // Duración más larga para leer el resumen completo
      visible: true
    };

    this.agregarNotificacion(notificacion);

    // Mostrar notificación adicional con detalle de etiquetas si hay muchas
    if (Object.keys(etiquetas).length > 0) {
      setTimeout(() => {
        this.mostrarDetalleEtiquetas(etiquetas, nombresEtiquetas);
      }, 2000); // Mostrar después de 2 segundos
    }
  }

  /**
   * Muestra detalle de las etiquetas encontradas
   */
  private mostrarDetalleEtiquetas(etiquetas: any, nombresEtiquetas: any): void {
    const detallesEtiquetas = [];
    
    console.log('🏷️ Etiquetas recibidas:', etiquetas);
    console.log('🏷️ Nombres de etiquetas:', nombresEtiquetas);
    
    for (const [codigo, cantidad] of Object.entries(etiquetas)) {
      const nombre = nombresEtiquetas[codigo] || `Etiqueta ${codigo}`;
      detallesEtiquetas.push(`${nombre}: ${cantidad}`);
    }

    if (detallesEtiquetas.length > 0) {
      // Si hay muchas etiquetas, dividir en múltiples toasts
      if (detallesEtiquetas.length <= 3) {
        // Mostrar todas en un solo toast
        const mensaje = `Etiquetas encontradas: ${detallesEtiquetas.join(', ')}`;
        
        const notificacion: NotificacionToast = {
          id: `detalle-etiquetas-${Date.now()}`,
          titulo: '🏷️ Detalle por etiquetas',
          mensaje: mensaje,
          tipo: 'info',
          emoji: '🏷️',
          duracion: 6000,
          visible: true
        };

        this.agregarNotificacion(notificacion);
      } else {
        // Mostrar en grupos de 3
        for (let i = 0; i < detallesEtiquetas.length; i += 3) {
          const grupo = detallesEtiquetas.slice(i, i + 3);
          const numeroGrupo = Math.floor(i / 3) + 1;
          const totalGrupos = Math.ceil(detallesEtiquetas.length / 3);
          
          const mensaje = `Etiquetas (${numeroGrupo}/${totalGrupos}): ${grupo.join(', ')}`;
          
          const notificacion: NotificacionToast = {
            id: `detalle-etiquetas-${numeroGrupo}-${Date.now()}`,
            titulo: '🏷️ Detalle por etiquetas',
            mensaje: mensaje,
            tipo: 'info',
            emoji: '🏷️',
            duracion: 7000,
            visible: true
          };

          // Mostrar cada grupo con un pequeño delay
          setTimeout(() => {
            this.agregarNotificacion(notificacion);
          }, i * 500); // 500ms entre cada grupo
        }
      }
    } else {
      console.log('⚠️ No se encontraron etiquetas para mostrar');
    }
  }

  /**
   * Obtiene el estado actual del polling
   */
  public estaPollingActivo(): boolean {
    return this.pollingActivoSubject.value;
  }
}
