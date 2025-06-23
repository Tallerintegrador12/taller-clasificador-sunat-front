import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import {Email} from '../models/email';
import {EmailFilters} from '../models/email-filters';
import {EmailLabel} from '../models/email-label';
import {EmailFolder} from '../models/email-folder';

// Interfaz para mapear MensajeSunat del backend a Email del frontend
interface MensajeSunat {
  nu_codigo_mensaje: number;
  vc_asunto: string;
  vc_fecha_envio: string;
  vc_fecha_publica: string;
  vc_usuario_emisor: string;
  nu_destacado: number;
  nu_urgente: number;
  nu_estado: number;
  vc_numero_ruc: string;
}

// Interfaz para la respuesta del controlador
interface RespuestaControlador<T> {
  vcMensaje: string;
  nuCodigo: number;
  datos: T;
  vcErrores?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = 'https://sunatapi-arcehmesgqb2f8en.brazilsouth-01.azurewebsites.net/api/sunat';
  private emailsSubject = new BehaviorSubject<Email[]>([]);

  private selectedFolderSubject = new BehaviorSubject<string>('inbox');
  private filtersSubject = new BehaviorSubject<EmailFilters>({
    read: null,
    starred: null,
    priority: null,
    hasAttachment: null,
    labels: []
  });
  private searchTermSubject = new BehaviorSubject<string>('');

  emails$ = this.emailsSubject.asObservable();
  selectedFolder$ = this.selectedFolderSubject.asObservable();
  filters$ = this.filtersSubject.asObservable();
  searchTerm$ = this.searchTermSubject.asObservable();

  filteredEmails$ = combineLatest([
    this.emails$,
    this.selectedFolder$,
    this.filters$,
    this.searchTerm$
  ]).pipe(
    map(([emails, folder, filters, searchTerm]) => {
      let filtered = emails.filter(email => {
        if (folder === 'starred') return email.starred;
        if (folder !== 'inbox') return email.folder === folder;
        if (folder === 'inbox') return email.folder === 'inbox';
        return true;
      });

      // Aplicar filtros
      if (filters.read !== null) {
        filtered = filtered.filter(email => email.read === filters.read);
      }
      if (filters.starred !== null) {
        filtered = filtered.filter(email => email.starred === filters.starred);
      }
      if (filters.priority !== null) {
        filtered = filtered.filter(email => email.priority === filters.priority);
      }
      if (filters.hasAttachment !== null) {
        filtered = filtered.filter(email => email.hasAttachment === filters.hasAttachment);
      }
      if (filters.labels.length > 0) {
        filtered = filtered.filter(email =>
          filters.labels.some(label => email.labels.includes(label))
        );
      }

      // Filtrar por búsqueda
      if (searchTerm) {
        filtered = filtered.filter(email =>
          email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.fromName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.preview.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Ordenar por prioridad y estado de lectura
      return filtered.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        if (a.priority !== b.priority) {
          const priorities = { high: 3, medium: 2, low: 1 };
          return priorities[b.priority] - priorities[a.priority];
        }
        return b.id - a.id;
      });
    })
  );

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Carga los emails desde el backend usando el RUC del usuario autenticado
   */
  loadEmailsByRuc(): Observable<Email[]> {
    const userRuc = this.authService.getUserRuc();
    
    if (!userRuc) {
      console.error('No se encontró RUC del usuario autenticado');
      return new Observable(observer => observer.next([]));
    }

    console.log('Cargando emails para RUC:', userRuc);
    
    return this.http.get<RespuestaControlador<MensajeSunat[]>>(`${this.apiUrl}/mensajes`, {
      params: { vc_numero_ruc: userRuc }
    }).pipe(
      map(response => {
        console.log('Respuesta del backend:', response);
        if (response.nuCodigo === 200 && response.datos) {
          const emails = this.mapMensajeSunatToEmail(response.datos);
          console.log('Emails mapeados:', emails);
          return emails;
        } else {
          console.error('Error en la respuesta del backend:', response);
          return [];
        }
      })
    );
  }

