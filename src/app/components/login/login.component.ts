// login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import {AuthService} from '../../services/auth.service';
import { NotificacionService } from '../../services/notificacion.service';
import { ToastNotificacionesComponent } from '../toast-notificaciones/toast-notificaciones.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastNotificacionesComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-2 sm:p-4">
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-10">
       <!-- <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.1"><circle cx="30" cy="30" r="1.5"/></g></g></svg>')"></div>-->
      </div>

      <!-- Login Card -->
      <div class="relative bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-white/20 max-h-[95vh] overflow-y-auto">
        <!-- Logo/Title -->
        <div class="text-center mb-4 sm:mb-6">
          <div class="bg-gradient-to-r from-blue-400 to-purple-400 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl mx-auto mb-2 sm:mb-3 flex items-center justify-center">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 class="text-xl sm:text-2xl font-bold text-white mb-1">{{ isRegister ? 'Registro' : 'Bienvenido' }}</h1>
          <p class="text-white/70 text-xs sm:text-sm">{{ isRegister ? 'Crea una nueva cuenta' : 'Ingresa tus credenciales para continuar' }}</p>
        </div>

        <!-- Info Message -->
        <div *ngIf="infoMessage" class="mb-3 p-2 sm:p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-200 text-xs sm:text-sm">
          {{ infoMessage }}
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="mb-3 p-2 sm:p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-xs sm:text-sm animate-pulse">
          {{ errorMessage }}
        </div>

        <!-- Login/Register Form -->
        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="space-y-3 sm:space-y-4">
          <!-- RUC Field -->
          <div class="relative">
            <label class="block text-white/80 text-sm font-medium mb-1">RUC</label>
            <div class="relative">
              <input
                type="text"
                formControlName="ruc"
                (input)="onRucInput($event)"
                maxlength="11"
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                placeholder="Ingresa tu RUC (11 dígitos)"
                [class.border-red-500]="authForm.get('ruc')?.invalid && authForm.get('ruc')?.touched"
                [class.border-green-400]="authForm.get('rememberCredentials')?.value && authForm.get('ruc')?.value && !isRegister"
              >
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
            </div>
            <div *ngIf="authForm.get('ruc')?.invalid && authForm.get('ruc')?.touched" class="mt-1 text-red-400 text-xs">
              {{ getFieldError('ruc') }}
            </div>
          </div>

          <!-- Username Field -->
          <div class="relative">
            <label class="block text-white/80 text-sm font-medium mb-1">Nombre de Usuario</label>
            <div class="relative">
              <input
                type="text"
                formControlName="username"
                (input)="onUsernameInput($event)"
                maxlength="15"
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                placeholder="Solo letras mayúsculas (7-15 chars)"
                [class.border-red-500]="authForm.get('username')?.invalid && authForm.get('username')?.touched"
                [class.border-green-400]="authForm.get('rememberCredentials')?.value && authForm.get('username')?.value && !isRegister"
              >
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
            </div>
            <div *ngIf="authForm.get('username')?.invalid && authForm.get('username')?.touched" class="mt-1 text-red-400 text-xs">
              {{ getFieldError('username') }}
            </div>
            <div *ngIf="!authForm.get('username')?.invalid && isRegister" class="mt-1 text-green-400 text-xs">
              Solo letras mayúsculas, entre 7 y 15 caracteres
            </div>
          </div>

          <!-- Password Field -->
          <div class="relative">
            <label class="block text-white/80 text-sm font-medium mb-1">Clave</label>
            <div class="relative">
              <input
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                (input)="onPasswordInput($event)"
                class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                placeholder="Mín. 5 caracteres (letras, números, @ y .)"
                [class.border-red-500]="authForm.get('password')?.invalid && authForm.get('password')?.touched"
              >
              <button
                type="button"
                (click)="togglePassword()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-white/50 hover:text-white transition-colors"
              >
                <svg *ngIf="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg *ngIf="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                </svg>
              </button>
            </div>
            <div *ngIf="authForm.get('password')?.invalid && authForm.get('password')?.touched" class="mt-1 text-red-400 text-xs">
              {{ getFieldError('password') }}
            </div>
            <div *ngIf="!authForm.get('password')?.invalid && isRegister" class="mt-1 text-green-400 text-xs">
              Mínimo 5 caracteres: letras, números, &#64; y punto (.)
            </div>
          </div>

          <!-- Remember Credentials (only for login) -->
          <div *ngIf="!isRegister" class="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="rememberCredentials" 
              formControlName="rememberCredentials"
              (change)="onRememberCredentialsChange()"
              class="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
            >
            <label for="rememberCredentials" class="text-white/80 text-sm cursor-pointer">
              Recordar usuario y RUC
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="!isSubmitButtonEnabled()"
            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span *ngIf="!isLoading" class="flex items-center justify-center">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="isRegister" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                <path *ngIf="!isRegister" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
              {{ isRegister ? 'Registrar' : 'Iniciar Sesión' }}
            </span>
            <span *ngIf="isLoading" class="flex items-center justify-center">
              <div class="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Iniciando...
            </span>
          </button>
        </form>

        <!-- Footer -->
        <div class="mt-4 sm:mt-6 text-center">
          <p class="text-white/50 text-sm">
            {{ isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?' }}
            <button type="button" (click)="toggleForm()" class="text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none cursor-pointer">{{ isRegister ? 'Inicia Sesión' : 'Regístrate' }}</button>
          </p>
        </div>
      </div>

      <!-- Floating Elements -->
      <div class="absolute top-10 left-10 w-20 h-20 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
      <div class="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/10 rounded-full blur-xl animate-pulse" style="animation-delay: 1s"></div>
      <div class="absolute top-1/2 left-5 w-16 h-16 bg-indigo-400/10 rounded-full blur-xl animate-pulse" style="animation-delay: 2s"></div>
      
      <!-- Toast Notifications Component -->
      <app-toast-notificaciones></app-toast-notificaciones>
    </div>
  `
})
export class LoginComponent implements OnInit {
  authForm: FormGroup;
  errorMessage: string = '';
  infoMessage: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  isRegister: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private notificacionService: NotificacionService
  ) {
    this.authForm = this.fb.group({
      username: ['', [Validators.required, this.usernameValidator]],
      password: ['', [Validators.required, this.passwordValidator]],
      ruc: ['', [Validators.required, this.rucValidator]],
      rememberCredentials: [false] // Agregar el control del checkbox
    });
  }

  // Validador personalizado para RUC
  rucValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Solo números
    if (!/^\d+$/.test(value)) {
      return { rucInvalid: 'El RUC debe contener solo números' };
    }

    // Exactamente 11 dígitos
    if (value.length !== 11) {
      return { rucInvalid: 'El RUC debe tener exactamente 11 dígitos' };
    }

    return null;
  }

  // Validador personalizado para nombre de usuario
  usernameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Solo letras mayúsculas
    if (!/^[A-Z]+$/.test(value)) {
      return { usernameInvalid: 'El nombre de usuario debe contener solo letras mayúsculas' };
    }

    // Entre 7 y 15 caracteres
    if (value.length < 7 || value.length > 15) {
      return { usernameInvalid: 'El nombre de usuario debe tener entre 7 y 15 caracteres' };
    }

    return null;
  }

  // Validador personalizado para contraseña
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    // Mínimo 5 caracteres
    if (value.length < 5) {
      return { passwordInvalid: 'La contraseña debe tener al menos 5 caracteres' };
    }

    // Solo letras, números, @ y punto (.)
    if (!/^[a-zA-Z0-9@.]+$/.test(value)) {
      return { passwordInvalid: 'La contraseña solo puede contener letras, números, @ y punto (.)' };
    }

    return null;
  }

  // Función para convertir automáticamente a mayúsculas
  onUsernameInput(event: any): void {
    const input = event.target;
    const value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
    input.value = value;
    this.authForm.get('username')?.setValue(value);
  }

  // Función para permitir solo números en RUC
  onRucInput(event: any): void {
    const input = event.target;
    const value = input.value.replace(/[^0-9]/g, '');
    input.value = value;
    this.authForm.get('ruc')?.setValue(value);
  }

  // Función para filtrar caracteres válidos en contraseña
  onPasswordInput(event: any): void {
    const input = event.target;
    const value = input.value.replace(/[^a-zA-Z0-9@.]/g, '');
    input.value = value;
    this.authForm.get('password')?.setValue(value);
  }

  // Maneja el cambio del checkbox "recordar credenciales"
  onRememberCredentialsChange(): void {
    const rememberValue = this.authForm.get('rememberCredentials')?.value;
    if (!rememberValue) {
      // Si se desmarca, eliminar credenciales guardadas inmediatamente
      localStorage.removeItem('rememberedCredentials');
      console.log('🗑️ Checkbox unchecked, credentials removed from localStorage');
    }
  }

  // Verifica si el botón debe estar habilitado
  isSubmitButtonEnabled(): boolean {
    // Para registro, usar la validación normal del formulario
    if (this.isRegister) {
      return this.authForm.valid && !this.isLoading;
    }
    
    // Para login, permitir si:
    // 1. El formulario es válido (modo normal) O
    // 2. Hay credenciales recordadas y solo falta la contraseña
    const rememberValue = this.authForm.get('rememberCredentials')?.value;
    const hasCredentials = rememberValue && 
                          this.authForm.get('username')?.value && 
                          this.authForm.get('ruc')?.value;
    
    const passwordValid = this.authForm.get('password')?.valid;
    
    return !this.isLoading && (this.authForm.valid || (hasCredentials && passwordValid));
  }

  // Métodos para manejar credenciales guardadas
  private saveRememberedCredentials(): void {
    const rememberValue = this.authForm.get('rememberCredentials')?.value;
    console.log('🔐 saveRememberedCredentials called, rememberCredentials:', rememberValue);
    
    if (rememberValue) {
      const username = this.authForm.get('username')?.value;
      const ruc = this.authForm.get('ruc')?.value;
      
      if (username && ruc) {
        const credentials = {
          username: username,
          ruc: ruc
        };
        console.log('💾 Saving credentials:', credentials);
        localStorage.setItem('rememberedCredentials', JSON.stringify(credentials));
        console.log('✅ Credentials saved successfully to localStorage');
      } else {
        console.log('⚠️ Cannot save incomplete credentials');
      }
    } else {
      console.log('🗑️ Removing credentials from localStorage');
      localStorage.removeItem('rememberedCredentials');
    }
  }

  private loadRememberedCredentials(): void {
    console.log('📂 loadRememberedCredentials called');
    const saved = localStorage.getItem('rememberedCredentials');
    console.log('📋 Saved credentials from localStorage:', saved);
    
    if (saved) {
      try {
        const credentials = JSON.parse(saved);
        console.log('✅ Loading credentials:', credentials);
        
        // Verificar que los datos están completos
        if (credentials.username && credentials.ruc) {
          this.authForm.patchValue({
            username: credentials.username,
            ruc: credentials.ruc,
            rememberCredentials: true
          });
          
          // Marcar los campos como tocados para que se consideren válidos
          this.authForm.get('username')?.markAsTouched();
          this.authForm.get('ruc')?.markAsTouched();
          
          // Validar manualmente los campos
          this.authForm.get('username')?.updateValueAndValidity();
          this.authForm.get('ruc')?.updateValueAndValidity();
          console.log('📝 Estado del formulario después de cargar:', this.authForm.valid);
          console.log('📝 Username value:', this.authForm.get('username')?.value);
          console.log('📝 RUC value:', this.authForm.get('ruc')?.value);
          
          // Mostrar mensaje informativo
          this.infoMessage = '🔑 Se han cargado tus credenciales guardadas. Solo ingresa tu contraseña para continuar.';
          
          // Limpiar el mensaje después de 7 segundos
          setTimeout(() => {
            this.infoMessage = '';
          }, 7000);
          
          // Enfocar automáticamente el campo de contraseña
          setTimeout(() => {
            const passwordField = document.querySelector('input[formControlName="password"]') as HTMLInputElement;
            if (passwordField) {
              passwordField.focus();
              console.log('🎯 Password field focused');
            }
          }, 100);
        } else {
          console.log('⚠️ Incomplete credentials found, removing from localStorage');
          localStorage.removeItem('rememberedCredentials');
        }
      } catch (error) {
        console.error('❌ Error parsing saved credentials:', error);
        localStorage.removeItem('rememberedCredentials');
      }
    } else {
      console.log('❌ No saved credentials found');
    }
  }

  // Método para obtener el mensaje de error específico
  getFieldError(fieldName: string): string {
    const field = this.authForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) {
      return `${fieldName === 'ruc' ? 'RUC' : fieldName === 'username' ? 'Nombre de usuario' : 'Contraseña'} es requerido`;
    }

    if (field.errors['rucInvalid']) {
      return field.errors['rucInvalid'];
    }

    if (field.errors['usernameInvalid']) {
      return field.errors['usernameInvalid'];
    }

    if (field.errors['passwordInvalid']) {
      return field.errors['passwordInvalid'];
    }

    return 'Campo inválido';
  }

  ngOnInit(): void {
    console.log('🚀 LoginComponent ngOnInit called');
    console.log('🔍 User authenticated?', this.authService.isAuthenticated());
    
    // Limpiar cualquier mensaje de error al inicializar
    this.errorMessage = '';
    this.infoMessage = '';

    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated()) {
      console.log('✅ User is authenticated, redirecting to panel-email');
      this.router.navigate(['/panel-email']);
      return;
    }

    console.log('❌ User is not authenticated, loading remembered credentials if any');
    // Cargar credenciales recordadas si existen (solo si no está autenticado)
    this.loadRememberedCredentials();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleForm(): void {
    this.isRegister = !this.isRegister;
    this.errorMessage = '';
    this.infoMessage = '';
    this.authForm.reset();
    
    // Restablecer las validaciones del formulario
    this.authForm = this.fb.group({
      username: ['', [Validators.required, this.usernameValidator]],
      password: ['', [Validators.required, this.passwordValidator]],
      ruc: ['', [Validators.required, this.rucValidator]],
      rememberCredentials: [false]
    });

    // Si cambiamos a login, cargar credenciales recordadas
    if (!this.isRegister) {
      this.loadRememberedCredentials();
    } else {
      // Si cambiamos a registro, limpiar la opción de recordar y no mostrar el checkbox
      this.authForm.patchValue({ rememberCredentials: false });
    }
  }

  onSubmit(): void {
    if (this.authForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      if (this.isRegister) {
        // Crear objeto de registro solo con los campos que espera el backend
        const registerData = {
          username: this.authForm.get('username')?.value,
          password: this.authForm.get('password')?.value,
          ruc: this.authForm.get('ruc')?.value
        };
        
        console.log('📤 Sending register data:', registerData);
        this.authService.register(registerData).subscribe({
          next: () => {
            this.isLoading = false;
            this.toggleForm(); // Vuelve al formulario de login
            this.infoMessage = '¡Registro exitoso! Ahora puedes iniciar sesión con tus nuevas credenciales.';
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error.message || 'Error en el registro';
          }
        });
      } else {
        console.log('🔑 Attempting login with rememberCredentials:', this.authForm.get('rememberCredentials')?.value);
        
        // Crear objeto de login solo con los campos que espera el backend
        const loginData = {
          username: this.authForm.get('username')?.value,
          password: this.authForm.get('password')?.value,
          ruc: this.authForm.get('ruc')?.value
        };
        
        console.log('📤 Sending login data:', loginData);
        this.authService.login(loginData).subscribe({
          next: (user) => {
            console.log('✅ Login successful, saving credentials if needed');
            this.isLoading = false;
            // Guardar credenciales ANTES de la redirección si está marcado "recordar"
            this.saveRememberedCredentials();
            console.log('🔄 Credentials saved, now handling notifications and redirection');
            this.notificacionService.verificarEstadisticasPostLogin(user.ruc);
            // La redirección ya se maneja en el auth.service
          },
          error: (err) => {
            this.errorMessage = 'Credenciales incorrectas. Verifica tu usuario y clave.';
            this.isLoading = false;
          }
        });
      }
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.authForm.controls).forEach(key => {
        this.authForm.get(key)?.markAsTouched();
      });
    }
  }
}
