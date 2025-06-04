import { Injectable } from '@angular/core';
import {Usuario} from '../models/usuario';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {map, Observable} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuariosUrl = '/assets/usuarios-validos.json'; // o desde un endpoint real
  private usuarioAutenticado?: Usuario;

  constructor(private http: HttpClient, private router: Router) {}

  login(ruc: string, usuario: string, password: string): Observable<boolean> {
    return this.http.get<Usuario[]>(this.usuariosUrl).pipe(
      map((usuarios) => {
        const encontrado = usuarios.find(
          (u) =>
            u.ruc === ruc &&
            u.usuario.toLowerCase() === usuario.toLowerCase() &&
            u.password === password
        );
        if (encontrado) {
          this.usuarioAutenticado = encontrado;
          return true;
        }
        return false;
      })
    );
  }

  logout() {
    this.usuarioAutenticado = undefined;
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.usuarioAutenticado;
  }
}