  /**
   * Mapea los mensajes de SUNAT a la estructura de Email del frontend
   */
  private mapMensajeSunatToEmail(mensajes: MensajeSunat[]): Email[] {
    return mensajes.map((mensaje, index) => ({
      id: mensaje.nu_codigo_mensaje,
      from: 'sunat@sunat.gob.pe',
      fromName: mensaje.vc_usuario_emisor || 'SUNAT',
      subject: mensaje.vc_asunto,
      preview: this.generatePreview(mensaje.vc_asunto),
      content: `Mensaje de SUNAT: ${mensaje.vc_asunto}`,
      time: this.formatTime(mensaje.vc_fecha_envio),
      read: mensaje.nu_estado === 1,
      starred: mensaje.nu_destacado === 1,
      priority: mensaje.nu_urgente === 1 ? 'high' : 'medium',
      labels: this.generateLabels(mensaje),
      hasAttachment: false,
      folder: 'inbox',
      avatar: 'SU',
      attachments: []
    }));
  }

  /**
   * Genera un preview del mensaje basado en el asunto
   */
  private generatePreview(asunto: string): string {
    return asunto.length > 100 ? asunto.substring(0, 100) + '...' : asunto;
  }

  /**
   * Formatea la fecha y hora para mostrar
   */
  private formatTime(fechaEnvio: string): string {
    try {
      const fecha = new Date(fechaEnvio);
      return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Hora no válida';
    }
  }

  /**
   * Genera etiquetas basadas en las propiedades del mensaje
   */
  private generateLabels(mensaje: MensajeSunat): string[] {
    const labels: string[] = [];
    if (mensaje.nu_urgente === 1) labels.push('urgente');
    if (mensaje.nu_destacado === 1) labels.push('destacado');
    return labels;
  }

  /**
   * Inicializa los emails obteniendo los datos del backend
   */
  initializeEmails(): void {
    this.loadEmailsByRuc().subscribe({
      next: (emails) => {
        this.emailsSubject.next(emails);
      },
      error: (error) => {
        console.error('Error al cargar emails:', error);
        // Mantener emails vacíos en caso de error
        this.emailsSubject.next([]);
      }
    });
  }

  getFolders(): EmailFolder[] {
    const emails = this.emailsSubject.value;
    return [
      { id: 'inbox', name: 'Bandeja de entrada', icon: 'inbox', count: emails.filter(e => e.folder === 'inbox' && !e.read).length },
      { id: 'starred', name: 'Destacados', icon: 'star', count: emails.filter(e => e.starred).length },
      { id: 'sent', name: 'Enviados', icon: 'paper-plane', count: 0 },
      { id: 'drafts', name: 'Borradores', icon: 'file-text', count: 3 },
      { id: 'archive', name: 'Archivados', icon: 'archive', count: 0 },
      { id: 'trash', name: 'Papelera', icon: 'trash', count: 0 }
    ];
  }

  getLabels(): EmailLabel[] {
    return [
      { id: 'trabajo', name: 'Trabajo', color: 'bg-blue-500' },
      { id: 'urgente', name: 'Urgente', color: 'bg-red-500' },
      { id: 'clientes', name: 'Clientes', color: 'bg-green-500' },
      { id: 'proyectos', name: 'Proyectos', color: 'bg-purple-500' },
      { id: 'promociones', name: 'Promociones', color: 'bg-yellow-500' },
      { id: 'desarrollo', name: 'Desarrollo', color: 'bg-indigo-500' },
      { id: 'sistemas', name: 'Sistemas', color: 'bg-gray-500' },
      { id: 'soporte', name: 'Soporte', color: 'bg-orange-500' }
    ];
  }

  setSelectedFolder(folder: string): void {
    this.selectedFolderSubject.next(folder);
  }

