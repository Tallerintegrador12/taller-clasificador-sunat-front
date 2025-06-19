import { Injectable } from '@angular/core';
import {Usuario, UsuarioAutenticado} from '../models/usuario';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {BehaviorSubject, map, Observable} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'userData';
  private currentUserSubject = new BehaviorSubject<UsuarioAutenticado | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Cargar usuario desde localStorage al inicializar el servicio
    this.loadUserFromStorage();
  }

  /**
   * Guarda los datos del usuario autenticado en localStorage
   */
  saveUserData(userData: UsuarioAutenticado): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
      this.currentUserSubject.next(userData);
    } catch (error) {
      console.error('Error al guardar datos del usuario:', error);
    }
  }

  /**
   * Obtiene los datos del usuario desde localStorage
   */
  getUserData(): UsuarioAutenticado | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      return null;
    }
  }

  /**
   * Obtiene el RUC del usuario autenticado
   */
  getUserRuc(): string | null {
    const userData = this.getUserData();
    return userData ? userData.ruc : null;
  }

  /**
   * Obtiene el nombre de usuario autenticado
   */
  getUserName(): string | null {
    const userData = this.getUserData();
    return userData ? userData.nombreUsuario : null;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.getUserData() !== null;
  }

  /**
   * Obtiene el usuario actual como Observable
   */
  getCurrentUser(): Observable<UsuarioAutenticado | null> {
    return this.currentUser$;
  }

  /**
   * Obtiene el usuario actual de forma síncrona
   */
  getCurrentUserSync(): UsuarioAutenticado | null {
    return this.currentUserSubject.value;
  }

  /**
   * Elimina los datos del usuario (logout)
   */
  logout(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Error al eliminar datos del usuario:', error);
    }
  }

  /**
   * Carga los datos del usuario desde localStorage al inicializar
   */
  private loadUserFromStorage(): void {
    const userData = this.getUserData();
    if (userData) {
      this.currentUserSubject.next(userData);
    }
  }

  /**
   * Actualiza el tiempo de última actividad
   */
  updateLastActivity(): void {
    const userData = this.getUserData();
    if (userData) {
      userData.loginTime = new Date().toISOString();
      this.saveUserData(userData);
    }
  }
}
