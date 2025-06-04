import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import {Email} from '../models/email';
import {EmailFilters} from '../models/email-filters';
import {EmailLabel} from '../models/email-label';
import {EmailFolder} from '../models/email-folder';



@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private emailsSubject = new BehaviorSubject<Email[]>([
    {
      id: 1,
      from: 'CEO@empresa.com',
      fromName: 'Roberto Martinez',
      subject: 'Reunión estratégica Q2 - Urgente',
      preview: 'Necesitamos revisar los objetivos del segundo trimestre y definir las prioridades para el próximo período...',
      content: 'Estimado equipo,\n\nEspero que se encuentren bien. Necesitamos programar una reunión estratégica para revisar los objetivos del segundo trimestre y definir las prioridades para el próximo período.\n\nPor favor, confirmen su disponibilidad para la próxima semana.\n\nSaludos,\nRoberto',
      time: '10:30',
      read: false,
      starred: true,
      priority: 'high',
      labels: ['trabajo', 'urgente'],
      hasAttachment: true,
      folder: 'inbox',
      avatar: 'RM',
      attachments: [
        { id: 1, name: 'agenda-q2.pdf', size: '2.3 MB', type: 'pdf' }
      ]
    },
    {
      id: 2,
      from: 'marketing@newsletter.com',
      fromName: 'Newsletter Marketing',
      subject: 'Las mejores ofertas de la semana',
      preview: 'Descubre increíbles descuentos en productos seleccionados. No te pierdas estas oportunidades únicas...',
      content: 'Hola,\n\n¡No te pierdas nuestras ofertas especiales de esta semana! Tenemos descuentos de hasta el 50% en productos seleccionados.',
      time: '09:15',
      read: true,
      starred: false,
      priority: 'low',
      labels: ['promociones'],
      hasAttachment: false,
      folder: 'inbox',
      avatar: 'NM'
    },
    {
      id: 3,
      from: 'cliente@importante.com',
      fromName: 'Ana García',
      subject: 'Propuesta de proyecto - Revisión final',
      preview: 'Hemos revisado la propuesta y tenemos algunos comentarios importantes que nos gustaría discutir...',
      content: 'Estimado equipo,\n\nHemos revisado la propuesta del proyecto y en general nos parece muy bien estructurada. Tenemos algunos comentarios menores que nos gustaría discutir en una llamada.\n\n¿Podrían confirmar disponibilidad para esta semana?\n\nSaludos,\nAna García',
      time: 'Ayer',
      read: false,
      starred: true,
      priority: 'high',
      labels: ['clientes', 'proyectos'],
      hasAttachment: true,
      folder: 'inbox',
      avatar: 'AG',
      attachments: [
        { id: 2, name: 'propuesta-revisada.docx', size: '1.8 MB', type: 'docx' }
      ]
    },
    {
      id: 4,
      from: 'equipo@desarrollo.com',
      fromName: 'Equipo Desarrollo',
      subject: 'Deploy exitoso - Versión 2.1.0',
      preview: 'El deploy de la nueva versión se completó correctamente sin incidencias. Todas las funcionalidades están operativas...',
      content: 'Equipo,\n\nLes informo que el deploy de la versión 2.1.0 se completó exitosamente a las 3:00 AM sin ninguna incidencia.\n\nTodas las nuevas funcionalidades están operativas y los tests automatizados pasaron correctamente.',
      time: 'Ayer',
      read: true,
      starred: false,
      priority: 'medium',
      labels: ['desarrollo', 'sistemas'],
      hasAttachment: false,
      folder: 'inbox',
      avatar: 'ED'
    },
    {
      id: 5,
      from: 'soporte@plataforma.com',
      fromName: 'Soporte Técnico',
      subject: 'Ticket #12345 - Resolución',
      preview: 'Tu ticket ha sido resuelto. Hemos implementado la solución solicitada y verificado que funciona correctamente...',
      content: 'Hola,\n\nTu ticket #12345 ha sido resuelto exitosamente. Hemos implementado la solución solicitada y verificado que todo funciona correctamente.\n\nSi tienes alguna pregunta adicional, no dudes en contactarnos.\n\nSaludos,\nEquipo de Soporte',
      time: '2 días',
      read: false,
      starred: false,
      priority: 'medium',
      labels: ['soporte'],
      hasAttachment: false,
      folder: 'inbox',
      avatar: 'ST'
    }
  ]);

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