  updateFilters(filters: Partial<EmailFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...filters });
  }

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  toggleEmailRead(emailId: number): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      email.id === emailId ? { ...email, read: !email.read } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  toggleEmailStarred(emailId: number): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      email.id === emailId ? { ...email, starred: !email.starred } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  updateEmailPriority(emailId: number, priority: 'high' | 'medium' | 'low'): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      email.id === emailId ? { ...email, priority } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  addLabelToEmail(emailId: number, labelId: string): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email => {
      if (email.id === emailId && !email.labels.includes(labelId)) {
        return { ...email, labels: [...email.labels, labelId] };
      }
      return email;
    });
    this.emailsSubject.next(updatedEmails);
  }

  removeLabelFromEmail(emailId: number, labelId: string): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      email.id === emailId
        ? { ...email, labels: email.labels.filter(l => l !== labelId) }
        : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  moveEmailToFolder(emailId: number, folder: string): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      email.id === emailId ? { ...email, folder } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  deleteEmail(emailId: number): void {
    this.moveEmailToFolder(emailId, 'trash');
  }

  archiveEmail(emailId: number): void {
    this.moveEmailToFolder(emailId, 'archive');
  }

  markMultipleAsRead(emailIds: number[]): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      emailIds.includes(email.id) ? { ...email, read: true } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  markMultipleAsUnread(emailIds: number[]): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      emailIds.includes(email.id) ? { ...email, read: false } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  starMultipleEmails(emailIds: number[]): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      emailIds.includes(email.id) ? { ...email, starred: true } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  unstarMultipleEmails(emailIds: number[]): void {
    const emails = this.emailsSubject.value;
    const updatedEmails = emails.map(email =>
      emailIds.includes(email.id) ? { ...email, starred: false } : email
    );
    this.emailsSubject.next(updatedEmails);
  }

  getEmailById(emailId: number): Email | undefined {
    return this.emailsSubject.value.find(email => email.id === emailId);
  }

  getUnreadCount(): number {
    return this.emailsSubject.value.filter(email => !email.read).length;
  }

  getStarredCount(): number {
    return this.emailsSubject.value.filter(email => email.starred).length;
  }

// Función para simular la carga de más correos (paginación)
  loadMoreEmails(): void {
    // Simular carga de más correos
    const newEmails: Email[] = [
      {
        id: this.emailsSubject.value.length + 1,
        from: 'nuevo@ejemplo.com',
        fromName: 'Nuevo Remitente',
        subject: 'Correo cargado dinámicamente',
        preview: 'Este es un correo que se cargó después...',
        content: 'Contenido del correo cargado dinámicamente.',
        time: 'Ahora',
        read: false,
        starred: false,
        priority: 'medium',
        labels: [],
        hasAttachment: false,
        folder: 'inbox',
        avatar: 'NR'
      }
    ];

    const currentEmails = this.emailsSubject.value;
    this.emailsSubject.next([...currentEmails, ...newEmails]);
  }

// Función para buscar en el contenido completo
  searchInContent(term: string): Email[] {
    const emails = this.emailsSubject.value;
    return emails.filter(email =>
      email.subject.toLowerCase().includes(term.toLowerCase()) ||
      email.fromName.toLowerCase().includes(term.toLowerCase()) ||
      email.preview.toLowerCase().includes(term.toLowerCase()) ||
      (email.content && email.content.toLowerCase().includes(term.toLowerCase()))
    );
  }

// Función para obtener estadísticas
  getEmailStats() {
    const emails = this.emailsSubject.value;
    return {
      total: emails.length,
      unread: emails.filter(e => !e.read).length,
      starred: emails.filter(e => e.starred).length,
      withAttachments: emails.filter(e => e.hasAttachment).length,
      highPriority: emails.filter(e => e.priority === 'high').length,
      byFolder: {
        inbox: emails.filter(e => e.folder === 'inbox').length,
        sent: emails.filter(e => e.folder === 'sent').length,
        drafts: emails.filter(e => e.folder === 'drafts').length,
        archive: emails.filter(e => e.folder === 'archive').length,
        trash: emails.filter(e => e.folder === 'trash').length
      }
    };
  }

// Función para exportar correos
  exportEmails(emailIds?: number[]): string {
    const emails = this.emailsSubject.value;
    const emailsToExport = emailIds
      ? emails.filter(email => emailIds.includes(email.id))
      : emails;

    return JSON.stringify(emailsToExport, null, 2);
  }

// Función para importar correos
  importEmails(emailsData: string): void {
    try {
      const importedEmails: Email[] = JSON.parse(emailsData);
      const currentEmails = this.emailsSubject.value;
      const maxId = Math.max(...currentEmails.map(e => e.id), 0);

      const newEmails = importedEmails.map((email, index) => ({
        ...email,
        id: maxId + index + 1
      }));

      this.emailsSubject.next([...currentEmails, ...newEmails]);
    } catch (error) {
      console.error('Error importing emails:', error);
    }
  }

// Función para simular sincronización con servidor
  syncWithServer(): Promise<void> {
    return new Promise((resolve) => {
      // Simular delay de red
      setTimeout(() => {
        console.log('Emails sincronizados con el servidor');
        resolve();
      }, 1000);
    });
  }



}
