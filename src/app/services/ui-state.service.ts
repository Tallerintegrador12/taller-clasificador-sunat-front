import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
// services/ui-state.service.ts
@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private selectedFolderSubject = new BehaviorSubject<string>('inbox');
  private selectedLabelSubject = new BehaviorSubject<string>('');
  private selectedMailsSubject = new BehaviorSubject<number[]>([]);
  private searchTermSubject = new BehaviorSubject<string>('');
  private mailListWidthSubject = new BehaviorSubject<number>(600);

  public selectedFolder$ = this.selectedFolderSubject.asObservable();
  public selectedLabel$ = this.selectedLabelSubject.asObservable();
  public selectedMails$ = this.selectedMailsSubject.asObservable();
  public searchTerm$ = this.searchTermSubject.asObservable();
  public mailListWidth$ = this.mailListWidthSubject.asObservable();

  // Getters
  get selectedFolder(): string {
    return this.selectedFolderSubject.value;
  }

  get selectedLabel(): string {
    return this.selectedLabelSubject.value;
  }

  get selectedMails(): number[] {
    return this.selectedMailsSubject.value;
  }

  get searchTerm(): string {
    return this.searchTermSubject.value;
  }

  get mailListWidth(): number {
    return this.mailListWidthSubject.value;
  }

  // Setters
  setSelectedFolder(folder: string) {
    this.selectedFolderSubject.next(folder);
  }

  setSelectedLabel(label: string) {
    this.selectedLabelSubject.next(label);
  }

  setSelectedMails(mails: number[]) {
    this.selectedMailsSubject.next(mails);
  }

  setSearchTerm(term: string) {
    this.searchTermSubject.next(term);
  }

  setMailListWidth(width: number) {
    this.mailListWidthSubject.next(width);
  }

  // Utility methods
  addSelectedMail(mailId: number) {
    const current = this.selectedMails;
    if (!current.includes(mailId)) {
      this.setSelectedMails([...current, mailId]);
    }
  }

  removeSelectedMail(mailId: number) {
    const current = this.selectedMails;
    this.setSelectedMails(current.filter(id => id !== mailId));
  }

  toggleSelectedMail(mailId: number) {
    const current = this.selectedMails;
    if (current.includes(mailId)) {
      this.removeSelectedMail(mailId);
    } else {
      this.addSelectedMail(mailId);
    }
  }

  clearSelectedMails() {
    this.setSelectedMails([]);
  }
}
