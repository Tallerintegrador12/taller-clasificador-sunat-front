import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription, of, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

interface MetricasPrinciipales {
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

interface Alerta {
  tipo: string;
  mensaje: string;
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA';
  accion: string;
  icono: string;
  cantidad?: number;
}

interface DatosGraficoDistribucion {
  codigo: string;
  nombre: string;
  cantidad: number;
  porcentaje: number;
  color: string;
}

interface CorreoCritico {
  codigoMensaje: number;
  asunto: string;
  fechaEnvio: string;
  prioridad: 'MUY_IMPORTANTE' | 'IMPORTANTE' | 'RECURRENTE';
  tipoMensaje: number;
  resumen: string;
  leido: boolean;
  tieneArchivos: boolean;
  cantidadArchivos: number;
  accionRecomendada?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container min-h-screen bg-gray-50 p-6">
      <!-- Header del Dashboard -->
      <div class="dashboard-header mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button 
              (click)="volverAPanelEmail()"
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors">
              <span class="mr-2">←</span>
              Panel Email
            </button>
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">
                📊 Dashboard Analítico SUNAT
              </h1>
              <p class="text-gray-600">
                Panel de Control Ejecutivo - {{ fechaActual | date:'dd/MM/yyyy HH:mm' }}
              </p>
            </div>
          </div>          <div class="flex items-center space-x-4">
            <button 
              (click)="actualizarDatos()"
              [disabled]="cargando"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <span class="mr-2">🔄</span>
              {{ cargando ? 'Actualizando...' : 'Actualizar' }}
            </button>
            <div class="text-sm text-gray-500">
              RUC: {{ rucActual }}
            </div>
          </div>
        </div>
      </div>

