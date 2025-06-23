import {Component, ElementRef, HostListener, inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {MailService} from '../../services/mensaje-sunat.service';
import {Router} from '@angular/router';
import {Notificacion} from '../../models/notificacion';
import {NotificacionService} from '../../services/notificacion.service';
import {environment} from '../../../environments/environment';
import {UsuarioAutenticado} from '../../models/usuario';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {
  ResumenComprasVentasComponent
} from '../templates-email/resumen-compras-ventas/resumen-compras-ventas.component';
import {MensajeNormalComponent} from '../templates-email/mensaje-normal/mensaje-normal.component';
import {NotificacionDetalleComponent} from '../notificacion-detalle/notificacion-detalle.component';
import {
  NotificacionesAnterioresComponent
} from '../templates-email/notificaciones-anteriores/notificaciones-anteriores.component';
import {
  ResolucionesFiscalizacionComponent
} from '../templates-email/resoluciones-fiscalizacion/resoluciones-fiscalizacion.component';
import {
  ResolucionesContenciosasComponent
} from '../templates-email/resoluciones-contenciosas/resoluciones-contenciosas.component';
import {ResolucionesCobranzaComponent} from '../templates-email/resoluciones-cobranza/resoluciones-cobranza.component';
import {ValoresComponent} from '../templates-email/valores/valores.component';
import {ComprobantesRheComponent} from '../templates-email/comprobantes-rhe/comprobantes-rhe.component';
import {ComprobantesRheFeComponent} from '../templates-email/comprobantes-rhe-fe/comprobantes-rhe-fe.component';


// Interfaces basadas en tu API
interface MensajeSunat {
  nu_codigo_mensaje: number;
  nu_pagina: number;
  nu_estado: number;
  nu_destacado: number;
  nu_urgente: number;
  dt_fecha_vigencia: string;
  nu_tipo_mensaje: number;
  vc_asunto: string;
  vc_fecha_envio: string;
  vc_fecha_publica: string;
  vc_usuario_emisor: string;
  nu_indicador_texto: number;
  nu_tipo_generador: number;
  vc_codigo_dependencia: string;
  nu_aviso: number;
  nu_cantidad_archivos: number;
  vc_codigo_etiqueta: string;
  nu_mensaje: number;
  vc_codigo_carpeta: string;
  vc_numero_ruc: string;
  nu_leido: number;
  nu_archivado: number;
  clasificacion?: string; // <--- NUEVO CAMPO
}

interface Etiqueta {
  nu_id_etiqueta: number;
  vc_nombre: string;
  vc_color: string;
  vc_codigo: string;
}

interface RespuestaControlador<T> {
  vc_mensaje: string;
  nu_codigo: number;
  datos: T;
  vc_errores: string[];
}

@Component({
  selector: 'app-email-panel',
  imports: [CommonModule, FormsModule, ResumenComprasVentasComponent, MensajeNormalComponent, NotificacionesAnterioresComponent, ResolucionesFiscalizacionComponent, ResolucionesContenciosasComponent, ResolucionesCobranzaComponent, ValoresComponent, ComprobantesRheComponent, ComprobantesRheFeComponent],
  templateUrl: './email-panel.component.html',
  styleUrl: './email-panel.component.css'
})
export class EmailPanelComponent implements OnInit, OnDestroy {
  @ViewChild('mailList') mailListRef!: ElementRef;

  // API Base URL
  private apiUrl = environment.apiUrl;
  currentUser: UsuarioAutenticado | null = null;
  private userSubscription: Subscription = new Subscription();

  @Input() msjMensaje: string = '';
  tipo: string = '';
  datos: any = {};

  // Data
  mensajes: MensajeSunat[] = [];
  etiquetas: Etiqueta[] = [];
  filteredMails: MensajeSunat[] = [];
  selectedMails: number[] = [];
  selectedMailDetail: MensajeSunat | null = null;
  detalleEmail?: Notificacion;

  // UI State
  searchTerm: string = '';
  selectedFolder: string = 'inbox';
  selectedLabel: string = '';
  selectedClasificacion: string = ''; // <-- NUEVO CAMPO PARA CLASIFICACIÓN
  isLoading: boolean = false;
  isDragOver: boolean = false;
  mailListWidth: number = 600;
  isResizing: boolean = false;
  mensajeJson: any = null;

  // Clasificaciones configuration
  clasificaciones = [
    { code: 'MUY IMPORTANTE', name: 'Muy Importantes', icon: '🔴', color: 'bg-red-500' },
    { code: 'IMPORTANTE', name: 'Importantes', icon: '🟡', color: 'bg-yellow-500' },
    { code: 'INFORMATIVO', name: 'Informativos', icon: '🔵', color: 'bg-blue-500' },
    { code: 'RECURRENTE', name: 'Recurrentes', icon: '🟢', color: 'bg-green-500' }
  ];
  
  // Folders configuration
  folders = [
    { code: 'inbox', name: 'Bandeja de entrada', icon: '📥', count: 3 },
    { code: 'dashboard', name: 'Dashboard Analítico', icon: '📊', count: 0 },
    { code: 'starred', name: 'Destacados', icon: '⭐', count: 2 },
    /*{ code: 'sent', name: 'Enviados', icon: '📤', count: 0 },*/
    /* { code: 'drafts', name: 'Borradores', icon: '📝', count: 3 },*/
    { code: 'archived', name: 'Archivados', icon: '📦', count: 0 },
    { code: 'trash', name: 'Papelera', icon: '🗑️', count: 0 }
  ];

  constructor(
    private http: HttpClient,
    private service: MailService,
    private router: Router,
    private servicioDetalle: NotificacionService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    // Suscribirse a los cambios del usuario autenticado
    this.userSubscription = this.authService.getCurrentUser().subscribe(
      user => {
        this.currentUser = user;
        if (!user) {
          // Si no hay usuario autenticado, redirigir al login
          this.router.navigate(['/login']);
        }
      }
    );

    // Verificar autenticación al cargar el componente
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Cargar datos iniciales
    this.loadInitialData();
    this.loadLabels();

    // Force reload labels after a short delay to ensure fresh data
    setTimeout(() => {
      this.refreshLabels();
    }, 2000);

    // Agregar listeners para eventos del dashboard
    this.setupDashboardEventListeners();
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  /**
   * Método para cargar datos iniciales
   */
  private loadInitialData(): void {
    const userData = this.authService.getUserData();
    if (userData) {
      console.log(`Bienvenido ${userData.nombreUsuario} (RUC: ${userData.ruc})`);
      // Cargar datos específicos del usuario
      this.loadMails();

      // Verificar si viene del dashboard con filtros
      this.verificarFiltrosDashboard();
    }
  }

  /**
   * Método para realizar logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Método para navegar al Asistente Virtual Contable
   */
  abrirAsistenteVirtual(): void {
    this.router.navigate(['/asistente-virtual']);
  }

  /**
   * Obtener información del usuario para mostrar en la interfaz
   */
  getUserInfo(): string {
    const userData = this.authService.getUserData();
    console.log('=== DEBUG getUserInfo COMPLETO ===');
    console.log('userData completo:', JSON.stringify(userData, null, 2));

    if (userData) {
      console.log('userData.nombreUsuario:', userData.nombreUsuario);
      console.log('userData.ruc:', userData.ruc);
      console.log('Propiedades disponibles:', Object.keys(userData));

      // Revisar cada propiedad específicamente
      Object.keys(userData).forEach(key => {
        console.log(`Propiedad "${key}":`, (userData as any)[key]);
      });
    }

    // Intentar con diferentes propiedades posibles (incluir nombre_usuario para compatibilidad)
    const userDataAny = userData as any;
    const nombre = userData?.nombreUsuario || userDataAny?.nombre_usuario || userDataAny?.username || userDataAny?.nombre || 'Usuario';
    console.log('Nombre final a mostrar:', nombre);

    return userData ? `${nombre} (${userData.ruc})` : 'Usuario no autenticado';
  }

  /**
   * Mapea el código de etiqueta a la clasificación correspondiente
   */
  private mapearClasificacion(codigoEtiqueta: string): 'MUY IMPORTANTE' | 'IMPORTANTE' | 'INFORMATIVO' | 'RECURRENTE' {
    switch (codigoEtiqueta) {
      case '10':
        return 'MUY IMPORTANTE';
      case '11':
        return 'IMPORTANTE';
      case '13':
        return 'INFORMATIVO';
      case '14':
        return 'RECURRENTE';
      default:
        return 'RECURRENTE'; // Por defecto
    }
  }

  /**
   * Aplica la clasificación a todos los mensajes basándose en su código de etiqueta
   */
  private aplicarClasificaciones(mensajes: MensajeSunat[]): MensajeSunat[] {
    return mensajes.map(mensaje => ({
      ...mensaje,
      clasificacion: this.mapearClasificacion(mensaje.vc_codigo_etiqueta)
    }));
  }

  loadMails() {
    console.log('=== INICIANDO loadMails() ===');
    const userRuc = this.authService.getUserRuc();

    if (!userRuc) {
      console.error('Usuario no autenticado');
      this.router.navigate(['/login']);
      return;
    }

    console.log('RUC del usuario:', userRuc);
    const params = new HttpParams().set('vc_numero_ruc', userRuc); // Usa query param
    console.log('Parámetros:', params.toString());

    this.isLoading = true;
    console.log('URL de la API:', `${this.apiUrl}/sunat/mensajes`);
    
    this.http.get(`${this.apiUrl}/sunat/mensajes`, { params })
      .subscribe({
        next: (response: any) => {
          console.log('=== RESPUESTA CRUDA DEL SERVIDOR ===');
          console.log('Respuesta completa:', response);
          console.log('Tipo de respuesta:', typeof response);
          console.log('Propiedades de la respuesta:', Object.keys(response));

          // Intentar acceder a los datos de diferentes maneras
          let mensajes = [];
          if (response.datos) {
            mensajes = response.datos;
            console.log('Usando response.datos');
          } else if (Array.isArray(response)) {
            mensajes = response;
            console.log('Response es un array directo');
          } else {
            console.error('No se pudo encontrar los mensajes en la respuesta');
          }

          console.log('Mensajes extraídos:', mensajes);
          console.log('Cantidad de mensajes:', mensajes?.length || 0);

          // Aplicar clasificaciones a los mensajes
          this.mensajes = this.aplicarClasificaciones(mensajes || []);
          console.log('Mensajes asignados a this.mensajes:', this.mensajes.length);

          if (this.mensajes.length > 0) {
            console.log('Primer mensaje:', this.mensajes[0]);
          }

          this.filterMails();
          this.isLoading = false;
          this.authService.updateLastActivity();

          this.verificarSeleccionCorreo();
        },
        error: (error) => {
          console.error('=== ERROR EN loadMails() ===');
          console.error('Error loading mails:', error);
          console.error('Status:', error.status);
          console.error('StatusText:', error.statusText);
          console.error('Message:', error.message);
          if (error.status === 401) {
            this.logout();
          }
          this.isLoading = false;
        }
      });
  }

  loadLabels() {
    this.http.get<RespuestaControlador<Etiqueta[]>>(`${this.apiUrl}/etiquetas`)
      .subscribe({
        next: (response) => {
          this.etiquetas = response.datos || [];
          console.log('Etiquetas cargadas:', this.etiquetas);
        },
        error: (error) => {
          console.error('Error loading labels:', error);
        }
      });
  }

  // Método para refrescar etiquetas manualmente
  refreshLabels() {
    this.loadLabels();
  }

  refreshMails() {
    this.http.get<RespuestaControlador<string>>(`${this.apiUrl}/sunat/sincronizar`)
      .subscribe({
        next: () => {
          this.loadMails();
        },
        error: (error) => {
          console.error('Error syncing mails:', error);
        }
      });
  }

  // Mail Actions
  updateMailProperty(mailId: number, property: string, value: any) {
    const url = `${this.apiUrl}/sunat/mensajes/${mailId}/${property}`;
    const params = new URLSearchParams();
    params.set(property, value.toString());

    return this.http.put<RespuestaControlador<MensajeSunat>>(`${url}?${params}`, {});
  }

  markAsRead() {
    this.selectedMails.forEach(mailId => {
      this.updateMailProperty(mailId, 'leido', 1).subscribe({
        next: () => {
          const mail = this.mensajes.find(m => m.nu_codigo_mensaje === mailId);
          if (mail) mail.nu_leido = 1;
          this.filterMails();
        }
      });
    });
  }

  archiveMails() {
    this.selectedMails.forEach(mailId => {
      this.updateMailProperty(mailId, 'archivado', 1).subscribe({
        next: () => {
          const mail = this.mensajes.find(m => m.nu_codigo_mensaje === mailId);
          if (mail) mail.nu_archivado = 1;
          this.filterMails();
        }
      });
    });
    this.selectedMails = [];
  }

  archiveMail(mail: MensajeSunat) {
    this.updateMailProperty(mail.nu_codigo_mensaje, 'archivado', 1).subscribe({
      next: () => {
        mail.nu_archivado = 1;
        this.filterMails();
        if (this.selectedMailDetail?.nu_codigo_mensaje === mail.nu_codigo_mensaje) {
          this.selectedMailDetail = null;
        }
      }
    });
  }

  unarchiveMail(mail: MensajeSunat) {
    this.updateMailProperty(mail.nu_codigo_mensaje, 'archivado', 0).subscribe({
      next: () => {
        mail.nu_archivado = 0;
        this.filterMails();
        if (this.selectedMailDetail?.nu_codigo_mensaje === mail.nu_codigo_mensaje) {
          this.selectedMailDetail = null;
        }
      }
    });
  }

  unarchiveMails() {
    this.selectedMails.forEach(mailId => {
      this.updateMailProperty(mailId, 'archivado', 0).subscribe({
        next: () => {
          const mail = this.mensajes.find(m => m.nu_codigo_mensaje === mailId);
          if (mail) mail.nu_archivado = 0;
          this.filterMails();
        }
      });
    });
    this.selectedMails = [];
  }

  restoreMail(mail: MensajeSunat) {
    this.updateMailProperty(mail.nu_codigo_mensaje, 'estado', 1).subscribe({
      next: () => {
        mail.nu_estado = 1;
        this.filterMails();
        if (this.selectedMailDetail?.nu_codigo_mensaje === mail.nu_codigo_mensaje) {
          this.selectedMailDetail = null;
        }
      }
    });
  }

  restoreMails() {
    this.selectedMails.forEach(mailId => {
      this.updateMailProperty(mailId, 'estado', 1).subscribe({
        next: () => {
          const mail = this.mensajes.find(m => m.nu_codigo_mensaje === mailId);
          if (mail) mail.nu_estado = 1;
          this.filterMails();
        }
      });
    });
    this.selectedMails = [];
  }

  deleteMails() {
    this.selectedMails.forEach(mailId => {
      this.updateMailProperty(mailId, 'estado', 0).subscribe({
        next: () => {
          const mail = this.mensajes.find(m => m.nu_codigo_mensaje === mailId);
          if (mail) mail.nu_estado = 0;
          this.filterMails();
        }
      });
    });
    this.selectedMails = [];
  }

  toggleStarred(mail: MensajeSunat) {
    const newValue = mail.nu_destacado === 1 ? 0 : 1;
    this.updateMailProperty(mail.nu_codigo_mensaje, 'destacado', newValue).subscribe({
      next: () => {
        mail.nu_destacado = newValue;
        this.filterMails();
      }
    });
  }

  // UI Methods
  selectFolder(folderCode: string) {
    // Si selecciona dashboard, navegar al componente dashboard
    if (folderCode === 'dashboard') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.selectedFolder = folderCode;
    this.selectedLabel = '';
    this.selectedClasificacion = ''; // Reset clasificación
    this.selectedMails = [];
    this.filterMails();
  }

  selectClasificacion(clasificacionCode: string) {
    this.selectedClasificacion = clasificacionCode;
    this.selectedFolder = '';
    this.selectedLabel = '';
    this.filterMails();
  }

  selectMail(mail: MensajeSunat, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      this.toggleMailSelection(mail.nu_codigo_mensaje);
    } else {
      this.selectedMails = [mail.nu_codigo_mensaje];
    }

    if (!mail.nu_leido) {
      this.updateMailProperty(mail.nu_codigo_mensaje, 'leido', 1).subscribe({
        next: () => {
          mail.nu_leido = 1;
          this.filterMails();
        }
      });
    }
  }

  openMail(mail: MensajeSunat) {
    this.selectedMailDetail = mail;
    if (!mail.nu_leido) {
      this.updateMailProperty(mail.nu_codigo_mensaje, 'leido', 1).subscribe({
        next: () => {
          mail.nu_leido = 1;
          this.filterMails();
        }
      });
    }
  }

  openDetail(coMensaje: string, labelCode: string) {
    if (coMensaje) {
      this.servicioDetalle.obtenerNotificacion(coMensaje).subscribe({
        next: (data) => {
          this.detalleEmail = data

          try {
            this.datos = JSON.parse(data.msj_mensaje);
            this.tipo = this.getTemplateType(this.datos, labelCode);
          } catch (error) {
            console.error('Error al parsear el mensaje', error);
            this.tipo = 'desconocido';
          }
        },
        error: (err) => {
          console.error('Error al cargar notificación', err)
        }
      });
    }
  }

  getTemplateType(data: any, labelCode: string): string {

    if (labelCode === '14') {
      return 'resoluciones-fiscalizacion'
    }

    if (labelCode === '13') {
      return 'resoluciones-contenciosas'
    }

    if (labelCode === '11') {
      return 'resoluciones-cobranza'
    }

    if (labelCode === '10') {
      return 'valores'
    }

    if ('tbodyCompras' in data && 'tbodyVentas' in data) {
      return 'resumen-compras-ventas';
    }

    if ('pro_fa_pend' in data) {
      return 'comprobantes-rhe';
    }

    if ('sistema' in data && data.sistema === '6') {
      return 'constancia-notificacion';
    }

    if ('horaDesc' in data) {
      return 'comprobantes-rhe-fe';
    }

    return 'desconocido';
  }

  decode(text: string): string {
    return decodeURIComponent(text
      .replace(/ï¿½/g, 'ó')
      .replace(/%26%23243;/g, 'ó')
      .replace(/%26%23176;/g, '°')
      .replace(/%26%23233;/g, 'é')
      .replace(/&oacute;/g, 'ó')
    )
  }

  toggleMailSelection(mailId: number) {
    const index = this.selectedMails.indexOf(mailId);
    if (index > -1) {
      this.selectedMails.splice(index, 1);
    } else {
      this.selectedMails.push(mailId);
    }
  }

  filterMails() {
    let filtered = [...this.mensajes];
    console.log('Total mensajes cargados:', this.mensajes.length);
    console.log('Mensajes ejemplo:', this.mensajes.slice(0, 3));
    console.log('Selected folder:', this.selectedFolder);
    console.log('Selected clasificacion:', this.selectedClasificacion);

    // Filter by folder
    switch (this.selectedFolder) {
      case 'inbox':
        filtered = filtered.filter(m => {
          const notArchived = !m.nu_archivado || m.nu_archivado == 0;
          const active = m.nu_estado == 1;
          return notArchived && active;
        });
        break;
      case 'starred':
        filtered = filtered.filter(m => m.nu_destacado == 1 && m.nu_estado == 1);
        break;
      case 'archived':
        filtered = filtered.filter(m => m.nu_archivado == 1);
        break;
      case 'trash':
        filtered = filtered.filter(m => m.nu_estado == 0);
        break;
    }

    console.log('Mensajes después del filtro de carpeta:', filtered.length);

    // Filter by clasificacion (solo si hay una clasificación seleccionada)
    if (this.selectedClasificacion) {
      filtered = filtered.filter(m => m.clasificacion === this.selectedClasificacion);
      console.log('Mensajes después del filtro de clasificación:', filtered.length);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.vc_asunto.toLowerCase().includes(term) ||
        m.vc_usuario_emisor.toLowerCase().includes(term)
      );
      console.log('Mensajes después del filtro de búsqueda:', filtered.length);
    }

    this.filteredMails = filtered;
    console.log('Mensajes finales filtrados:', this.filteredMails.length);
    this.updateFolderCounts();
  }

  updateFolderCounts() {
    this.folders.forEach(folder => {
      let count = 0;
      switch (folder.code) {
        case 'inbox':
          count = this.mensajes.filter(m => (m.nu_archivado === null || m.nu_archivado === 0) && m.nu_estado === 1).length;
          break;
        case 'starred':
          count = this.mensajes.filter(m => m.nu_destacado === 1 && m.nu_estado === 1).length;
          break;
        case 'archived':
          count = this.mensajes.filter(m => m.nu_archivado === 1).length;
          break;
        case 'trash':
          count = this.mensajes.filter(m => m.nu_estado === 0).length;
          break;
      }
      folder.count = count;
    });
  }

  onSearch() {
    this.filterMails();
  }

  // Drag & Drop Methods
  onDragStart(event: DragEvent, mail: MensajeSunat) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', mail.nu_codigo_mensaje.toString());
      event.dataTransfer.effectAllowed = 'move';
    }

    // Add visual feedback
    setTimeout(() => {
      (event.target as HTMLElement).classList.add('mail-item-dragging');
    }, 0);
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('mail-item-dragging');
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    this.isDragOver = false;
  }

  onDropToLabels(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const mailId = parseInt(event.dataTransfer!.getData('text/plain'));
    const mail = this.mensajes.find(m => m.nu_codigo_mensaje === mailId);

    if (mail) {
      // Show label selection modal or use the first available label
      if (this.etiquetas.length > 0) {
        const firstLabel = this.etiquetas[0];
        this.updateMailProperty(mailId, 'etiqueta', firstLabel.vc_codigo).subscribe({
          next: () => {
            mail.vc_codigo_etiqueta = firstLabel.vc_codigo;
            this.filterMails();
          }
        });
      }
    }
  }

  // Resize Methods
  startResize(event: MouseEvent) {
    this.isResizing = true;
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = this.mailListWidth;

    const onMouseMove = (e: MouseEvent) => {
      if (this.isResizing) {
        const newWidth = startWidth + (e.clientX - startX);
        this.mailListWidth = Math.max(300, Math.min(800, newWidth));
      }
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    // Adjust mail list width on window resize
    const maxWidth = window.innerWidth * 0.6;
    if (this.mailListWidth > maxWidth) {
      this.mailListWidth = maxWidth;
    }
  }

  // Utility Methods
  trackByMailId(index: number, mail: MensajeSunat): number {
    return mail.nu_codigo_mensaje;
  }

  getInitials(name: string): string {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
      });
    }
  }

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCurrentFolderName(): string {
    if (this.selectedClasificacion) {
      const clasificacion = this.clasificaciones.find(c => c.code === this.selectedClasificacion);
      return clasificacion ? clasificacion.name : 'Clasificación';
    }
    const folder = this.folders.find(f => f.code === this.selectedFolder);
    return folder ? folder.name : 'Correos';
  }

  getLabelColor(labelCode: string): string {
    console.log("label code: " + labelCode);
    const label = this.etiquetas.find(e => e.vc_codigo === labelCode);
    console.log("label found:", label);
    console.log("label color", label?.vc_color);
    return label?.vc_color || 'bg-cyan-500';
  }

  getLabelName(labelCode: string): string {
    const label = this.etiquetas.find(e => e.vc_codigo === labelCode);
    return label?.vc_nombre || labelCode;
  }

  printMail() {
    window.print();
  }

  descargarArchivo(url: string | null, nombre: string) {
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = nombre; // Esto sugiere el nombre al navegador
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Métodos para filtrar por clasificación
  getCorreosMuyImportantes(): MensajeSunat[] {
    return this.filteredMails.filter(m => m.clasificacion === 'MUY IMPORTANTE');
  }

  getCorreosImportantes(): MensajeSunat[] {
    return this.filteredMails.filter(m => m.clasificacion === 'IMPORTANTE');
  }

  getCorreosInformativos(): MensajeSunat[] {
    return this.filteredMails.filter(m => m.clasificacion === 'INFORMATIVO');
  }

  getCorreosRecurrentes(): MensajeSunat[] {
    return this.filteredMails.filter(m => m.clasificacion === 'RECURRENTE');
  }

  // Método para obtener el conteo de correos por clasificación
  getClasificacionCount(clasificacionCode: string): number {
    const count = this.mensajes.filter(m => m.clasificacion === clasificacionCode).length;
    console.log(`Conteo para ${clasificacionCode}:`, count);
    return count;
  }

  // Método para actualizar clasificaciones existentes
  actualizarClasificaciones() {
    this.http.post<RespuestaControlador<string>>(`${this.apiUrl}/sunat/actualizar-clasificaciones`, {})
      .subscribe({
        next: (response) => {
          console.log('Clasificaciones actualizadas:', response.vc_mensaje);
          // Recargar los mensajes para ver los cambios
          this.loadMails();
        },
        error: (error) => {
          console.error('Error al actualizar clasificaciones:', error);
        }
      });
  }

  // Método de depuración para probar la carga manual
  testLoadMails() {
    console.log('=== INICIANDO TEST DE CARGA ===');
    console.log('Usuario autenticado:', this.authService.isAuthenticated());
    console.log('RUC del usuario:', this.authService.getUserRuc());
    console.log('User Data:', this.authService.getUserData());

    const userRuc = this.authService.getUserRuc();
    if (!userRuc) {
      console.error('No hay RUC disponible');
      return;
    }

    const params = new HttpParams().set('vc_numero_ruc', userRuc);
    console.log('Parámetros a enviar:', params.toString());
    console.log('URL completa:', `${this.apiUrl}/sunat/mensajes?${params.toString()}`);

    this.http.get<RespuestaControlador<MensajeSunat[]>>(`${this.apiUrl}/sunat/mensajes`, { params })
      .subscribe({
        next: (response) => {
          console.log('=== RESPUESTA EXITOSA ===');
          console.log('Response completo:', response);
          console.log('Cantidad de mensajes:', response.datos?.length);
          console.log('Primeros 3 mensajes:', response.datos?.slice(0, 3));
        },
        error: (error) => {
          console.error('=== ERROR EN LA LLAMADA ===');
          console.error('Error completo:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
        }
      });
  }

  // Método de depuración para autenticación
  debugAuth() {
    console.log('=== DEBUG AUTENTICACIÓN ===');
    console.log('¿Está autenticado?:', this.authService.isAuthenticated());
    console.log('Datos de usuario:', this.authService.getUserData());
    console.log('RUC del usuario:', this.authService.getUserRuc());
    console.log('Nombre del usuario:', this.authService.getUserName());
    console.log('Usuario actual (sync):', this.authService.getCurrentUserSync());
    console.log('LocalStorage userData:', localStorage.getItem('userData'));
    console.log('=== FIN DEBUG AUTENTICACIÓN ===');
  }

  // Método para verificar si hay un correo específico para seleccionar desde el dashboard
  private verificarSeleccionCorreo(): void {
    const correoSeleccionadoId = localStorage.getItem('correoSeleccionado');

    if (correoSeleccionadoId) {
      console.log('🔍 Buscando correo con ID:', correoSeleccionadoId);
      console.log('📋 Total mensajes disponibles:', this.mensajes.length);

      // Buscar el correo en la lista actual
      const correoEncontrado = this.mensajes.find(mensaje =>
        mensaje.nu_codigo_mensaje.toString() === correoSeleccionadoId
      );

      if (correoEncontrado) {
        console.log('✅ Correo encontrado:', correoEncontrado);
        // Seleccionar el correo y limpiar selecciones previas
        this.selectedMails = [correoEncontrado.nu_codigo_mensaje];
        this.selectedMailDetail = correoEncontrado;

        // Simular clic para mostrar detalles usando el método existente
        const mockEvent = new MouseEvent('click');
        this.selectMail(correoEncontrado, mockEvent);

        // Marcar como leído si no lo está
        if (!correoEncontrado.nu_leido) {
          this.updateMailProperty(correoEncontrado.nu_codigo_mensaje, 'leido', 1).subscribe({
            next: () => {
              correoEncontrado.nu_leido = 1;
              console.log('📧 Correo marcado como leído');
            },
            error: (error) => console.error('❌ Error al marcar como leído:', error)
          });
        }

        console.log('🎯 Correo seleccionado automáticamente');
      } else {
        console.log('❌ Correo no encontrado en la lista actual');
        console.log('🔍 Buscando por asunto como fallback...');

        // Fallback: buscar por asunto
        const correoAsunto = localStorage.getItem('correoAsunto');
        if (correoAsunto) {
          const correosPorAsunto = this.mensajes.filter(mensaje =>
            mensaje.vc_asunto.includes(correoAsunto.substring(0, 20))
          );
          
          if (correosPorAsunto.length > 0) {
            const correo = correosPorAsunto[0];
            this.selectedMails = [correo.nu_codigo_mensaje];
            this.selectedMailDetail = correo;
            const mockEvent = new MouseEvent('click');
            this.selectMail(correo, mockEvent);
            console.log('🎯 Correo encontrado por asunto');
          }
        }
      }

      // Limpiar el localStorage después de usar
      localStorage.removeItem('correoSeleccionado');
      localStorage.removeItem('correoAsunto');
      localStorage.removeItem('correoFechaEnvio');
    }
  }

  // Método para verificar y aplicar filtros desde el dashboard
  private verificarFiltrosDashboard(): void {
    const origenDashboard = localStorage.getItem('origenDashboard');

    if (origenDashboard === 'true') {
      console.log('🎯 Aplicando filtros desde dashboard');

      // Verificar filtro por clasificación
      const clasificacionPanel = localStorage.getItem('clasificacionPanel');
      if (clasificacionPanel) {
        console.log('📋 Aplicando filtro de clasificación:', clasificacionPanel);
        setTimeout(() => {
          this.selectClasificacion(clasificacionPanel);
        }, 2000);
      }

      // Verificar filtro por fiscalización
      const buscarFiscalizacion = localStorage.getItem('buscarFiscalizacion');
      if (buscarFiscalizacion === 'true') {
        console.log('🔍 Aplicando filtro de fiscalizaciones');
        setTimeout(() => {
          this.aplicarFiltroPorContenido('fiscalizacion');
        }, 2000);
      }

      // Verificar filtro por multas
      const buscarMulta = localStorage.getItem('buscarMulta');
      if (buscarMulta === 'true') {
        console.log('💰 Aplicando filtro de multas');
        setTimeout(() => {
          this.aplicarFiltroPorContenido('multa');
        }, 2000);
      }

      // Limpiar localStorage después de usar
      localStorage.removeItem('origenDashboard');
      localStorage.removeItem('filtroClasificacion');
      localStorage.removeItem('clasificacionPanel');
      localStorage.removeItem('buscarFiscalizacion');
      localStorage.removeItem('buscarMulta');
    }
  }

  // Método para aplicar filtros por contenido del asunto
  private aplicarFiltroPorContenido(tipo: string): void {
    console.log('🔍 Aplicando filtro por contenido:', tipo);

    let terminosBusqueda: string[] = [];

    switch (tipo) {
      case 'fiscalizacion':
        terminosBusqueda = ['fiscalizacion', 'fiscalización', 'auditoria', 'auditoría', 'esquela', 'citación'];
        break;
      case 'multa':
        terminosBusqueda = ['multa', 'valor', 'cobro', 'cobranza', 'embargo', 'coactiva'];
        break;
    }

    // Filtrar mensajes que contengan los términos de búsqueda
    this.filteredMails = this.mensajes.filter(mensaje => {
      const asuntoLower = mensaje.vc_asunto.toLowerCase();
      return terminosBusqueda.some(termino => asuntoLower.includes(termino));
    });

    console.log(`✅ Filtro aplicado: ${this.filteredMails.length} correos encontrados de tipo ${tipo}`);

    // Resetear selecciones
    this.selectedFolder = '';
    this.selectedClasificacion = '';
    this.selectedMails = [];
  }

  /**
   * Configurar listeners para eventos del dashboard
   */
  private setupDashboardEventListeners(): void {
    // Listener para seleccionar correo específico
    window.addEventListener('seleccionarCorreoEspecifico', (event: any) => {
      console.log('📨 Evento recibido: seleccionarCorreoEspecifico', event.detail);
      const { codigoMensaje, asunto, fechaEnvio } = event.detail;

      setTimeout(() => {
        this.seleccionarCorreoPorCodigo(codigoMensaje, asunto, fechaEnvio);
      }, 500);
    });

    // Listener para aplicar filtros de clasificación
    window.addEventListener('aplicarFiltroClasificacion', (event: any) => {
      console.log('🏷️ Evento recibido: aplicarFiltroClasificacion', event.detail);
      const { clasificacion, tipo } = event.detail;

      setTimeout(() => {
        if (clasificacion) {
          this.selectClasificacion(clasificacion);
        } else {
          this.aplicarFiltroPorContenido(tipo);
        }
      }, 500);
    });

    console.log('✅ Listeners del dashboard configurados');
  }

  /**
   * Seleccionar correo por código
   */
  private seleccionarCorreoPorCodigo(codigoMensaje: number, asunto?: string, fechaEnvio?: string): void {
    console.log('🎯 Intentando seleccionar correo:', { codigoMensaje, asunto, fechaEnvio });

    // Buscar el correo en la lista filtrada
    let correoEncontrado = this.filteredMails.find(correo => correo.nu_codigo_mensaje === codigoMensaje);

    if (!correoEncontrado && asunto) {
      // Si no se encuentra por código, buscar por asunto
      correoEncontrado = this.filteredMails.find(correo => correo.vc_asunto === asunto);
    }

    if (!correoEncontrado && fechaEnvio) {
      // Si no se encuentra, buscar por fecha y asunto
      correoEncontrado = this.filteredMails.find(correo =>
        correo.vc_fecha_envio === fechaEnvio &&
        (asunto ? correo.vc_asunto.includes(asunto.substring(0, 20)) : true)
      );
    }

    if (correoEncontrado) {
      console.log('✅ Correo encontrado, seleccionando:', correoEncontrado.vc_asunto);
      this.selectedMailDetail = correoEncontrado;
      this.selectedMails = [correoEncontrado.nu_codigo_mensaje];

      // Marcar como leído si no lo estaba
      if (correoEncontrado.nu_leido === 0) {
        correoEncontrado.nu_leido = 1;
        this.markAsRead();
      }

      // Hacer scroll al correo seleccionado
      setTimeout(() => {
        const elemento = document.getElementById(`mail-${correoEncontrado!.nu_codigo_mensaje}`);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
          elemento.classList.add('highlight-mail');
          setTimeout(() => {
            elemento.classList.remove('highlight-mail');
          }, 3000);
        }
      }, 100);
    } else {
      console.warn('⚠️ Correo no encontrado en la lista actual');

      // Si no se encuentra, intentar recargar los correos y buscar de nuevo
      this.loadMails();
      setTimeout(() => {
        this.seleccionarCorreoPorCodigo(codigoMensaje, asunto, fechaEnvio);
      }, 2000);
    }
  }

  /**
   * Método para descargar archivos adjuntos
   */
  descargarAdjunto(adjunto: any): void {
    if (!adjunto || !adjunto.url) {
      console.error('No se puede descargar el adjunto');
      return;
    }

    // Crear un enlace temporal para descargar
    const link = document.createElement('a');
    link.href = adjunto.url;
    link.download = adjunto.nombre || 'archivo_adjunto';
    link.target = '_blank';
    
    // Simular clic para iniciar descarga
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Método para reenviar un correo
   */
  reenviarCorreo(mail: MensajeSunat): void {
    console.log('Reenviando correo:', mail.vc_asunto);
    // Aquí implementarías la lógica para reenviar el correo
    // Por ejemplo, abrir un modal de composición con el contenido del correo
  }

  /**
   * Método para responder un correo
   */
  responderCorreo(mail: MensajeSunat): void {
    console.log('Respondiendo correo:', mail.vc_asunto);
    // Aquí implementarías la lógica para responder el correo
  }

  /**
   * Método para obtener el ícono de clasificación
   */
  getClasificacionIcon(clasificacion: string): string {
    const clasificacionObj = this.clasificaciones.find(c => c.code === clasificacion);
    return clasificacionObj ? clasificacionObj.icon : '📧';
  }

  /**
   * Método para obtener el color de clasificación
   */
  getClasificacionColor(clasificacion: string): string {
    const clasificacionObj = this.clasificaciones.find(c => c.code === clasificacion);
    return clasificacionObj ? clasificacionObj.color : 'bg-gray-500';
  }

  /**
   * Método para verificar si hay correos no leídos
   */
  tieneCorreosNoLeidos(): boolean {
    return this.mensajes.some(m => m.nu_leido === 0 && m.nu_estado === 1);
  }

  /**
   * Método para obtener cantidad de correos no leídos
   */
  getCantidadNoLeidos(): number {
    return this.mensajes.filter(m => m.nu_leido === 0 && m.nu_estado === 1).length;
  }

  /**
   * Método para marcar todos como leídos
   */
  marcarTodosComoLeidos(): void {
    const noLeidos = this.mensajes.filter(m => m.nu_leido === 0);
    
    noLeidos.forEach(mail => {
      this.updateMailProperty(mail.nu_codigo_mensaje, 'leido', 1).subscribe({
        next: () => {
          mail.nu_leido = 1;
        },
        error: (error) => {
          console.error('Error al marcar como leído:', error);
        }
      });
    });
    
    this.filterMails();
  }

  /**
   * Método para exportar correos seleccionados
   */
  exportarCorreosSeleccionados(): void {
    if (this.selectedMails.length === 0) {
      console.warn('No hay correos seleccionados para exportar');
      return;
    }

    const correosParaExportar = this.mensajes.filter(m => 
      this.selectedMails.includes(m.nu_codigo_mensaje)
    );

    const dataExport = correosParaExportar.map(correo => ({
      codigo: correo.nu_codigo_mensaje,
      asunto: correo.vc_asunto,
      emisor: correo.vc_usuario_emisor,
      fecha_envio: correo.vc_fecha_envio,
      clasificacion: correo.clasificacion,
      etiqueta: this.getLabelName(correo.vc_codigo_etiqueta),
      leido: correo.nu_leido === 1 ? 'Sí' : 'No',
      destacado: correo.nu_destacado === 1 ? 'Sí' : 'No'
    }));

    // Convertir a CSV
    const csv = this.convertToCSV(dataExport);
    
    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `correos_exportados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Convertir datos a formato CSV
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escapar comillas y envolver en comillas si contiene comas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Método para buscar correos por rango de fechas
   */
  buscarPorFechas(fechaInicio: Date, fechaFin: Date): void {
    this.filteredMails = this.mensajes.filter(mail => {
      const fechaMail = new Date(mail.vc_fecha_envio);
      return fechaMail >= fechaInicio && fechaMail <= fechaFin;
    });
    
    console.log(`Búsqueda por fechas: ${this.filteredMails.length} correos encontrados`);
  }

  /**
   * Método para obtener estadísticas de correos
   */
  obtenerEstadisticas(): any {
    const total = this.mensajes.length;
    const noLeidos = this.mensajes.filter(m => m.nu_leido === 0).length;
    const destacados = this.mensajes.filter(m => m.nu_destacado === 1).length;
    const archivados = this.mensajes.filter(m => m.nu_archivado === 1).length;
    
    const porClasificacion = {
      muyImportantes: this.mensajes.filter(m => m.clasificacion === 'MUY IMPORTANTE').length,
      importantes: this.mensajes.filter(m => m.clasificacion === 'IMPORTANTE').length,
      informativos: this.mensajes.filter(m => m.clasificacion === 'INFORMATIVO').length,
      recurrentes: this.mensajes.filter(m => m.clasificacion === 'RECURRENTE').length
    };

    return {
      total,
      noLeidos,
      destacados,
      archivados,
      porClasificacion,
      porcentajeLeidos: total > 0 ? ((total - noLeidos) / total * 100).toFixed(2) : 0
    };
  }

  /**
   * Método para sincronizar con SUNAT
   */
  sincronizarConSunat(): void {
    console.log('Iniciando sincronización con SUNAT...');
    this.isLoading = true;

    this.http.post<RespuestaControlador<any>>(`${this.apiUrl}/sunat/sincronizar-completo`, {
      ruc: this.authService.getUserRuc()
    }).subscribe({
      next: (response) => {
        console.log('Sincronización completada:', response.vc_mensaje);
        // Recargar los mensajes después de sincronizar
        this.loadMails();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en sincronización:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Método para limpiar filtros y búsquedas
   */
  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedFolder = 'inbox';
    this.selectedLabel = '';
    this.selectedClasificacion = '';
    this.selectedMails = [];
    this.filterMails();
  }

  /**
   * Método para verificar si el correo tiene archivos adjuntos
   */
  tieneAdjuntos(mail: MensajeSunat): boolean {
    return mail.nu_cantidad_archivos > 0;
  }

  /**
   * Método para obtener preview del contenido del correo
   */
  getMailPreview(mail: MensajeSunat): string {
    // Aquí podrías implementar lógica para obtener un preview del contenido
    // Por ahora retornamos el asunto truncado
    const maxLength = 100;
    return mail.vc_asunto.length > maxLength 
      ? mail.vc_asunto.substring(0, maxLength) + '...' 
      : mail.vc_asunto;
  }

  /**
   * Método para gestionar notificaciones
   */
  toggleNotificaciones(): void {
    // Implementar lógica para activar/desactivar notificaciones
    console.log('Toggle notificaciones');
  }

  /**
   * Método para cambiar vista de la interfaz
   */
  cambiarVista(vista: 'lista' | 'grid' | 'compacta'): void {
    // Implementar cambio de vista
    console.log('Cambiando vista a:', vista);
  }

  /**
   * Método auxiliar para validar RUC
   */
  private validarRUC(ruc: string): boolean {
    if (!ruc || ruc.length !== 11) return false;
    
    // Validación básica de RUC peruano
    const primerDigito = parseInt(ruc.charAt(0));
    return primerDigito === 1 || primerDigito === 2;
  }

  /**
   * Método para obtener configuración del usuario
   */
  obtenerConfiguracionUsuario(): any {
    // Aquí podrías obtener configuraciones personalizadas del usuario
    return {
      tema: 'default',
      notificaciones: true,
      vista: 'lista',
      itemsPorPagina: 50
    };
  }

  /**
   * Método de limpieza al destruir el componente
   */
  private cleanup(): void {
    // Limpiar event listeners
    window.removeEventListener('seleccionarCorreoEspecifico', this.handleSeleccionarCorreo);
    window.removeEventListener('aplicarFiltroClasificacion', this.handleAplicarFiltro);
    
    // Limpiar subscriptions
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Handlers para eventos (para poder removerlos correctamente)
   */
  private handleSeleccionarCorreo = (event: any) => {
    console.log('📨 Evento recibido: seleccionarCorreoEspecifico', event.detail);
    const { codigoMensaje, asunto, fechaEnvio } = event.detail;
    
    setTimeout(() => {
      this.seleccionarCorreoPorCodigo(codigoMensaje, asunto, fechaEnvio);
    }, 500);
  };

  private handleAplicarFiltro = (event: any) => {
    console.log('🏷️ Evento recibido: aplicarFiltroClasificacion', event.detail);
    const { clasificacion, tipo } = event.detail;
    
    setTimeout(() => {
      if (clasificacion) {
        this.selectClasificacion(clasificacion);
      } else {
        this.aplicarFiltroPorContenido(tipo);
      }
    }, 500);
  };
}