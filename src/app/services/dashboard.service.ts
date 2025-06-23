import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardMetrics {
  resumenGeneral: {
    totalCorreos: number;
    correosNuevos: number;
    muyImportantes: number;
    importantes: number;
    recurrentes: number;
    multas: number;
    cobranzas: number;
    fiscalizaciones: number;
    tendenciaSemanal: 'subiendo' | 'bajando' | 'estable';
  };
  alertasCriticas: {
    multasVencenHoy: number;
    fiscalizacionesPendientes: number;
    resolucionesUrgentes: number;
  };
  estadoSistema: {
    estadoGeminiAI: string;
    ultimaSincronizacion: string;
    rendimientoClasificacion: number;
  };
}

export interface AlertaDashboard {
  tipo: string;
  mensaje: string;
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA';
  accion: string;
  icono: string;
  cantidad?: number;
}

export interface TendenciaData {
  fecha: string;
  muyImportantes: number;
  importantes: number;
  recurrentes: number;
}

export interface DistribucionEtiqueta {
  codigo: string;
  nombre: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

export interface AnalisisPredictivo {
  patrones: {
    tendenciaGeneral: string;
    tipoMasFrecuente: string;
    horarioPico: string;
    diaMasActivo: string;
  };
  predicciones: {
    proximaSemana: string;
    alertaFiscalizacion: string;
    tendenciaMultas: string;
  };
  recomendaciones: string[];
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  scoreCompliance: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl + '/dashboard';
  
  // Observables para actualización en tiempo real
  private metricsSubject = new BehaviorSubject<DashboardMetrics | null>(null);
  private alertasSubject = new BehaviorSubject<AlertaDashboard[]>([]);
  
  public metrics$ = this.metricsSubject.asObservable();
  public alertas$ = this.alertasSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene métricas principales del dashboard
   */
  obtenerMetricasPrincipales(ruc: string, dias: number = 30): Observable<any> {
    const params = new HttpParams()
      .set('ruc', ruc)
      .set('dias', dias.toString());

    return this.http.get<any>(`${this.apiUrl}/metricas-principales`, { params });
  }

  /**
   * Obtiene datos para gráfico de tendencias
   */
  obtenerTendencias(ruc: string, dias: number = 30): Observable<any> {
    const params = new HttpParams()
      .set('ruc', ruc)
      .set('dias', dias.toString());

    return this.http.get<any>(`${this.apiUrl}/tendencias`, { params });
  }

  /**
   * Obtiene distribución por etiquetas
   */
  obtenerDistribucionEtiquetas(ruc: string, dias: number = 30): Observable<any> {
    const params = new HttpParams()
      .set('ruc', ruc)
      .set('dias', dias.toString());

    return this.http.get<any>(`${this.apiUrl}/distribucion-etiquetas`, { params });
  }

  /**
   * Obtiene heatmap de actividad
   */
  obtenerHeatmapActividad(ruc: string, semanas: number = 4): Observable<any> {
    const params = new HttpParams()
      .set('ruc', ruc)
      .set('semanas', semanas.toString());

    return this.http.get<any>(`${this.apiUrl}/heatmap-actividad`, { params });
  }

  /**
   * Obtiene alertas activas del sistema
   */
  obtenerAlertasActivas(ruc: string): Observable<any> {
    const params = new HttpParams().set('ruc', ruc);
    return this.http.get<any>(`${this.apiUrl}/alertas-activas`, { params });
  }

  /**
   * Obtiene análisis predictivo usando Gemini AI
   */
  obtenerAnalisisPredictivo(ruc: string): Observable<any> {
    const params = new HttpParams().set('ruc', ruc);
    return this.http.get<any>(`${this.apiUrl}/analisis-predictivo`, { params });
  }

  /**
   * Obtiene comparativo con períodos anteriores
   */
  obtenerComparativoPeriodos(ruc: string, periodoActual: number = 30, periodoAnterior: number = 30): Observable<any> {
    const params = new HttpParams()
      .set('ruc', ruc)
      .set('periodoActual', periodoActual.toString())
      .set('periodoAnterior', periodoAnterior.toString());

    return this.http.get<any>(`${this.apiUrl}/comparativo-periodos`, { params });
  }

