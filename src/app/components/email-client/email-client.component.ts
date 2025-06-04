import {Component, OnInit} from '@angular/core';
import {Email} from '../../models/email';
import {EmailFilters} from '../../models/email-filters';
import {Observable} from 'rxjs';

import {EmailLabel} from '../../models/email-label';
import {EmailFolder} from '../../models/email-folder';
import {AsyncPipe, NgClass, NgForOf, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Toast} from '../../models/Toast';
import {EmailService} from '../../services/email-service.service';

@Component({
  selector: 'app-email-client',
  imports: [
    NgForOf,
    NgIf,
    FormsModule,
    AsyncPipe,
    NgClass,
    NgSwitch,
    NgSwitchCase
  ],
  templateUrl: './email-client.component.html',
  styleUrl: './email-client.component.css'
})
export class EmailClientComponent implements OnInit {
  folders: EmailFolder[] = [];
  labels: EmailLabel[] = [];
  selectedFolder = 'inbox';
  selectedEmails = new Set<number>();
  searchTerm = '';
  filters: EmailFilters = {
    read: null,
    starred: null,
    priority: null,
    hasAttachment: null,
    labels: []
  };
  selectedEmail: Email | null = null;
  filteredEmails$: Observable<Email[]>;

  // Agregar estas propiedades al componente:
  // Agregar estas propiedades al componente:
  toasts: Toast[] = [];
  toastCounter = 0;
  isLoading = false;


  constructor(private emailService: EmailService) {
    this.filteredEmails$ = this.emailService.filteredEmails$;
  }

  ngOnInit(): void {
    this.folders = this.emailService.getFolders();
    this.labels = this.emailService.getLabels();
  }

  selectFolder(folderId: string): void {
    this.selectedFolder = folderId;
    this.emailService.setSelectedFolder(folderId);
    this.selectedEmail = null;
  }

  toggleLabelFilter(labelId: string): void {
    const currentLabels = this.filters.labels;
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(l => l !== labelId)
      : [...currentLabels, labelId];

    this.filters = {...this.filters, labels: newLabels};
    this.emailService.updateFilters({labels: newLabels});
  }

  onSearchChange(term: string): void {
    this.emailService.setSearchTerm(term);
  }

  toggleFilter(filterType: keyof EmailFilters, value: any): void {
    const currentValue = this.filters[filterType];
    const newValue = currentValue === value ? null : value;

    this.filters = {...this.filters, [filterType]: newValue};
    this.emailService.updateFilters({[filterType]: newValue});
  }

  selectEmail(email: Email): void {
    this.selectedEmail = email;
    if (!email.read) {
      this.emailService.toggleEmailRead(email.id);
    }
  }

  closeEmailDetail(): void {
    this.selectedEmail = null;
  }

