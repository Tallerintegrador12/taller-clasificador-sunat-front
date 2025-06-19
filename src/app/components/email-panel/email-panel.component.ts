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
export class EmailPanelComponent implements OnInit, OnDestroy{
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
  detalleEmail ?: Notificacion;

  // UI State
  searchTerm: string = '';
  selectedFolder: string = 'inbox';
  selectedLabel: string = '';
  selectedClasificacion: string = ''; // <-- NUEVO CAMPO PARA CLASIFICACIÓN
  isLoading: boolean = false;
  isDragOver: boolean = false;
  mailListWidth: number = 600;
  isResizing: boolean = false;

  // Clasificaciones configuration
  clasificaciones = [
    { code: 'MUY IMPORTANTE', name: 'Muy Importantes', icon: '🔴', color: 'bg-red-500' },
    { code: 'IMPORTANTE', name: 'Importantes', icon: '🟡', color: 'bg-yellow-500' },
    { code: 'RECURRENTE', name: 'Recurrentes', icon: '🟢', color: 'bg-green-500' }
  ];

  // Folders configuration
  folders = [
    { code: 'inbox', name: 'Bandeja de entrada', icon: '📥', count: 3 },
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
  ) {}

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
   * Obtener información del usuario para mostrar en la interfaz
   */
  getUserInfo(): string {
    const userData = this.authService.getUserData();
    return userData ? `${userData.nombreUsuario} (${userData.ruc})` : 'Usuario no autenticado';
  }


  /**
   * Ejemplo de método para obtener datos con el RUC del usuario
   */


  loadMails() {
    console.log('=== INICIANDO loadMails() ===');
    const userRuc = this.authService.getUserRuc();

    if (!userRuc) {
      console.error('Usuario no autenticado');
      this.router.navigate(['/login']);
      return;    }

    console.log('RUC del usuario:', userRuc);
    const params = new HttpParams().set('vc_numero_ruc', userRuc); // Usa query param
    console.log('Parámetros:', params.toString());

    this.isLoading = true;
    console.log('URL de la API:', `${this.apiUrl}/sunat/mensajes`);
    
    this.http.get<RespuestaControlador<MensajeSunat[]>>(`${this.apiUrl}/sunat/mensajes`, { params })
      .subscribe({
        next: (response) => {
          console.log('=== RESPUESTA EXITOSA ===');
          console.log('Respuesta del servidor:', response);
          console.log('Código de respuesta:', response.nu_codigo);
          console.log('Mensaje:', response.vc_mensaje);
          console.log('Datos (array):', response.datos);
          console.log('Cantidad de mensajes:', response.datos?.length || 0);
          
          this.mensajes = response.datos || [];
          console.log('Mensajes asignados a this.mensajes:', this.mensajes.length);
          
          if (this.mensajes.length > 0) {
            console.log('Primer mensaje:', this.mensajes[0]);
            console.log('Clasificación del primer mensaje:', this.mensajes[0].clasificacion);
          }
          
          this.filterMails();
          this.isLoading = false;
          console.log('Datos obtenidos:', response);
          this.authService.updateLastActivity();
        },        error: (error) => {
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
        },
        error: (error) => {
          console.error('Error loading labels:', error);
        }
      });
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
          const mail = this.mensajes.find(m => m.nu_codigo_mensaje=== mailId);
          if (mail) mail.nu_leido= 1;
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
    const newValue = mail.nu_destacado=== 1 ? 0 : 1;
    this.updateMailProperty(mail.nu_codigo_mensaje, 'destacado', newValue).subscribe({
      next: () => {
        mail.nu_destacado = newValue;
        this.filterMails();
      }
    });
  }

  // UI Methods
  selectFolder(folderCode: string) {
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
          mail.nu_leido= 1;
          this.filterMails();
        }
      });
    }
  }

  openDetail(coMensaje: string, labelCode: string) {
    if (coMensaje) {
      this.servicioDetalle.obtenerNotificacion(coMensaje).subscribe({
        next: (data) => {
          this.detalleEmail= data

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

    if(labelCode === '14'){
      return 'resoluciones-fiscalizacion'
    }

    if(labelCode === '13'){
      return 'resoluciones-contenciosas'
    }

    if(labelCode === '11'){
      return 'resoluciones-cobranza'
    }

    if(labelCode === '10'){
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

    if('horaDesc' in data){
      return 'comprobantes-rhe-fe';
    }

    return 'desconocido';
  }

  decode(text: string): string {
    return decodeURIComponent(text
      .replace(/ï¿½/g,'ó')
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
    console.log("label code: "+labelCode);
    const label = this.etiquetas.find(e => e.vc_codigo === labelCode);
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

  mensajeJson: any = null;

  // Métodos para filtrar por clasificación
  getCorreosMuyImportantes(): MensajeSunat[] {
    return this.filteredMails.filter(m => m.clasificacion === 'MUY IMPORTANTE');
  }
  getCorreosImportantes(): MensajeSunat[] {
    return this.filteredMails.filter(m => m.clasificacion === 'IMPORTANTE');
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
}