  /**
   * Obtiene ranking de tipos de notificaciones más frecuentes
   */
  obtenerRankingNotificaciones(ruc: string, dias: number = 90): Observable<any> {
    const params = new HttpParams()
      .set('ruc', ruc)
      .set('dias', dias.toString());

    return this.http.get<any>(`${this.apiUrl}/ranking-notificaciones`, { params });
  }

  /**
   * Actualiza las métricas en el subject para notificar a los componentes
   */
  actualizarMetricas(metricas: DashboardMetrics): void {
    this.metricsSubject.next(metricas);
  }

  /**
   * Actualiza las alertas en el subject
   */
  actualizarAlertas(alertas: AlertaDashboard[]): void {
    this.alertasSubject.next(alertas);
  }

  /**
   * Obtiene el estado actual de las métricas
   */
  obtenerMetricasActuales(): DashboardMetrics | null {
    return this.metricsSubject.value;
  }

  /**
   * Obtiene las alertas actuales
   */
  obtenerAlertasActuales(): AlertaDashboard[] {
    return this.alertasSubject.value;
  }

  /**
   * Carga completa del dashboard
   */
  cargarDashboardCompleto(ruc: string): Observable<any> {
    // Puedes implementar una llamada que combine múltiples endpoints
    // o hacer llamadas separadas y combinarlas
    return this.obtenerMetricasPrincipales(ruc);
  }

  /**
   * Procesa datos de tendencias para gráficos
   */
  procesarDatosTendencias(datos: any): TendenciaData[] {
    const tendencias: TendenciaData[] = [];
    
    if (datos && datos.datos) {
      Object.keys(datos.datos).forEach(fecha => {
        const clasificaciones = datos.datos[fecha];
        tendencias.push({
          fecha,
          muyImportantes: clasificaciones['MUY IMPORTANTE'] || 0,
          importantes: clasificaciones['IMPORTANTE'] || 0,
          recurrentes: clasificaciones['RECURRENTE'] || 0
        });
      });
    }
    
    return tendencias.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  /**
   * Procesa datos de distribución para gráficos
   */
  procesarDatosDistribucion(datos: any): DistribucionEtiqueta[] {
    if (datos && datos.datos && Array.isArray(datos.datos)) {
      return datos.datos.map((item: any) => ({
        codigo: item.codigo,
        nombre: item.nombre,
        cantidad: item.cantidad,
        porcentaje: item.porcentaje,
        color: item.color
      }));
    }
    return [];
  }

  /**
   * Determina el color de prioridad para alertas
   */
  obtenerColorPrioridad(prioridad: string): string {
    switch (prioridad) {
      case 'CRITICA': return 'text-red-600 bg-red-50 border-red-200';
      case 'ALTA': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIA': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  /**
   * Formatea números para mostrar en el dashboard
   */
  formatearNumero(numero: number): string {
    if (numero >= 1000000) {
      return (numero / 1000000).toFixed(1) + 'M';
    } else if (numero >= 1000) {
      return (numero / 1000).toFixed(1) + 'K';
    }
    return numero.toString();
  }

  /**
   * Calcula el porcentaje de cambio entre dos valores
   */
  calcularPorcentajeCambio(actual: number, anterior: number): { porcentaje: number, tipo: 'incremento' | 'decremento' | 'sin_cambio' } {
    if (anterior === 0) {
      return { porcentaje: actual > 0 ? 100 : 0, tipo: actual > 0 ? 'incremento' : 'sin_cambio' };
    }
    
    const cambio = ((actual - anterior) / anterior) * 100;
    return {
      porcentaje: Math.abs(Math.round(cambio)),
      tipo: cambio > 0 ? 'incremento' : (cambio < 0 ? 'decremento' : 'sin_cambio')
    };
  }
}
