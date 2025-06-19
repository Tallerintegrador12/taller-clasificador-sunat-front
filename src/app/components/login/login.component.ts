// login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {AuthService} from '../../services/auth.service';

interface Usuario {
  ruc: string;
  nombreUsuario: string;
  clave: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
       <!-- <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.1"><circle cx="30" cy="30" r="1.5"/></g></g></svg>')"></div>-->
      </div>

      <!-- Login Card -->
      <div class="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <!-- Logo/Title -->
        <div class="text-center mb-8">
          <div class="bg-gradient-to-r from-blue-400 to-purple-400 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div class="w-8 h-8 bg-white rounded-lg"></div>
          </div>
          <h1 class="text-3xl font-bold text-white mb-2">Bienvenido</h1>
          <p class="text-white/70">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm animate-pulse">
          {{ errorMessage }}
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- RUC Field -->
          <div class="relative">
            <label class="block text-white/80 text-sm font-medium mb-2">RUC</label>
            <div class="relative">
              <input
                type="text"
                formControlName="ruc"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                placeholder="Ingresa tu RUC"
                [class.border-red-500]="loginForm.get('ruc')?.invalid && loginForm.get('ruc')?.touched"
              >
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div class="w-5 h-5 bg-white/50 rounded"></div>
              </div>
            </div>
            <div *ngIf="loginForm.get('ruc')?.invalid && loginForm.get('ruc')?.touched" class="mt-1 text-red-400 text-xs">
              RUC es requerido
            </div>
          </div>

          <!-- Username Field -->
          <div class="relative">
            <label class="block text-white/80 text-sm font-medium mb-2">Nombre de Usuario</label>
            <div class="relative">
              <input
                type="text"
                formControlName="nombreUsuario"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                placeholder="Ingresa tu usuario"
                [class.border-red-500]="loginForm.get('nombreUsuario')?.invalid && loginForm.get('nombreUsuario')?.touched"
              >
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div class="w-5 h-5 bg-white/50 rounded-full"></div>
              </div>
            </div>
            <div *ngIf="loginForm.get('nombreUsuario')?.invalid && loginForm.get('nombreUsuario')?.touched" class="mt-1 text-red-400 text-xs">
              Nombre de usuario es requerido
            </div>
          </div>

          <!-- Password Field -->
          <div class="relative">
            <label class="block text-white/80 text-sm font-medium mb-2">Clave</label>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="clave"
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                placeholder="Ingresa tu clave"
                [class.border-red-500]="loginForm.get('clave')?.invalid && loginForm.get('clave')?.touched"
              >
              <button
                type="button"
                (click)="togglePassword()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white transition-colors"
              >
                <div *ngIf="!showPassword" class="w-5 h-5 bg-white/50 rounded"></div>
                <div *ngIf="showPassword" class="w-5 h-5 bg-white/30 rounded border border-white/50"></div>
              </button>
            </div>
            <div *ngIf="loginForm.get('clave')?.invalid && loginForm.get('clave')?.touched" class="mt-1 text-red-400 text-xs">
              Clave es requerida
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading"
            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span *ngIf="!isLoading" class="flex items-center justify-center">
              <div class="w-5 h-5 mr-2 bg-white/30 rounded"></div>
              Iniciar Sesión
            </span>
            <span *ngIf="isLoading" class="flex items-center justify-center">
              <div class="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              Iniciando...
            </span>
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-white/50 text-sm">
            ¿Problemas para ingresar?
            <a href="#" class="text-blue-400 hover:text-blue-300 transition-colors">Contacta soporte</a>
          </p>
        </div>
      </div>

      <!-- Floating Elements -->
      <div class="absolute top-10 left-10 w-20 h-20 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
      <div class="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-xl animate-pulse" style="animation-delay: 1s"></div>
      <div class="absolute top-1/2 left-5 w-16 h-16 bg-indigo-400/10 rounded-full blur-xl animate-pulse" style="animation-delay: 2s"></div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;

  // Lista de usuarios válidos
  private usuariosValidos: Usuario[] = [
    {
      ruc: "20123456789",
      nombreUsuario: "admin",
      clave: "admin123"
    },
    {
      ruc: "20559577627",
      nombreUsuario: "AVINETRI",
      clave: "123456"
    },
    {
      ruc: "20603704453",
      nombreUsuario: "OOKEENTI",
      clave: "123456"
    },
    {
      ruc: "20789123456",
      nombreUsuario: "operador",
      clave: "op123456"
    },
    {
      ruc: "20321654987",
      nombreUsuario: "supervisor",
      clave: "super2024"
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      ruc: ['', Validators.required],
      nombreUsuario: ['', Validators.required],
      clave: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Limpiar cualquier mensaje de error al inicializar
    this.errorMessage = '';

    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/panel-email']);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { ruc, nombreUsuario, clave } = this.loginForm.value;

      // Simular delay de autenticación
      setTimeout(() => {
        const usuarioValido = this.usuariosValidos.find(
          usuario =>
            usuario.ruc === ruc &&
            usuario.nombreUsuario === nombreUsuario &&
            usuario.clave === clave
        );

        if (usuarioValido) {
          // Login exitoso - guardar datos del usuario usando el servicio
          const userData = {
            ruc: usuarioValido.ruc,
            nombreUsuario: usuarioValido.nombreUsuario,
            loginTime: new Date().toISOString()
          };

          // Guardar en localStorage usando el servicio
          this.authService.saveUserData(userData);

          console.log('Usuario autenticado:', userData);

          // Redireccionar al panel-email
          this.router.navigate(['/panel-email']);
        } else {
          this.errorMessage = 'Credenciales incorrectas. Verifica tu RUC, usuario y clave.';
        }

        this.isLoading = false;
      }, 1500);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}