  toggleEmailSelection(emailId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedEmails.add(emailId);
    } else {
      this.selectedEmails.delete(emailId);
    }
  }

  toggleStarred(emailId: number, event: Event): void {
    event.stopPropagation();
    this.emailService.toggleEmailStarred(emailId);
  }

  trackByEmailId(index: number, email: Email): number {
    return email.id;
  }

  // Métodos para clases CSS
  getFolderButtonClass(folderId: string): string {
    const baseClass = 'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all';
    const activeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
    const inactiveClass = 'text-gray-700 hover:bg-gray-100';

    return `${baseClass} ${this.selectedFolder === folderId ? activeClass : inactiveClass}`;
  }

  getFolderCountClass(folderId: string): string {
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';
    const activeClass = 'bg-blue-100 text-blue-700';
    const inactiveClass = 'bg-gray-200 text-gray-600';

    return `${baseClass} ${this.selectedFolder === folderId ? activeClass : inactiveClass}`;
  }

  getLabelButtonClass(labelId: string): string {
    const baseClass = 'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all';
    const activeClass = 'bg-gray-100 text-gray-900';
    const inactiveClass = 'text-gray-600 hover:bg-gray-50';

    return `${baseClass} ${this.filters.labels.includes(labelId) ? activeClass : inactiveClass}`;
  }

  getFilterButtonClass(filterType: string, value: any): string {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium transition-all';
    const isActive = this.filters[filterType as keyof EmailFilters] === value;

    if (isActive) {
      switch (filterType) {
        case 'read':
          return `${baseClass} bg-blue-100 text-blue-700 border border-blue-200`;
        case 'starred':
          return `${baseClass} bg-yellow-100 text-yellow-700 border border-yellow-200`;
        case 'hasAttachment':
          return `${baseClass} bg-green-100 text-green-700 border border-green-200`;
        case 'priority':
          return `${baseClass} bg-red-100 text-red-700 border border-red-200`;
        default:
          return `${baseClass} bg-gray-100 text-gray-700`;
      }
    }

    return `${baseClass} bg-gray-100 text-gray-600 hover:bg-gray-200`;
  }

  getEmailRowClass(email: Email): string {
    const baseClass = 'flex items-center p-4 hover:bg-blue-100 hover:border-l-blue-500 cursor-pointer transition-all border-l-4';
    const priorityClass = this.getPriorityBorderClass(email.priority);
    const readClass = !email.read ? 'bg-blue-50/30' : '';
    const selectedClass = this.selectedEmail?.id === email.id ? 'bg-blue-100 border-l-blue-500' : 'border-l-transparent';

    return `${baseClass} ${priorityClass} ${readClass} ${selectedClass}`;
  }

  getPriorityBorderClass(priority: string): string {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-transparent';
    }
  }

  getFromNameClass(email: Email): string {
    const baseClass = 'font-medium';
    return !email.read ? `${baseClass} text-gray-900` : `${baseClass} text-gray-600`;
  }

  getSubjectClass(email: Email): string {
    const baseClass = 'font-medium mb-1';
    return !email.read ? `${baseClass} text-gray-900` : `${baseClass} text-gray-600`;
  }

  getStarButtonClass(isStarred: boolean): string {
    const baseClass = 'p-1 rounded hover:bg-gray-200 transition-colors';
    return `${baseClass} ${isStarred ? 'text-yellow-500' : 'text-gray-400'}`;
  }

  getStarIconClass(isStarred: boolean): string {

    return isStarred ? 'fas fa-star' : 'far fa-star';
  }

  getLabelColor(labelId: string): string {
    const label = this.labels.find(l => l.id === labelId);
    return label ? label.color : 'bg-gray-500';
  }

  getLabelName(labelId: string): string {
    const label = this.labels.find(l => l.id === labelId);
    return label ? label.name : labelId;
  }

  // Funciones adicionales útiles para el cliente de correo

  markAllAsRead(): void {
    this.filteredEmails$.subscribe(emails => {
      const unreadEmails = emails.filter(email => !email.read);
      const emailIds = unreadEmails.map(email => email.id);
      if (emailIds.length > 0) {
        this.emailService.markMultipleAsRead(emailIds);
        this.showToastMessage(`${emailIds.length} correos marcados como leídos`, 'success');
        this.refreshFolderCounts();
      }
    }).unsubscribe();
  }

  deleteSelectedEmails(): void {
    if (this.selectedEmails.size === 0) return;

    if (confirm(`¿Estás seguro de que quieres eliminar ${this.selectedEmails.size} correo(s)?`)) {
      this.selectedEmails.forEach(emailId => {
        this.emailService.deleteEmail(emailId);
      });

      this.showToastMessage(`${this.selectedEmails.size} correos movidos a la papelera`, 'success');
      this.selectedEmails.clear();
      this.refreshFolderCounts();
    }
  }

  archiveSelectedEmails(): void {
    if (this.selectedEmails.size === 0) return;

    this.selectedEmails.forEach(emailId => {
      this.emailService.archiveEmail(emailId);
    });

    this.showToastMessage(`${this.selectedEmails.size} correos archivados`, 'success');
    this.selectedEmails.clear();
    this.refreshFolderCounts();
  }

  selectAllEmails(): void {
    this.filteredEmails$.subscribe(emails => {
      this.selectedEmails.clear();
      emails.forEach(email => this.selectedEmails.add(email.id));
    }).unsubscribe();
  }

  clearSelection(): void {
    this.selectedEmails.clear();
  }

  clearAllFilters(): void {
    this.filters = {
      read: null,
      starred: null,
      priority: null,
      hasAttachment: null,
      labels: []
    };
    this.emailService.updateFilters(this.filters);
    this.searchTerm = '';
    this.emailService.setSearchTerm('');
    this.showToastMessage('Filtros limpiados', 'info');
  }

  getTotalUnreadCount(): number {
    return this.emailService.getUnreadCount();
  }

  refreshFolderCounts(): void {
    this.folders = this.emailService.getFolders();
  }

  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'a':
          event.preventDefault();
          this.selectAllEmails();
          break;
        case 'r':
          event.preventDefault();
          this.markAllAsRead();
          break;
        case 'Delete':
          event.preventDefault();
          this.deleteSelectedEmails();
          break;
        case 'Escape':
          event.preventDefault();
          this.clearSelection();
          this.selectedEmail = null;
          break;
        case 'f':
          event.preventDefault();
          const searchInput = document.querySelector('input[placeholder="Buscar correos..."]') as HTMLInputElement;
          searchInput?.focus();
          break;
      }
    }

    // Navegación con teclas de flecha
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      this.navigateEmails(event.key === 'ArrowDown');
      event.preventDefault();
    }
  }

  navigateEmails(down: boolean): void {
    this.filteredEmails$.subscribe(emails => {
      if (emails.length === 0) return;

      const currentIndex = this.selectedEmail
        ? emails.findIndex(email => email.id === this.selectedEmail!.id)
        : -1;

      let nextIndex;
      if (down) {
        nextIndex = currentIndex < emails.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : emails.length - 1;
      }

      this.selectEmail(emails[nextIndex]);
    }).unsubscribe();
  }

  exportSelectedEmails(): void {
    if (this.selectedEmails.size === 0) {
      this.showToastMessage('No hay correos seleccionados para exportar', 'error');
      return;
    }

    this.filteredEmails$.subscribe(emails => {
      const selectedEmailsData = emails.filter(email => this.selectedEmails.has(email.id));
      const dataStr = this.emailService.exportEmails(Array.from(this.selectedEmails));
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `correos-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      this.showToastMessage(`${this.selectedEmails.size} correos exportados`, 'success');
    }).unsubscribe();
  }

  printEmail(): void {
    if (!this.selectedEmail) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const attachmentsList = this.selectedEmail.attachments?.map(att =>
        `<li>${att.name} (${att.size})</li>`
      ).join('') || '';

      printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir - ${this.selectedEmail.subject}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              border-bottom: 2px solid #ccc;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .content {
              line-height: 1.8;
              margin-bottom: 20px;
            }
            .labels {
              margin: 10px 0;
            }
            .label {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              margin-right: 5px;
            }
            .attachments {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 5px;
              padding: 15px;
              margin-top: 20px;
            }
            .priority-high { color: #dc3545; font-weight: bold; }
            .priority-medium { color: #ffc107; font-weight: bold; }
            .priority-low { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${this.selectedEmail.subject}</h1>
            <p><strong>De:</strong> ${this.selectedEmail.fromName} &lt;${this.selectedEmail.from}&gt;</p>
            <p><strong>Fecha:</strong> ${this.selectedEmail.time}</p>
            <p><strong>Prioridad:</strong>
              <span class="priority-${this.selectedEmail.priority}">
                ${this.selectedEmail.priority.toUpperCase()}
              </span>
            </p>
            ${this.selectedEmail.labels.length > 0 ? `
              <div class="labels">
                <strong>Etiquetas:</strong>
                ${this.selectedEmail.labels.map(labelId =>
        `<span class="label">${this.getLabelName(labelId)}</span>`
      ).join('')}
              </div>
            ` : ''}
          </div>
          <div class="content">
            <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${this.selectedEmail.content}</pre>
          </div>
          ${attachmentsList ? `
            <div class="attachments">
              <h3>Adjuntos:</h3>
              <ul>${attachmentsList}</ul>
            </div>
          ` : ''}
        </body>
      </html>
    `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  }

  changePriority(priority: 'high' | 'medium' | 'low'): void {
    if (this.selectedEmails.size === 0) {
      this.showToastMessage('No hay correos seleccionados', 'error');
      return;
    }

    this.selectedEmails.forEach(emailId => {
      this.emailService.updateEmailPriority(emailId, priority);
    });

    const priorityText = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };

    this.showToastMessage(
      `Prioridad cambiada a ${priorityText[priority]} para ${this.selectedEmails.size} correo(s)`,
      'success'
    );
    this.selectedEmails.clear();
  }

  addLabelToSelected(labelId: string): void {
    if (this.selectedEmails.size === 0) {
      this.showToastMessage('No hay correos seleccionados', 'error');
      return;
    }

    this.selectedEmails.forEach(emailId => {
      this.emailService.addLabelToEmail(emailId, labelId);
    });

    const labelName = this.getLabelName(labelId);
    this.showToastMessage(
      `Etiqueta "${labelName}" añadida a ${this.selectedEmails.size} correo(s)`,
      'success'
    );
    this.selectedEmails.clear();
  }

  removeLabelFromSelected(labelId: string): void {
    if (this.selectedEmails.size === 0) {
      this.showToastMessage('No hay correos seleccionados', 'error');
      return;
    }

    this.selectedEmails.forEach(emailId => {
      this.emailService.removeLabelFromEmail(emailId, labelId);
    });

    const labelName = this.getLabelName(labelId);
    this.showToastMessage(
      `Etiqueta "${labelName}" removida de ${this.selectedEmails.size} correo(s)`,
      'success'
    );
    this.selectedEmails.clear();
  }

  toggleCompactView(): void {
    // Implementar toggle de vista compacta
    // Esto requeriría una propiedad adicional y cambios de CSS
    console.log('Toggle vista compacta');
    this.showToastMessage('Vista compacta no implementada aún', 'info');
  }

  refreshEmails(): void {
    this.isLoading = true;
    this.emailService.syncWithServer().then(() => {
      this.refreshFolderCounts();
      this.isLoading = false;
      this.showToastMessage('Correos actualizados', 'success');
    }).catch(() => {
      this.isLoading = false;
      this.showToastMessage('Error al actualizar correos', 'error');
    });
  }

// Funciones para manejar toast notifications
  showToastMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast: Toast = {
      id: this.toastCounter++,
      message,
      type,
      timestamp: Date.now()
    };

    this.toasts.push(toast);

    // Auto-remove después de 4 segundos
    setTimeout(() => {
      this.removeToast(toast.id);
    }, 4000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  clearAllToasts(): void {
    this.toasts = [];
  }

// Funciones para manejar drag and drop
  onDragStart(event: DragEvent, email: Email): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', email.id.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent, targetFolder: string): void {
    event.preventDefault();
    const emailId = parseInt(event.dataTransfer!.getData('text/plain'));

    if (emailId && targetFolder) {
      this.emailService.moveEmailToFolder(emailId, targetFolder);
      this.showToastMessage(`Correo movido a ${targetFolder}`, 'success');
      this.refreshFolderCounts();
    }
  }

// Función para manejar la importación de archivos
  onFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          this.emailService.importEmails(content);
          this.showToastMessage('Correos importados exitosamente', 'success');
          this.refreshFolderCounts();
        } catch (error) {
          this.showToastMessage('Error al importar correos', 'error');
        }
      };
      reader.readAsText(file);
    } else {
      this.showToastMessage('Por favor selecciona un archivo JSON válido', 'error');
    }

    // Limpiar el input
    input.value = '';
  }

