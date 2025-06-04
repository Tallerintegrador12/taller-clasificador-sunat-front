import { Injectable } from '@angular/core';
import {MensajeSunat} from '../models/mesage-sunat';


// services/drag-drop.service.ts
@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  private draggedMail: MensajeSunat | null = null;
  private draggedMails: MensajeSunat[] = [];

  setDraggedMail(mail: MensajeSunat) {
    this.draggedMail = mail;
  }

  setDraggedMails(mails: MensajeSunat[]) {
    this.draggedMails = mails;
  }

  getDraggedMail(): MensajeSunat | null {
    return this.draggedMail;
  }

  getDraggedMails(): MensajeSunat[] {
    return this.draggedMails;
  }

  clearDraggedItems() {
    this.draggedMail = null;
    this.draggedMails = [];
  }
}

