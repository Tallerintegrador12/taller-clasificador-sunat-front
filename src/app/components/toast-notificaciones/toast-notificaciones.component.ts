import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificacionService, NotificacionToast } from '../../services/notificacion.service';

@Component({
  selector: 'app-toast-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let notificacion of notificaciones; trackBy: trackByFn"
        class="toast"
        [class.toast-success]="notificacion.tipo === 'success'"
        [class.toast-info]="notificacion.tipo === 'info'"
        [class.toast-warning]="notificacion.tipo === 'warning'"
        [class.toast-error]="notificacion.tipo === 'error'"
        [class.toast-hide]="!notificacion.visible"
        [attr.data-id]="notificacion.id">
        
        <div class="toast-content">
          <div class="toast-icon">
            {{ notificacion.emoji }}
          </div>
          
          <div class="toast-text">
            <div class="toast-title">
              {{ notificacion.titulo }}
            </div>
            <div class="toast-message">
              {{ notificacion.mensaje }}
            </div>
          </div>
          
          <button 
            class="toast-close"
            (click)="cerrarNotificacion(notificacion.id)"
            aria-label="Cerrar notificación">
            ×
          </button>
        </div>
        
        <!-- Barra de progreso para indicar tiempo restante -->
        <div 
          *ngIf="notificacion.duracion && notificacion.duracion > 0"
          class="toast-progress"
          [style.animation-duration.ms]="notificacion.duracion">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      width: 100%;
    }

    .toast {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 12px;
      overflow: hidden;
      transform: translateX(100%);
      transition: all 0.3s ease-in-out;
      border-left: 4px solid #ccc;
      opacity: 0;
      animation: slideIn 0.3s ease-out forwards;
    }

    .toast.toast-hide {
      animation: slideOut 0.3s ease-in forwards;
    }

    .toast-success {
      border-left-color: #10B981;
    }

    .toast-info {
      border-left-color: #3B82F6;
    }

    .toast-warning {
      border-left-color: #F59E0B;
    }

    .toast-error {
      border-left-color: #EF4444;
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      gap: 12px;
    }

    .toast-icon {
      font-size: 24px;
      line-height: 1;
      flex-shrink: 0;
    }

    .toast-text {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      font-size: 14px;
      color: #374151;
      margin-bottom: 4px;
      line-height: 1.2;
    }

    .toast-message {
      font-size: 13px;
      color: #6B7280;
      line-height: 1.4;
      word-wrap: break-word;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #9CA3AF;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      flex-shrink: 0;
      transition: color 0.2s ease;
    }

    .toast-close:hover {
      color: #6B7280;
      background-color: #F3F4F6;
    }

    .toast-progress {
      height: 2px;
      background: linear-gradient(to right, #10B981, #059669);
      animation: progress linear;
      transform-origin: left;
    }

    .toast-success .toast-progress {
      background: linear-gradient(to right, #10B981, #059669);
    }

    .toast-info .toast-progress {
      background: linear-gradient(to right, #3B82F6, #2563EB);
    }

    .toast-warning .toast-progress {
      background: linear-gradient(to right, #F59E0B, #D97706);
    }

    .toast-error .toast-progress {
      background: linear-gradient(to right, #EF4444, #DC2626);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
        max-height: 200px;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
        max-height: 0;
        margin-bottom: 0;
        padding-top: 0;
        padding-bottom: 0;
      }
    }

    @keyframes progress {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .toast-container {
        left: 20px;
        right: 20px;
        max-width: none;
      }
      
      .toast-content {
        padding: 12px;
      }
      
      .toast-title {
        font-size: 13px;
      }
      
      .toast-message {
        font-size: 12px;
      }
    }
  `]
})
export class ToastNotificacionesComponent implements OnInit, OnDestroy {
  notificaciones: NotificacionToast[] = [];
  private subscription?: Subscription;

  constructor(private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.subscription = this.notificacionService.notificaciones$.subscribe(
      notificaciones => {
        this.notificaciones = notificaciones;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  cerrarNotificacion(id: string): void {
    this.notificacionService.ocultarNotificacion(id);
  }

  trackByFn(index: number, item: NotificacionToast): string {
    return item.id;
  }
}