// Función para obtener estadísticas
  getEmailStats() {
    return this.emailService.getEmailStats();
  }

// Función para alternar entre leído/no leído en lote
  toggleReadStatusForSelected(): void {
    if (this.selectedEmails.size === 0) return;

    this.filteredEmails$.subscribe(emails => {
      const selectedEmailsData = emails.filter(email => this.selectedEmails.has(email.id));
      const hasUnread = selectedEmailsData.some(email => !email.read);

      if (hasUnread) {
        this.emailService.markMultipleAsRead(Array.from(this.selectedEmails));
        this.showToastMessage('Correos marcados como leídos', 'success');
      } else {
        this.emailService.markMultipleAsUnread(Array.from(this.selectedEmails));
        this.showToastMessage('Correos marcados como no leídos', 'success');
      }

      this.selectedEmails.clear();
      this.refreshFolderCounts();
    }).unsubscribe();
  }

// Función para alternar estrella en lote
  toggleStarredForSelected(): void {
    if (this.selectedEmails.size === 0) return;

    this.filteredEmails$.subscribe(emails => {
      const selectedEmailsData = emails.filter(email => this.selectedEmails.has(email.id));
      const hasUnstarred = selectedEmailsData.some(email => !email.starred);

      if (hasUnstarred) {
        this.emailService.starMultipleEmails(Array.from(this.selectedEmails));
        this.showToastMessage('Correos marcados como destacados', 'success');
      } else {
        this.emailService.unstarMultipleEmails(Array.from(this.selectedEmails));
        this.showToastMessage('Estrella removida de los correos', 'success');
      }

      this.selectedEmails.clear();
      this.refreshFolderCounts();
    }).unsubscribe();
  }
}
