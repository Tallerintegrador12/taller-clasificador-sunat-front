import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {EmailClientComponent} from './components/email-client/email-client.component';
import {EmailPanelComponent} from './components/email-panel/email-panel.component';
import { ToastNotificacionesComponent } from './components/toast-notificaciones/toast-notificaciones.component';
import { NotificacionService } from './services/notificacion.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastNotificacionesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'notificador-sunat-front';

  constructor(private notificacionService: NotificacionService) {}

  ngOnInit(): void {
    // Solo inicializar polling sin mostrar notificaciones automáticas
    this.inicializarSistemaNotificaciones();
  }

  ngOnDestroy(): void {
    // Limpiar polling al destruir el componente
    this.notificacionService.detenerPolling();
  }

  private inicializarSistemaNotificaciones(): void {
    console.log('🚀 Inicializando sistema de notificaciones...');
    
    // NO verificar correos automáticamente al cargar
    // Solo iniciar polling en segundo plano (sin notificaciones inmediatas)
    this.notificacionService.iniciarPolling(30);
    
    console.log('✅ Sistema de notificaciones iniciado (solo polling)');
  }

  /**
   * Método público para ser llamado después del login exitoso
   */
  public procesarNotificacionesPostLogin(ruc: string): void {
    console.log('🔓 Procesando notificaciones post-login para RUC:', ruc);
    this.notificacionService.verificarEstadisticasPostLogin(ruc);
  }
}
