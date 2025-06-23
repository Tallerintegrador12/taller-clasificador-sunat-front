import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-control-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-controls">
      <div class="controls-header">
        <h3>🔔 Notificaciones SUNAT</h3>
        <div class="status-indicator" [class.active]="pollingActivo">
          <span class="status-dot"></span>
          {{ pollingActivo ? 'Activo' : 'Inactivo' }}
        </div>
      </div>
      
      <div class="controls-buttons">
        <button 
          class="btn btn-primary" 
          (click)="verificarAhora()"
          [disabled]="verificando">
          {{ verificando ? '🔄 Verificando...' : '🔍 Verificar ahora' }}
        </button>
        
        <button 
          class="btn" 
          [class.btn-success]="!pollingActivo"
          [class.btn-danger]="pollingActivo"
          (click)="togglePolling()">
          {{ pollingActivo ? '⏹️ Detener' : '▶️ Iniciar' }} monitoreo
        </button>
        
        <button 
          class="btn btn-secondary" 
          (click)="limpiarNotificaciones()">
          🧹 Limpiar
        </button>
        
        <button 
          class="btn btn-info" 
          (click)="simularCorreo()">
          🧪 Simular
        </button>
      </div>
      
      <div class="info-panel" *ngIf="ultimaVerificacion">
        <small>
          📅 Última verificación: {{ ultimaVerificacion | date:'medium' }}
        </small>
      </div>
    </div>
  `,
  styles: [`
    .notification-controls {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .controls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .controls-header h3 {
      margin: 0;
      font-size: 16px;
      color: #374151;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #ef4444;
    }

    .status-indicator.active .status-dot {
      background-color: #10b981;
      animation: pulse 2s infinite;
    }

    .controls-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn:hover {
      background: #f9fafb;
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-success {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
      border-color: #6b7280;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .btn-info {
      background: #0ea5e9;
      color: white;
      border-color: #0ea5e9;
    }

    .btn-info:hover {
      background: #0284c7;
    }

    .info-panel {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
      text-align: center;
      color: #6b7280;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    @media (max-width: 640px) {
      .controls-buttons {
        flex-direction: column;
      }
      
      .btn {
        justify-content: center;
      }
    }
  `]
})
export class ControlNotificacionesComponent implements OnInit, OnDestroy {
  pollingActivo = false;
  verificando = false;
  ultimaVerificacion: Date | null = null;
  private subscription?: Subscription;

  constructor(private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.subscription = this.notificacionService.pollingActivo$.subscribe(
      activo => {
        this.pollingActivo = activo;
      }
    );
    
    // Obtener última verificación del localStorage
    const ultima = localStorage.getItem('sunat_ultima_verificacion');
    if (ultima) {
      this.ultimaVerificacion = new Date(parseInt(ultima));
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  verificarAhora(): void {
    this.verificando = true;
    this.notificacionService.obtenerCorreosNuevos().subscribe({
      next: () => {
        this.verificando = false;
        this.ultimaVerificacion = new Date();
        
        // Mostrar notificación de éxito
        this.notificacionService.agregarNotificacion({
          id: `verificacion-${Date.now()}`,
          titulo: '✅ Verificación completada',
          mensaje: 'Se han verificado los correos nuevos',
          tipo: 'success',
          emoji: '✅',
          duracion: 3000,
          visible: true
        });
      },
      error: () => {
        this.verificando = false;
        
        // Mostrar notificación de error
        this.notificacionService.agregarNotificacion({
          id: `error-${Date.now()}`,
          titulo: '❌ Error en verificación',
          mensaje: 'No se pudieron verificar los correos',
          tipo: 'error',
          emoji: '❌',
          duracion: 5000,
          visible: true
        });
      }
    });
  }

  togglePolling(): void {
    if (this.pollingActivo) {
      this.notificacionService.detenerPolling();
    } else {
      this.notificacionService.iniciarPolling(30);
    }
  }

  limpiarNotificaciones(): void {
    this.notificacionService.limpiarNotificaciones();
  }

  simularCorreo(): void {
    // Simular notificación de correo importante
    this.notificacionService.agregarNotificacion({
      id: `simulacion-${Date.now()}`,
      titulo: '🔴 Correo MUY IMPORTANTE',
      mensaje: 'RESOLUCIONES DE COBRANZAS: Notificación de embargo preventivo - RUC 20123456789',
      tipo: 'error',
      emoji: '🔴',
      duracion: 8000,
      visible: true
    });
    
    // Simular notificación de resumen
    setTimeout(() => {
      this.notificacionService.agregarNotificacion({
        id: `resumen-simulacion-${Date.now()}`,
        titulo: '📧 Resumen de correos nuevos',
        mensaje: '3 correos nuevos: 🔴 1 muy importantes, 🟡 1 importantes, 🟢 1 recurrentes',
        tipo: 'info',
        emoji: '📧',
        duracion: 6000,
        visible: true
      });
    }, 1000);
  }
}
