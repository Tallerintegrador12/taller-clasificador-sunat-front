import {Component, ElementRef, HostListener, inject, OnInit, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MailService} from '../../services/mensaje-sunat.service';
import {Router} from '@angular/router';
import {Notificacion} from '../../models/notificacion';
import {NotificacionService} from '../../services/notificacion.service';


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
  imports: [CommonModule, FormsModule],
  templateUrl: './email-panel.component.html',
  styleUrl: './email-panel.component.css'
})
export class EmailPanelComponent implements OnInit {
  @ViewChild('mailList') mailListRef!: ElementRef;

  // API Base URL
  private apiUrl = 'http://localhost:8080/api';

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
  isLoading: boolean = false;
  isDragOver: boolean = false;
  mailListWidth: number = 600;
  isResizing: boolean = false;



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
    private servicioDetalle: NotificacionService
  ) {}

  ngOnInit() {
    this.loadMails();
    this.loadLabels();
  }
  logout(): void {
    // Limpiar datos de sesión
    // En un caso real, limpiarías localStorage/sessionStorage
    console.log('Cerrando sesión...');

    // Redirigir al login
    this.router.navigate(['/login']);
  }


  // API Methods
  loadMails() {
    this.isLoading = true;
    this.http.get<RespuestaControlador<MensajeSunat[]>>(`${this.apiUrl}/sunat/mensajes`)
      .subscribe({
        next: (response) => {
          this.mensajes = response.datos || [];
          this.filterMails();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading mails:', error);
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
    this.selectedMails = [];
    this.filterMails();
  }

  selectLabel(labelCode: string) {
    this.selectedLabel = labelCode;
    console.log(this.selectedLabel);
    this.selectedFolder = '';
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

  openDetail(coMensaje: string){
    if (coMensaje) {
      this.servicioDetalle.obtenerNotificacion(coMensaje).subscribe({
        next: (data) => (this.detalleEmail= data),
        error: (err) => console.error('Error al cargar notificación', err),
      });
    }
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

    // Filter by folder
    switch (this.selectedFolder) {
      case 'inbox':
        filtered = filtered.filter(m =>( m.nu_archivado=== 0 || m.nu_archivado=== null) && m.nu_estado === 1);
        break;
      case 'starred':
        filtered = filtered.filter(m => m.nu_destacado === 1 && m.nu_estado === 1);
        break;
      case 'archived':
        filtered = filtered.filter(m => m.nu_archivado === 1);
        break;
      /*case 'sent':
        filtered = filtered.filter(m => m.nu_archivado=== null);
        break;*/
      case 'trash':
        filtered = filtered.filter(m => m.nu_estado === 0);
        break;
    }

    // Filter by label
    if (this.selectedLabel) {
      filtered = filtered.filter(m => m.vc_codigo_etiqueta === this.selectedLabel);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.vc_asunto.toLowerCase().includes(term) ||
        m.vc_usuario_emisor.toLowerCase().includes(term)
      );
    }

    this.filteredMails = filtered;
    this.updateFolderCounts();
  }

  updateFolderCounts() {
    this.folders.forEach(folder => {
      let count = 0;
      switch (folder.code) {
        case 'inbox':
          count = this.mensajes.filter(m =>( m.nu_archivado=== null || m.nu_archivado===0) && m.nu_estado === 1).length;
          break;
        case 'starred':
          count = this.mensajes.filter(m => m.nu_destacado === 1 && m.nu_destacado === 1).length;
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

}