      <!-- Alertas Críticas Mejoradas -->
      <div class="alertas-criticas mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">🚨 Alertas Críticas</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" *ngIf="alertas.length > 0; else noAlertas">
          <div 
            *ngFor="let alerta of alertas" 
            class="alerta-card bg-white rounded-lg p-4 border-l-4 shadow-sm hover:shadow-md transition-shadow"
            [ngClass]="{
              'border-red-500': alerta.prioridad === 'CRITICA',
              'border-orange-500': alerta.prioridad === 'ALTA',
              'border-yellow-500': alerta.prioridad === 'MEDIA'
            }">
            <div class="flex items-start space-x-3">
              <span class="text-2xl">{{ alerta.icono }}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <span 
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    [ngClass]="{
                      'bg-red-100 text-red-800': alerta.prioridad === 'CRITICA',
                      'bg-orange-100 text-orange-800': alerta.prioridad === 'ALTA',
                      'bg-yellow-100 text-yellow-800': alerta.prioridad === 'MEDIA'
                    }">
                    {{ alerta.prioridad }}
                  </span>
                  <span class="text-sm font-bold text-gray-600" *ngIf="alerta.cantidad">{{ alerta.cantidad }}</span>
                </div>
                <p class="font-medium text-gray-900 mb-2">{{ alerta.mensaje }}</p>
                <button class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  {{ alerta.accion }} →
                </button>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noAlertas>
          <div class="no-alertas bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div class="text-4xl mb-3">✅</div>
            <h3 class="text-lg font-medium text-green-800 mb-2">¡Todo en Orden!</h3>
            <p class="text-sm text-green-600">No hay alertas críticas en este momento. Su situación tributaria está bajo control.</p>
            <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div class="text-center">
                <div class="font-semibold text-green-700">Sin Multas Vencidas</div>
                <div class="text-green-600">0 pendientes</div>
              </div>
              <div class="text-center">
                <div class="font-semibold text-green-700">Fiscalizaciones al Día</div>
                <div class="text-green-600">Sin pendientes</div>
              </div>
              <div class="text-center">
                <div class="font-semibold text-green-700">Resoluciones OK</div>
                <div class="text-green-600">Sin urgentes</div>
              </div>
            </div>
            <div class="mt-4 text-xs text-green-500 flex items-center justify-center">
              <span class="mr-1">🤖</span>
              Análisis en tiempo real con Gemini AI sobre {{ metricas?.resumenGeneral?.totalCorreos || 0 }} correos
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Métricas Principales -->
      <div class="metricas-principales mb-8" *ngIf="metricas">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">📈 Métricas Principales</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Total Correos -->
          <div class="metrica-card bg-white rounded-lg p-6 shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Correos</p>
                <p class="text-3xl font-bold text-blue-600">{{ metricas.resumenGeneral.totalCorreos }}</p>
              </div>
              <div class="text-4xl">📧</div>
            </div>
            <div class="mt-2 flex items-center">
              <span class="text-sm text-green-600">{{ metricas.resumenGeneral.correosNuevos }} nuevos</span>
            </div>
          </div>

          <!-- Muy Importantes -->
          <div 
            class="metrica-card bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
            (click)="navegarACorreos('MUY_IMPORTANTE')"
            title="Click para ver correos muy importantes">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Muy Importantes</p>
                <p class="text-3xl font-bold text-red-600">{{ metricas.resumenGeneral.muyImportantes }}</p>
              </div>
              <div class="text-4xl">🔴</div>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-red-600">Requieren atención inmediata</span>
              <span class="text-xs text-blue-500 font-medium">Ver todos →</span>
            </div>
          </div>

          <!-- Fiscalizaciones -->
          <div 
            class="metrica-card bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
            (click)="navegarACorreos('FISCALIZACION')"
            title="Click para ver correos de fiscalizaciones">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Fiscalizaciones</p>
                <p class="text-3xl font-bold text-orange-600">{{ metricas.resumenGeneral.fiscalizaciones }}</p>
              </div>
              <div class="text-4xl">🔍</div>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-orange-600">Auditorías activas</span>
              <span class="text-xs text-blue-500 font-medium">Ver todos →</span>
            </div>
          </div>

          <!-- Multas -->
          <div 
            class="metrica-card bg-white rounded-lg p-6 shadow-sm border cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
            (click)="navegarACorreos('MULTA')"
            title="Click para ver correos de multas">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Multas</p>
                <p class="text-3xl font-bold text-yellow-600">{{ metricas.resumenGeneral.multas }}</p>
              </div>
              <div class="text-4xl">💰</div>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-yellow-600">Valores pendientes</span>
              <span class="text-xs text-blue-500 font-medium">Ver todos →</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos y Análisis -->
      <div class="graficos-analisis grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Ranking de Notificaciones SUNAT - NUEVO COMPONENTE INNOVADOR -->
        <div class="ranking-notificaciones bg-white rounded-lg p-6 shadow-sm border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
              🏆 Ranking de Notificaciones SUNAT
            </h3>
            <span class="text-sm text-gray-500">Últimos 90 días</span>
          </div>
          
          <div class="space-y-3" *ngIf="rankingNotificaciones && rankingNotificaciones.length > 0; else noRanking">
            <div 
              *ngFor="let item of rankingNotificaciones; let i = index" 
              class="ranking-item p-4 rounded-lg transition-all hover:shadow-md cursor-pointer border-l-4"
              [ngClass]="{
                'border-yellow-500 bg-yellow-50': i === 0,
                'border-gray-400 bg-gray-50': i === 1,
                'border-orange-500 bg-orange-50': i === 2,
                'border-blue-400 bg-blue-50': i > 2
              }"
              [title]="'Click para filtrar correos de tipo: ' + item.nombre">
              
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <!-- Posición en el ranking -->
                  <div 
                    class="ranking-badge w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    [ngClass]="{
                      'bg-yellow-500': i === 0,
                      'bg-gray-500': i === 1,
                      'bg-orange-500': i === 2,
                      'bg-blue-500': i > 2
                    }">
                    {{ i + 1 }}
                  </div>
                  
                  <!-- Información del tipo -->
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900 text-sm">
                      {{ item.nombre }}
                    </h4>
                    <p class="text-xs text-gray-600">
                      Código: {{ item.codigo }}
                    </p>
                  </div>
                </div>
                
                <!-- Estadísticas -->
                <div class="text-right">
                  <div class="flex items-center space-x-2">
                    <span class="text-lg font-bold text-gray-700">{{ item.cantidad }}</span>
                    <span class="text-xs text-gray-500">correos</span>
                  </div>
                  <div class="flex items-center space-x-1 mt-1">
                    <span class="text-sm font-medium text-blue-600">{{ item.porcentaje }}%</span>
                    <span class="text-lg">{{ item.tendencia }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Barra de progreso visual -->
              <div class="mt-3 bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-500"
                  [ngClass]="{
                    'bg-yellow-500': i === 0,
                    'bg-gray-500': i === 1,
                    'bg-orange-500': i === 2,
                    'bg-blue-500': i > 2
                  }"
                  [style.width.%]="item.porcentaje">
                </div>
              </div>
            </div>
          </div>
          
          <ng-template #noRanking>
            <div class="text-center py-8">
              <div class="text-4xl mb-3">📊</div>
              <h4 class="font-medium text-gray-900 mb-2">Cargando Estadísticas</h4>
              <p class="text-sm text-gray-600">
                Analizando tipos de notificaciones de SUNAT...
              </p>
            </div>
          </ng-template>
          
          <!-- Insights Adicionales -->
          <div class="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
            <div class="flex items-center space-x-2 mb-2">
              <span class="text-sm font-medium text-blue-800">💡 Insight Inteligente:</span>
            </div>
            <p class="text-sm text-blue-700" *ngIf="rankingNotificaciones && rankingNotificaciones.length > 0">
              {{ getInsightRanking() }}
            </p>
            <p class="text-sm text-blue-700" *ngIf="!rankingNotificaciones || rankingNotificaciones.length === 0">
              Cargando análisis de patrones de notificaciones...
            </p>
          </div>
        </div>

        <!-- Correos Críticos Recientes -->
        <div class="correos-criticos bg-white rounded-lg p-6 shadow-sm border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800 flex items-center">
              🚨 Correos Críticos Recientes
            </h3>
            <span class="text-sm text-gray-500">Últimos 7 días</span>
          </div>
          
          <div class="space-y-4" *ngIf="correosCriticos && correosCriticos.length > 0; else noCorreosCriticos">
            <div 
              *ngFor="let correo of correosCriticos; let i = index" 
              class="correo-item border-l-4 p-4 rounded-lg transition-all hover:shadow-md cursor-pointer"
              [ngClass]="{
                'border-red-500 bg-red-50': correo.prioridad === 'MUY_IMPORTANTE',
                'border-yellow-500 bg-yellow-50': correo.prioridad === 'IMPORTANTE',
                'border-blue-500 bg-blue-50': correo.prioridad === 'RECURRENTE'
              }"
              (click)="verDetalleCorreo(correo)">
              
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <span 
                      class="px-2 py-1 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-red-100 text-red-800': correo.prioridad === 'MUY_IMPORTANTE',
                        'bg-yellow-100 text-yellow-800': correo.prioridad === 'IMPORTANTE',
                        'bg-blue-100 text-blue-800': correo.prioridad === 'RECURRENTE'
                      }">
                      {{ getPrioridadLabel(correo.prioridad) }}
                    </span>
                    <span class="text-xs text-gray-500">{{ correo.fechaEnvio | date:'dd/MM HH:mm' }}</span>
                  </div>
                  
                  <h4 class="font-medium text-gray-900 mb-1 line-clamp-2">
                    {{ correo.asunto }}
                  </h4>
                  
                  <p class="text-sm text-gray-600 mb-2">
                    {{ correo.resumen }}
                  </p>
                  
                  <div class="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📧 Código: {{ correo.codigoMensaje }}</span>
                    <span *ngIf="correo.tieneArchivos">📎 {{ correo.cantidadArchivos }} archivo(s)</span>
                    <span *ngIf="!correo.leido" class="text-red-600 font-medium">● Sin leer</span>
                  </div>
                </div>
                
                <div class="ml-4 flex flex-col items-end space-y-2">
                  <span 
                    class="text-2xl"
                    [title]="getTipoMensajeLabel(correo.tipoMensaje)">
                    {{ getTipoMensajeIcon(correo.tipoMensaje) }}
                  </span>
                  
                  <button
                    class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
                    (click)="$event.stopPropagation(); abrirCorreo(correo)">
                    Ver →
                  </button>
                </div>
              </div>
              
              <!-- Acciones recomendadas -->
              <div class="mt-3 pt-3 border-t border-gray-200" *ngIf="correo.accionRecomendada">
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-500">💡 Acción recomendada:</span>
                  <span class="text-xs text-blue-600 font-medium">{{ correo.accionRecomendada }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <ng-template #noCorreosCriticos>
            <div class="text-center py-8">
              <div class="text-4xl mb-3">✅</div>
              <h4 class="font-medium text-gray-900 mb-2">Sin Correos Críticos Recientes</h4>
              <p class="text-sm text-gray-600">
                No hay correos de alta prioridad en los últimos 7 días.
                <br>Su situación tributaria está bajo control.
              </p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Estado Operacional Real -->
      <div class="estado-operacional bg-white rounded-lg p-6 shadow-sm border mb-8" *ngIf="metricas">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-800">⚡ Estado Operacional</h3>
          <div class="flex items-center space-x-2 text-sm">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-gray-600">Sincronizado {{ fechaActual | date:'HH:mm' }}</span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Correos Sin Clasificar -->
          <div class="estado-item p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-yellow-700 font-medium text-sm">Pendientes Clasificar</span>
              <span class="text-2xl">📥</span>
            </div>
            <div class="text-2xl font-bold text-yellow-700">
              {{ getCorreosSinClasificar() }}
            </div>
            <p class="text-xs text-yellow-600 mt-1">Requieren atención</p>
          </div>

          <!-- Correos Críticos -->
          <div class="estado-item p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-red-700 font-medium text-sm">Críticos Pendientes</span>
              <span class="text-2xl">🚨</span>
            </div>
            <div class="text-2xl font-bold text-red-700">
              {{ (metricas.resumenGeneral.multas + metricas.resumenGeneral.cobranzas) }}
            </div>
            <p class="text-xs text-red-600 mt-1">Multas y cobranzas</p>
          </div>

          <!-- Eficiencia Real -->
          <div class="estado-item p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-green-700 font-medium text-sm">Eficiencia IA</span>
              <span class="text-2xl">🎯</span>
            </div>
            <div class="text-2xl font-bold text-green-700">
              {{ getEficienciaClasificacion() }}%
            </div>
            <p class="text-xs text-green-600 mt-1">Clasificación automática</p>
          </div>

          <!-- Actividad Hoy -->
          <div class="estado-item p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="text-blue-700 font-medium text-sm">Nuevos Hoy</span>
              <span class="text-2xl">📬</span>
            </div>
            <div class="text-2xl font-bold text-blue-700">
              {{ metricas.resumenGeneral.correosNuevos }}
            </div>
            <p class="text-xs text-blue-600 mt-1">Último procesamiento</p>
          </div>
        </div>
        
        <!-- Indicadores de Rendimiento Real -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-sm font-medium text-gray-700">Rendimiento del Sistema:</span>
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-1">
                  <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span class="text-xs text-gray-600">Gemini AI Activo</span>
                </div>
                <div class="flex items-center space-x-1">
                  <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span class="text-xs text-gray-600">{{ metricas.resumenGeneral.totalCorreos }} correos procesados</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-medium text-gray-700">{{ getTendenciaLabel() }}</div>
              <div class="text-xs text-gray-500">vs. período anterior</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Análisis Predictivo IA Mejorado -->
      <div class="analisis-predictivo bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border" *ngIf="analisisPredictivo && analisisPredictivo.candidates">
        <h3 class="text-lg font-semibold text-gray-800 mb-6">🔮 Análisis Predictivo con Gemini AI</h3>
        
        <!-- Score de Cumplimiento Principal -->
        <div class="score-principal mb-6 text-center bg-white rounded-lg p-4">
          <div class="flex items-center justify-center space-x-6">
            <div 
              class="score-circle w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
              [ngClass]="{
                'bg-green-500': getScoreFromAnalysis() >= 80,
                'bg-yellow-500': getScoreFromAnalysis() >= 60 && getScoreFromAnalysis() < 80,
                'bg-red-500': getScoreFromAnalysis() < 60
              }">
              {{ getScoreFromAnalysis() }}
            </div>
            <div class="text-left">
              <h4 class="text-xl font-bold text-gray-800">{{ getNivelRiesgoFromAnalysis() }}</h4>
              <p class="text-sm text-gray-600">Nivel de Riesgo Tributario</p>
              <div class="mt-2">
                <span 
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  [ngClass]="{
                    'bg-green-100 text-green-800': getScoreFromAnalysis() >= 80,
                    'bg-yellow-100 text-yellow-800': getScoreFromAnalysis() >= 60 && getScoreFromAnalysis() < 80,
                    'bg-red-100 text-red-800': getScoreFromAnalysis() < 60
                  }">
                  {{ getScoreFromAnalysis() >= 80 ? '✅ Excelente' : getScoreFromAnalysis() >= 60 ? '⚠️ Mejorable' : '🚨 Crítico' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Predicciones Inteligentes -->
          <div class="predicciones-section">
            <h4 class="font-semibold text-gray-800 mb-4 flex items-center">
              <span class="mr-2">📊</span> Predicciones Inteligentes
            </h4>
            <div class="space-y-3">
              <div 
                *ngFor="let prediccion of getPrediccionesFormateadas()" 
                class="prediccion-card bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <h5 class="font-medium text-gray-800 text-sm mb-1">{{ prediccion.titulo }}</h5>
                <p class="text-sm text-gray-600">{{ prediccion.contenido }}</p>
              </div>
            </div>
          </div>

          <!-- Recomendaciones IA -->
          <div class="recomendaciones-section">
            <h4 class="font-semibold text-gray-800 mb-4 flex items-center">
              <span class="mr-2">💡</span> Recomendaciones IA
            </h4>
            <ul class="space-y-2 list-none">
              <li 
                *ngFor="let recomendacion of getRecomendacionesFormateadas()" 
                class="recomendacion-item bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500 flex items-start hover:shadow-md transition-shadow">
                <span class="text-green-500 mr-3 mt-0.5 text-lg">•</span>
                <p class="text-sm text-gray-700 leading-relaxed">{{ recomendacion }}</p>
              </li>
            </ul>
          </div>
        </div>

        <!-- Patrones Identificados -->
        <div class="patrones-section mt-6 bg-white rounded-lg p-4" *ngIf="getPatronesFromAnalysis()">
          <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
            <span class="mr-2">🔍</span> Patrones Identificados por IA
          </h4>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-700 leading-relaxed">
              {{ getPatronesFromAnalysis() }}
            </p>
          </div>
        </div>

        <!-- Información Técnica -->
        <div class="info-tecnica mt-4 text-center">
          <p class="text-xs text-gray-500">
            🤖 Análisis generado por Gemini AI • 
            Tokens utilizados: {{ analisisPredictivo.usageMetadata?.totalTokenCount || 'N/A' }} • 
            Modelo: {{ analisisPredictivo.modelVersion || 'gemini-1.5-flash' }}
          </p>
        </div>
      </div>      <div class="analisis-vacio bg-gray-100 rounded-lg p-8 text-center" *ngIf="!analisisPredictivo || !analisisPredictivo.candidates">
        <div class="text-4xl mb-4">🔮</div>
        <h3 class="text-lg font-medium text-gray-600 mb-2">Análisis Predictivo</h3>
        <p class="text-sm text-gray-500">Cargando análisis inteligente...</p>
      </div>

      <!-- Chat Flotante del Asistente Virtual -->
      <div class="chat-flotante fixed bottom-6 right-6 z-50">
        <button 
          (click)="abrirAsistenteVirtual()"
          class="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title="Abrir Asistente Virtual Contable">
          <span class="text-2xl">🤖</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .metrica-card:hover {
      transform: translateY(-2px);
      transition: transform 0.2s ease-in-out;
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }

    .metrica-card.cursor-pointer:hover {
      transform: translateY(-4px) scale(1.02);
      transition: all 0.3s ease;
      box-shadow: 0 12px 35px rgba(0,0,0,0.15);
      border-color: #3B82F6;
    }

    .metrica-card.cursor-pointer:active {
      transform: translateY(-2px) scale(1.01);
      transition: all 0.1s ease;
    }

    .alerta-card:hover {
      transform: translateX(4px);
      transition: transform 0.2s ease-in-out;
    }

    .etiqueta-item:hover {
      transform: scale(1.02);
      transition: transform 0.2s ease-in-out;
    }

    .score-circle {
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .status-badge {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .correo-item {
      transition: all 0.3s ease;
    }

    .correo-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .grafico-barra {
      transition: all 0.3s ease;
    }    .grafico-barra:hover {
      transform: scaleY(1.05);
      transform-origin: bottom;
    }

    /* Estilos para el chat flotante */
    .chat-flotante {
      z-index: 1000;
    }

    .chat-flotante button {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      animation: floatPulse 3s ease-in-out infinite;
    }

    .chat-flotante button:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    }

    @keyframes floatPulse {
      0%, 100% {
        transform: translateY(0px) scale(1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      50% {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      }
    }

    /* Responsive para el chat flotante */
    @media (max-width: 768px) {
      .chat-flotante {
        bottom: 20px;
        right: 20px;
      }
      
      .chat-flotante button {
        width: 3rem;
        height: 3rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  metricas: MetricasPrinciipales | null = null;
  alertas: Alerta[] = [];
  distribucionEtiquetas: DatosGraficoDistribucion[] = [];
  correosCriticos: CorreoCritico[] = [];
  analisisPredictivo: any = null;
  rankingNotificaciones: any[] = [];  // Nueva variable para el ranking
  
  cargando = false;
  fechaActual = new Date();
  rucActual = '';
  
  private actualizacionSubscription?: Subscription;
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.inicializar();
    this.configurarActualizacionAutomatica();
  }

  ngOnDestroy() {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  volverAPanelEmail() {
    this.router.navigate(['/panel-email']);
  }

  private inicializar() {
    const userData = this.authService.getUserData();
    if (userData?.ruc) {
      this.rucActual = userData.ruc;
      this.cargarDatosDashboard();
    }
  }

  private configurarActualizacionAutomatica() {
    // Actualizar cada 5 minutos
    this.actualizacionSubscription = interval(300000)
      .pipe(
        switchMap(() => this.cargarDatosDashboardObservable()),
        catchError(error => {
          console.error('Error en actualización automática:', error);
          return of(null);
        })
      )
      .subscribe();
  }

  actualizarDatos() {
    this.cargarDatosDashboard();
  }

  abrirAsistenteVirtual() {
    // Navegación a la ruta del asistente virtual
    window.open('/asistente-virtual', '_blank');
  }

  private cargarDatosDashboardObservable(): Observable<any> {
    if (!this.rucActual) return of(null);

    return this.http.get<any>(`${this.apiUrl}/dashboard/metricas-principales?ruc=${this.rucActual}`)
      .pipe(
        catchError(error => {
          console.error('Error al cargar métricas:', error);
          return of(null);
        })
      );
  }

  private cargarDatosDashboard() {
    if (!this.rucActual) return;

    this.cargando = true;
    this.fechaActual = new Date();

    // Cargar métricas principales
    this.http.get<any>(`${this.apiUrl}/dashboard/metricas-principales?ruc=${this.rucActual}`)
      .subscribe({
        next: (response) => {
          if (response.nu_codigo === 200) {
            this.metricas = response.datos;
            this.cargarDatosAdicionales();
          }
        },
        error: (error) => {
          console.error('Error al cargar métricas:', error);
          this.cargando = false;
        }
      });
  }

  private cargarDatosAdicionales() {
    // Cargar alertas críticas (opcional - se maneja el error 404 de forma elegante)
    this.http.get<any>(`${this.apiUrl}/dashboard/alertas-criticas?ruc=${this.rucActual}`)
      .subscribe({
        next: (response) => {
          if (response.nu_codigo === 200) {
            this.alertas = response.datos || [];
          }
        },
        error: (error) => {
          console.warn('⚠️ Endpoint de alertas críticas no implementado:', error.status);
          // Usar alertas predeterminadas si la API no está disponible
          this.alertas = [];
        }
      });

    // Cargar correos críticos recientes
    this.cargarCorreosCriticos();

    // Cargar ranking de notificaciones SUNAT (NUEVO)
    this.cargarRankingNotificaciones();

    // Cargar tendencias mensuales (opcional - se maneja el error 404 de forma elegante)
    this.http.get<any>(`${this.apiUrl}/dashboard/tendencias-mensuales?ruc=${this.rucActual}`)
      .subscribe({
        next: (response) => {
          if (response.nu_codigo === 200) {
            // Simular distribución por etiquetas basada en las tendencias
            this.distribucionEtiquetas = this.procesarDistribucionEtiquetas(response.datos);
          }
        },
        error: (error) => {
          console.warn('⚠️ Endpoint de tendencias mensuales no implementado:', error.status);
          // Usar datos predeterminados si la API no está disponible
          this.distribucionEtiquetas = this.generarDistribucionPredeterminada();
        }
      });

    // Cargar análisis predictivo
    this.http.get<any>(`${this.apiUrl}/dashboard/analisis-predictivo?ruc=${this.rucActual}`)
      .subscribe({
        next: (response) => {
          if (response.nu_codigo === 200) {
            console.log('Análisis predictivo recibido:', response.datos);
            this.analisisPredictivo = response.datos;
          }
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar análisis predictivo:', error);
          this.cargando = false;
        }
      });
  }

  private procesarDistribucionEtiquetas(tendencias: any): DatosGraficoDistribucion[] {
    if (!tendencias || !tendencias.distribucionTipos) {
      return [];
    }

    const colores = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316'];
    let colorIndex = 0;

    return Object.entries(tendencias.distribucionTipos).map(([tipo, cantidad]) => ({
      codigo: tipo,
      nombre: this.obtenerNombreTipo(tipo),
      cantidad: cantidad as number,
      porcentaje: Math.round(((cantidad as number) / tendencias.totalMensajes) * 100),
      color: colores[colorIndex++ % colores.length]
    }));
  }

  private generarDistribucionPredeterminada(): DatosGraficoDistribucion[] {
    // Datos predeterminados cuando la API no está disponible
    return [
      { codigo: 'MUY_IMPORTANTE', nombre: 'Muy Importantes', cantidad: 14, porcentaje: 10, color: '#EF4444' },
      { codigo: 'IMPORTANTE', nombre: 'Importantes', cantidad: 0, porcentaje: 0, color: '#F59E0B' },
      { codigo: 'RECURRENTE', nombre: 'Recurrentes', cantidad: 123, porcentaje: 90, color: '#10B981' }
    ];
  }

  private obtenerNombreTipo(tipo: string): string {
    const nombres: { [key: string]: string } = {
      'MUY_IMPORTANTE': 'Muy Importantes',
      'IMPORTANTE': 'Importantes', 
      'RECURRENTE': 'Recurrentes',
      'MULTA': 'Multas',
      'COBRANZA': 'Cobranzas',
      'FISCALIZACION': 'Fiscalizaciones'
    };
    return nombres[tipo] || tipo;
  }

  // Métodos para el gráfico de barras
  getBarHeight(valor: number, total: number): number {
    if (total === 0) return 20;
    const percentage = (valor / total) * 100;
    return Math.max(20, (percentage / 100) * 200); // Altura máxima de 200px
  }

  getPercentage(valor: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((valor / total) * 100);
  }

  // Nuevo método para obtener solo el total de clasificaciones
  getTotalClasificaciones(): number {
    if (!this.metricas) return 0;
    return (this.metricas.resumenGeneral.muyImportantes || 0) +
           (this.metricas.resumenGeneral.importantes || 0) +
           (this.metricas.resumenGeneral.recurrentes || 0) +
           this.getSinClasificar();
  }

  // Método para calcular correos sin clasificar
  getSinClasificar(): number {
    if (!this.metricas) return 0;
    const totalClasificados = (this.metricas.resumenGeneral.muyImportantes || 0) +
                             (this.metricas.resumenGeneral.importantes || 0) +
                             (this.metricas.resumenGeneral.recurrentes || 0);
    const totalCorreos = this.metricas.resumenGeneral.totalCorreos || 0;
    return Math.max(0, totalCorreos - totalClasificados);
  }

  getTrendEmoji(tendencia: string): string {
    switch (tendencia) {
      case 'subiendo': return '📈';
      case 'bajando': return '📉';
      case 'estable': return '➡️';
      default: return '📊';
    }
  }

  getTrendText(tendencia: string): string {
    switch (tendencia) {
      case 'subiendo': return 'Al Alza';
      case 'bajando': return 'A la Baja';
      case 'estable': return 'Estable';
      default: return 'Sin Datos';
    }
  }  // Métodos para procesar datos de Gemini AI - MEJORADOS PARA MANEJAR FALLBACK
  getScoreFromAnalysis(): number {
    console.log('🔍 Análisis predictivo completo:', this.analisisPredictivo);
    
    // Opción 1: Score directo del análisis (fallback)
    if (this.analisisPredictivo?.scoreCompliance) {
      console.log('✅ Score desde fallback:', this.analisisPredictivo.scoreCompliance);
      return this.analisisPredictivo.scoreCompliance;
    }
    
    // Opción 2: Score desde Gemini AI
    if (this.analisisPredictivo?.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const content = this.analisisPredictivo.candidates[0].content.parts[0].text;
        console.log('📄 Contenido del análisis de score:', content);
        
        const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          console.log('📊 Datos parseados del score:', data);
          if (data.scoreCompliance) {
            console.log('✅ Score desde Gemini:', data.scoreCompliance);
            return data.scoreCompliance;
          }
        }
      } catch (e) {
        console.error('❌ Error al extraer score de Gemini:', e);
      }
    }
    
    console.log('⚠️ Usando score por defecto');
    return 75; // Valor por defecto
  }  getNivelRiesgoFromAnalysis(): string {
    console.log('🔍 Buscando nivel de riesgo...');
    
    // Opción 1: Nivel de riesgo directo del análisis (fallback)
    if (this.analisisPredictivo?.nivelRiesgo) {
      console.log('✅ Nivel de riesgo desde fallback:', this.analisisPredictivo.nivelRiesgo);
      return this.analisisPredictivo.nivelRiesgo;
    }
    
    // Opción 2: Nivel de riesgo desde Gemini AI
    if (this.analisisPredictivo?.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const content = this.analisisPredictivo.candidates[0].content.parts[0].text;
        const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          console.log('📊 Datos parseados del nivel de riesgo:', data);
          if (data.nivelRiesgo) {
            console.log('✅ Nivel de riesgo desde Gemini:', data.nivelRiesgo);
            return data.nivelRiesgo;
          }
        }
      } catch (e) {
        console.error('❌ Error al extraer nivel de riesgo:', e);
      }
    }
    
    // Opción 3: Desde patrones de Gemini
    if (this.analisisPredictivo?.patrones?.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const content = this.analisisPredictivo.patrones.candidates[0].content.parts[0].text;
        const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          if (data.nivelRiesgoActual) {
            console.log('✅ Nivel de riesgo desde patrones Gemini:', data.nivelRiesgoActual);
            return data.nivelRiesgoActual;
          }
        }
      } catch (e) {
        console.error('❌ Error al extraer nivel de riesgo de patrones:', e);
      }
    }
    
    // Opción 4: Calcular basado en el score
    const score = this.getScoreFromAnalysis();
    console.log('📊 Calculando nivel de riesgo basado en score:', score);
    if (score >= 80) return 'BAJO';
    if (score >= 60) return 'MEDIO';
    return 'ALTO';
  }  getPrediccionesFormateadas(): any[] {
    console.log('🔍 Buscando predicciones...');
    
    // Opción 1: Predicciones desde fallback
    if (this.analisisPredictivo?.predicciones && !this.analisisPredictivo?.predicciones?.candidates) {
      console.log('✅ Predicciones desde fallback');
      const pred = this.analisisPredictivo.predicciones;
      return [
        { titulo: 'Próxima Semana', contenido: pred.proximaSemana || 'Sin predicción' },
        { titulo: 'Alerta Fiscalización', contenido: pred.alertaFiscalizacion || 'Sin alerta' },
        { titulo: 'Tendencia Multas', contenido: pred.tendenciaMultas || 'Sin tendencia' }
      ];
    }
    
    // Opción 2: Predicciones desde Gemini AI
    if (this.analisisPredictivo?.predicciones?.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const content = this.analisisPredictivo.predicciones.candidates[0].content.parts[0].text;
        console.log('📄 Contenido de predicciones Gemini:', content);
        
        const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          console.log('📊 Datos de predicciones parseados:', data);
          
          const predicciones = [
            { titulo: 'Próxima Semana', contenido: data.proximaSemana || 'Sin predicción' },
            { titulo: 'Alerta Fiscalización', contenido: data.alertaFiscalizacion || 'Sin alerta' },
            { titulo: 'Tendencia Multas', contenido: data.tendenciaMultas || 'Sin tendencia' },
            { titulo: 'Recomendación Urgente', contenido: data.recomendacionUrgente || 'Sin recomendaciones' }
          ];
          
          console.log('✅ Predicciones formateadas desde Gemini:', predicciones);
          return predicciones;
        }
      } catch (e) {
        console.error('❌ Error al extraer predicciones:', e);
      }
    }
    
    // Predicciones por defecto
    console.log('⚠️ Usando predicciones por defecto');
    return [
      { titulo: 'Próxima Semana', contenido: 'Se esperan nuevas notificaciones según patrón histórico' },
      { titulo: 'Alerta Fiscalización', contenido: 'Probabilidad baja de fiscalización inmediata' },
      { titulo: 'Tendencia Multas', contenido: 'Mantener seguimiento de obligaciones pendientes' },
      { titulo: 'Recomendación Urgente', contenido: 'Revisar documentación tributaria' }    ];
  }

  getRecomendacionesFormateadas(): string[] {
    console.log('🔍 Análisis predictivo completo:', this.analisisPredictivo);
    
    // Opción 1: Recomendaciones directas desde fallback
    if (this.analisisPredictivo?.recomendaciones && Array.isArray(this.analisisPredictivo.recomendaciones)) {
      console.log('✅ Recomendaciones encontradas directamente desde fallback:', this.analisisPredictivo.recomendaciones);
      return this.analisisPredictivo.recomendaciones.map((item: string) => 
        this.limpiarRecomendacion(item)
      );
    }
    
    // Opción 2: Desde candidates[0] (score de compliance de Gemini)
    if (this.analisisPredictivo?.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const content = this.analisisPredictivo.candidates[0].content.parts[0].text;
        console.log('📄 Contenido del análisis Gemini:', content);
        
        const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          console.log('📊 Datos parseados:', data);

          if (data.areasMejora && Array.isArray(data.areasMejora) && data.areasMejora.length > 0) {
            console.log('✅ Recomendaciones encontradas en areasMejora:', data.areasMejora);
            const recomendacionesProcesadas: string[] = [];
            data.areasMejora.forEach((item: string) => {
              const procesadas = this.procesarTextoRecomendaciones(item);
              recomendacionesProcesadas.push(...procesadas);
            });
            return recomendacionesProcesadas;
          }

          if (data.areasMejora && typeof data.areasMejora === 'string') {
            const recomendaciones = this.procesarTextoRecomendaciones(data.areasMejora);
            if (recomendaciones.length > 0) {
              console.log('✅ Recomendaciones extraídas del texto:', recomendaciones);
              return recomendaciones;
            }
          }        }
      } catch (e) {
        console.error('❌ Error al extraer recomendaciones de Gemini:', e);
      }
    }
    
    // Opción 3: Recomendaciones predeterminadas si no se encuentran
    console.log('⚠️ No se encontraron recomendaciones, usando valores por defecto');
    return [
      'Revisar notificaciones recurrentes y atender las pendientes',
      'Implementar un sistema de seguimiento de obligaciones tributarias',
      'Consultar con un asesor tributario para resolver situaciones coactivas',
      'Establecer alertas preventivas para evitar futuras multas',
      'Mantener actualizada la documentación contable y tributaria'
    ];
  }
  getPatronesFromAnalysis(): string {
    // Opción 1: Patrones desde fallback
    if (this.analisisPredictivo?.patrones && !this.analisisPredictivo?.patrones?.candidates) {
      const patrones = this.analisisPredictivo.patrones;
      return patrones.tendenciaGeneral || patrones.observacionesClave || '';
    }
    
    // Opción 2: Patrones desde Gemini AI
    if (this.analisisPredictivo?.patrones?.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const content = this.analisisPredictivo.patrones.candidates[0].content.parts[0].text;
        const jsonMatch = content.match(/```json\s*({[\s\S]*?})\s*```/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1]);
          return data.tendenciaGeneral || data.observacionesClave || '';
        }
      } catch (e) {
        console.error('Error al extraer patrones:', e);
      }
    }
    
    return '';
  }

  // Métodos para correos críticos
  getPrioridadLabel(prioridad: string): string {
    const labels: { [key: string]: string } = {
      'MUY_IMPORTANTE': 'Muy Importante',
      'IMPORTANTE': 'Importante',
      'RECURRENTE': 'Recurrente'
    };
    return labels[prioridad] || prioridad;
  }

  getTipoMensajeIcon(tipoMensaje: number): string {
    // Mapeo de tipos de mensaje a iconos
    const iconos: { [key: number]: string } = {
      1: '📋', // General
      2: '💰', // Cobranza
      3: '🔍', // Fiscalización
      4: '⚖️', // Resolución
      5: '📊', // Reportes
      6: '⚠️'  // Multas
    };
    return iconos[tipoMensaje] || '📧';
  }

  getTipoMensajeLabel(tipoMensaje: number): string {
    const labels: { [key: number]: string } = {
      1: 'Mensaje General',
      2: 'Cobranza',
      3: 'Fiscalización',
      4: 'Resolución',
      5: 'Reporte',
      6: 'Multa'
    };
    return labels[tipoMensaje] || 'Mensaje';
  }

  verDetalleCorreo(correo: CorreoCritico): void {
    // Implementar navegación al detalle del correo
    console.log('Ver detalle del correo:', correo);
    // this.router.navigate(['/notificacion', correo.codigoMensaje]);
  }

  abrirCorreo(correo: CorreoCritico): void {
    console.log('🔍 Abriendo correo desde dashboard:', correo);
    
    // Limpiar localStorage previo
    localStorage.removeItem('correoSeleccionado');
    localStorage.removeItem('correoAsunto');
    localStorage.removeItem('correoFechaEnvio');
    localStorage.removeItem('origenDashboard');
    
    // Guardar información del correo seleccionado
    localStorage.setItem('correoSeleccionado', correo.codigoMensaje.toString());
    localStorage.setItem('correoAsunto', correo.asunto);
    localStorage.setItem('correoFechaEnvio', correo.fechaEnvio);
    localStorage.setItem('origenDashboard', 'true');
    localStorage.setItem('mostrarCorreoEspecifico', 'true');
    
    console.log('💾 Datos del correo guardados en localStorage');
    
    // Navegar al panel de email
    this.router.navigate(['/panel-email']).then(() => {
      console.log('✅ Navegación completada al panel de email');
      
      // Forzar selección del correo después de un pequeño delay
      setTimeout(() => {
        const evento = new CustomEvent('seleccionarCorreoEspecifico', { 
          detail: { 
            codigoMensaje: correo.codigoMensaje,
            asunto: correo.asunto,
            fechaEnvio: correo.fechaEnvio
          } 
        });
        window.dispatchEvent(evento);
        console.log('📨 Evento de selección de correo enviado');
      }, 1000);
    }).catch(error => {
      console.error('❌ Error en navegación:', error);
    });
  }

  private cargarCorreosCriticos(): void {
    // Usar el nuevo endpoint específico para correos críticos
    this.http.get<any>(`${this.apiUrl}/dashboard/correos-criticos?ruc=${this.rucActual}&dias=7&limite=5`)
      .subscribe({
        next: (response) => {
          if (response.nu_codigo === 200 && response.datos) {
            this.correosCriticos = response.datos;
            console.log('✅ Correos críticos cargados:', this.correosCriticos.length);
          } else {
            console.warn('⚠️ No se encontraron correos críticos');
            this.correosCriticos = [];
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar correos críticos:', error);
          this.correosCriticos = [];
        }
      });
  }

  private cargarRankingNotificaciones(): void {
    // Cargar ranking de notificaciones usando el endpoint existente
    this.http.get<any>(`${this.apiUrl}/dashboard/ranking-notificaciones?ruc=${this.rucActual}&dias=90`)
      .subscribe({
        next: (response) => {
          if (response.nu_codigo === 200 && response.datos) {
            this.rankingNotificaciones = response.datos;
            console.log('✅ Ranking de notificaciones cargado:', this.rankingNotificaciones.length);
          } else {
            console.warn('⚠️ No se encontró ranking de notificaciones');
            this.rankingNotificaciones = [];
          }
        },
        error: (error) => {
          console.error('❌ Error al cargar ranking de notificaciones:', error);
          this.rankingNotificaciones = [];
        }
      });
  }

  // Método para navegar a correos específicos por clasificación
  navegarACorreos(clasificacion: string): void {
    console.log('🎯 Navegando a correos de tipo:', clasificacion);
    
    // Guardar la clasificación en localStorage para que el panel la use
    localStorage.setItem('filtroClasificacion', clasificacion);
    localStorage.setItem('origenDashboard', 'true');
    
    // Mapear las clasificaciones del dashboard a las del panel de email
    let clasificacionPanel = '';
    switch (clasificacion) {
      case 'MUY_IMPORTANTE':
        clasificacionPanel = 'MUY IMPORTANTE';
        break;
      case 'FISCALIZACION':
        // Para fiscalizaciones, buscaremos en el contenido del asunto
        localStorage.setItem('buscarFiscalizacion', 'true');
        clasificacionPanel = '';
        break;
      case 'MULTA':
        // Para multas, buscaremos en el contenido del asunto
        localStorage.setItem('buscarMulta', 'true');
        clasificacionPanel = '';
        break;
      default:
        clasificacionPanel = clasificacion;
    }
    
    if (clasificacionPanel) {
      localStorage.setItem('clasificacionPanel', clasificacionPanel);
    }
    
    console.log('💾 Datos guardados para filtrar correos');
    
    // Navegar al panel de email
    this.router.navigate(['/panel-email']).then(() => {
      console.log('✅ Navegación completada, aplicando filtros');
      // Dar tiempo para que cargue y luego aplicar filtros
      setTimeout(() => {
        // Disparar evento para aplicar filtros
        window.dispatchEvent(new CustomEvent('aplicarFiltroClasificacion', { 
          detail: { clasificacion: clasificacionPanel, tipo: clasificacion } 
        }));
      }, 1500);
    });
  }

  /**
   * Procesa texto de recomendaciones y las divide en elementos separados
   */
  private procesarTextoRecomendaciones(texto: string): string[] {
    // Intentar dividir por números (1. 2. 3. etc.)
    let recomendaciones = texto.split(/\d+\.\s+/)
      .filter((r: string) => r.trim().length > 0)
      .map((r: string) => this.limpiarRecomendacion(r));

    // Si no se encontraron números, intentar dividir por otros separadores
    if (recomendaciones.length <= 1) {
      recomendaciones = texto.split(/\n[-*•]\s*/)
        .filter((r: string) => r.trim().length > 0)
        .map((r: string) => this.limpiarRecomendacion(r));
    }

    // Si todavía no se dividió bien, intentar dividir por saltos de línea
    if (recomendaciones.length <= 1) {
      recomendaciones = texto.split(/\n/)
        .filter((r: string) => r.trim().length > 0)
        .map((r: string) => this.limpiarRecomendacion(r));
    }

    return recomendaciones.filter(r => r.length > 0);
  }

  getInsightRanking(): string {
    if (!this.rankingNotificaciones || this.rankingNotificaciones.length === 0) {
      return 'Analizando patrones de notificaciones...';
    }

    const primerTipo = this.rankingNotificaciones[0];
    const total = this.rankingNotificaciones.reduce((sum, item) => sum + item.cantidad, 0);

    if (primerTipo.porcentaje > 50) {
      return `El ${primerTipo.porcentaje}% de tus notificaciones son de tipo "${primerTipo.nombre}". Considera automatizar el procesamiento de este tipo de correos.`;
    } else if (this.rankingNotificaciones.length >= 3) {
      const top3Porcentaje = this.rankingNotificaciones.slice(0, 3).reduce((sum, item) => sum + item.porcentaje, 0);
      return `Los 3 tipos principales representan el ${top3Porcentaje}% de todas las notificaciones. Enfócate en optimizar el manejo de estos tipos para mayor eficiencia.`;
    } else {
      return `Has recibido ${total} notificaciones distribuidas en ${this.rankingNotificaciones.length} tipos diferentes. "${primerTipo.nombre}" es el más frecuente.`;
    }
  }
  getEficienciaClasificacion(): number {
    if (!this.metricas) return 0;
    
    const total = this.metricas.resumenGeneral.totalCorreos;
    if (total === 0) return 0;
    
    // Calcular basado en TODOS los correos clasificados
    const clasificados = this.metricas.resumenGeneral.muyImportantes + 
                         this.metricas.resumenGeneral.importantes +
                         this.metricas.resumenGeneral.recurrentes;
    
    return Math.round((clasificados / total) * 100);
  }

  getRecomendacionInteligente(): string {
    if (!this.metricas) return 'Cargando análisis...';
    
    const multas = this.metricas.resumenGeneral.multas;
    const cobranzas = this.metricas.resumenGeneral.cobranzas;
    const total = this.metricas.resumenGeneral.totalCorreos;
    const eficiencia = this.getEficienciaClasificacion();
    
    if (multas > 10 && cobranzas > 5) {
      return `Situación crítica: ${multas} multas y ${cobranzas} cobranzas activas. Prioriza el pago de multas para evitar procedimientos coactivos.`;
    } else if (multas > 5) {
      return `Atención requerida: ${multas} multas pendientes. Considera opciones de fraccionamiento o impugnación según corresponda.`;
    } else if (cobranzas > 3) {
      return `${cobranzas} procedimientos de cobranza activos. Revisa el estado y opciones de regularización disponibles.`;
    } else if (eficiencia < 30) {
      return `Solo el ${eficiencia}% de correos están clasificados. Revisa los correos sin etiquetar para identificar asuntos importantes.`;
    } else if (total > 100) {
      return `Excelente gestión: ${total} correos organizados eficientemente. Mantén la clasificación actualizada para mejores resultados.`;
    } else {
      return 'Tu gestión tributaria está en orden. Continúa monitoreando las notificaciones de SUNAT regularmente.';
    }
  }

  /**
   * Limpia una recomendación eliminando asteriscos, guiones y otros caracteres de formato
   */
  private limpiarRecomendacion(recomendacion: string): string {
    return recomendacion
      .replace(/^\*+\s*/, '')           // Eliminar asteriscos al inicio
      .replace(/\*+$/, '')              // Eliminar asteriscos al final
      .replace(/^\-+\s*/, '')           // Eliminar guiones al inicio
      .replace(/\-+$/, '')              // Eliminar guiones al final
      .replace(/\*\*/g, '')             // Eliminar asteriscos dobles
      .replace(/\*/g, '')               // Eliminar asteriscos simples restantes      .replace(/^\d+\.\s*/, '')         // Eliminar numeración (1. 2. etc.)
      .replace(/^[-•]\s*/, '')          // Eliminar viñetas
      .trim();                          // Eliminar espacios en blanco
  }

  // Métodos para el nuevo Estado Operacional
  getCorreosSinClasificar(): number {
    if (!this.metricas) return 0;
    
    const total = this.metricas.resumenGeneral.totalCorreos;
    // Contar TODOS los correos clasificados (incluyendo RECURRENTES)
    const clasificados = this.metricas.resumenGeneral.muyImportantes + 
                         this.metricas.resumenGeneral.importantes +
                         this.metricas.resumenGeneral.recurrentes;
    
    return Math.max(0, total - clasificados);
  }

  getTendenciaLabel(): string {
    if (!this.metricas) return 'Sin datos';
    
    const tendencia = this.metricas.resumenGeneral.tendenciaSemanal;
    
    switch (tendencia) {
      case 'subiendo':
        return '📈 Incremento semanal';
      case 'bajando':
        return '📉 Reducción semanal';
      case 'estable':
        return '➡️ Estable';
      default:
        return '📊 Evaluando tendencia';
    }
  }
}