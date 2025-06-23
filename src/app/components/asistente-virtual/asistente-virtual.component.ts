import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AsistenteVirtualService, AsistenteConsulta, AsistenteRespuesta } from '../../services/asistente-virtual.service';

interface MensajeChat {
  id: string;
  tipo: 'usuario' | 'asistente' | 'error';
  contenido: string;
  timestamp: Date;
  metadata?: AsistenteRespuesta;
  cargando?: boolean;
}

@Component({
  selector: 'app-asistente-virtual',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="asistente-virtual-container">
      <!-- Header del Chat -->
      <div class="chat-header">
        <div class="header-info">
          <div class="avatar-asistente">🤖</div>
          <div class="info-text">
            <h3>Asistente Virtual Contable</h3>
            <p class="status">Especialista en tributación peruana • En línea</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-clear" (click)="limpiarChat()" title="Limpiar chat">
            🗑️
          </button>
          <button class="btn-minimize" (click)="toggleChat()" title="Minimizar">
            {{ chatMinimizado ? '📈' : '📉' }}
          </button>
        </div>
      </div>

      <!-- Chat Container -->
      <div class="chat-container" [class.minimizado]="chatMinimizado">
        <!-- Mensajes -->
        <div class="mensajes-container" #mensajesContainer>
          <!-- Mensaje de bienvenida -->
          <div class="mensaje mensaje-asistente" *ngIf="mensajes.length === 0">
            <div class="avatar">🤖</div>
            <div class="contenido-mensaje">
              <div class="mensaje-bubble">
                <p>¡Hola! Soy tu Asistente Virtual Contable especializado en tributación peruana.</p>
                <p>Puedo ayudarte con:</p>
                <ul>
                  <li>📊 IGV y facturación electrónica</li>
                  <li>💰 Impuesto a la Renta</li>
                  <li>📋 Declaraciones tributarias</li>
                  <li>⚖️ Procedimientos de cobranza coactiva</li>
                  <li>📚 Normativa SUNAT actualizada</li>
                </ul>
                <p>¿En qué puedo ayudarte hoy?</p>
              </div>
            </div>
          </div>

          <!-- Mensajes del chat -->
          <div 
            *ngFor="let mensaje of mensajes; trackBy: trackByMessageId" 
            class="mensaje"
            [class.mensaje-usuario]="mensaje.tipo === 'usuario'"
            [class.mensaje-asistente]="mensaje.tipo === 'asistente'"
            [class.mensaje-error]="mensaje.tipo === 'error'">
            
            <div class="avatar">
              <span *ngIf="mensaje.tipo === 'usuario'">👤</span>
              <span *ngIf="mensaje.tipo === 'asistente'">🤖</span>
              <span *ngIf="mensaje.tipo === 'error'">⚠️</span>
            </div>
            
            <div class="contenido-mensaje">
              <div class="mensaje-bubble">
                <!-- Mensaje con loading -->
                <div *ngIf="mensaje.cargando" class="loading-container">
                  <div class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  <p class="loading-text">El asistente está pensando...</p>
                </div>
                
                <!-- Contenido del mensaje -->
                <div *ngIf="!mensaje.cargando">
                  <p class="mensaje-texto">{{ mensaje.contenido }}</p>
                  
                  <!-- Metadata del asistente -->
                  <div *ngIf="mensaje.metadata && mensaje.tipo === 'asistente'" class="mensaje-metadata">
                    <div class="metadata-row">
                      <span class="categoria-badge" [class]="'categoria-' + mensaje.metadata.categoria.toLowerCase()">
                        {{ mensaje.metadata.categoria }}
                      </span>
                      <span class="confianza">
                        Confianza: {{ (mensaje.metadata.confianza * 100).toFixed(0) }}%
                      </span>
                      <span class="tiempo">
                        {{ mensaje.metadata.tiempoRespuesta }}ms
                      </span>
                    </div>
                    
                    <!-- Recomendaciones -->
                    <div *ngIf="mensaje.metadata.recomendaciones && mensaje.metadata.recomendaciones.length > 0" class="recomendaciones">
                      <h5>💡 Recomendaciones:</h5>
                      <ul>
                        <li *ngFor="let rec of mensaje.metadata.recomendaciones">{{ rec }}</li>
                      </ul>
                    </div>
                    
                    <!-- Fuentes -->
                    <div *ngIf="mensaje.metadata.fuentes && mensaje.metadata.fuentes.length > 0" class="fuentes">
                      <span class="fuentes-label">📚 Fuentes:</span>
                      <span class="fuentes-list">{{ mensaje.metadata.fuentes.join(', ') }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mensaje-timestamp">
                {{ formatTimestamp(mensaje.timestamp) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sugerencias rápidas -->
        <div class="sugerencias-container" *ngIf="mensajes.length === 0 && !cargando">
          <h4>💡 Consultas frecuentes:</h4>
          <div class="sugerencias-grid">
            <button 
              *ngFor="let sugerencia of sugerencias" 
              class="sugerencia-btn"
              (click)="enviarSugerencia(sugerencia)">
              {{ sugerencia }}
            </button>
          </div>
        </div>

        <!-- Input del chat -->
        <div class="chat-input-container">
          <div class="input-wrapper">
            <textarea
              #inputConsulta
              [(ngModel)]="consultaActual"
              (keydown)="onKeyDown($event)"
              [disabled]="cargando"
              placeholder="Escribe tu consulta tributaria aquí..."
              class="chat-input"
              rows="1">
            </textarea>
            <button 
              class="btn-enviar" 
              (click)="enviarConsulta()"
              [disabled]="!consultaActual.trim() || cargando">
              <span *ngIf="!cargando">📤</span>
              <span *ngIf="cargando" class="spinner">⏳</span>
            </button>
          </div>
          <div class="input-hint">
            Ejemplo: "¿Cuándo vence mi declaración mensual?" o "¿Cómo calculo el IGV?"
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`    .asistente-virtual-container {
      width: 100%;
      max-width: 100%;
      margin: 0;
      background: white;
      border-radius: 0;
      box-shadow: none;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 700px;
      min-height: 700px;
    }

    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-asistente {
      font-size: 24px;
      background: rgba(255, 255, 255, 0.2);
      padding: 8px;
      border-radius: 50%;
    }

    .info-text h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .status {
      margin: 0;
      font-size: 12px;
      opacity: 0.9;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn-clear, .btn-minimize {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .btn-clear:hover, .btn-minimize:hover {
      background: rgba(255, 255, 255, 0.3);
    }    .chat-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      transition: all 0.3s ease;
    }

    .chat-container.minimizado {
      height: 0;
      overflow: hidden;
    }

    .mensajes-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8fafc;
      min-height: 0;
      max-height: calc(100% - 140px);
    }

    .mensaje {
      display: flex;
      margin-bottom: 16px;
      align-items: flex-start;
      gap: 12px;
    }

    .mensaje-usuario {
      flex-direction: row-reverse;
    }

    .avatar {
      font-size: 20px;
      background: #e2e8f0;
      padding: 8px;
      border-radius: 50%;
      min-width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mensaje-usuario .avatar {
      background: #667eea;
      color: white;
    }

    .mensaje-asistente .avatar {
      background: #48bb78;
      color: white;
    }

    .mensaje-error .avatar {
      background: #f56565;
      color: white;
    }

    .contenido-mensaje {
      max-width: 70%;
      display: flex;
      flex-direction: column;
    }

    .mensaje-usuario .contenido-mensaje {
      align-items: flex-end;
    }

    .mensaje-bubble {
      background: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      word-wrap: break-word;
    }

    .mensaje-usuario .mensaje-bubble {
      background: #667eea;
      color: white;
    }

    .mensaje-error .mensaje-bubble {
      background: #fed7d7;
      border-left: 4px solid #f56565;
    }

    .mensaje-texto {
      margin: 0;
      line-height: 1.5;
      white-space: pre-wrap;
    }

    .loading-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .loading-text {
      margin: 0;
      font-style: italic;
      color: #666;
    }

    .mensaje-metadata {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
    }

    .metadata-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .categoria-badge {
      background: #667eea;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .categoria-igv { background: #48bb78; }
    .categoria-renta { background: #ed8936; }
    .categoria-cobranza { background: #f56565; }
    .categoria-declaraciones { background: #667eea; }
    .categoria-contabilidad { background: #805ad5; }

    .confianza, .tiempo {
      color: #666;
      font-size: 11px;
    }

    .recomendaciones {
      margin-top: 8px;
    }

    .recomendaciones h5 {
      margin: 0 0 4px 0;
      font-size: 12px;
      color: #333;
    }

    .recomendaciones ul {
      margin: 0;
      padding-left: 16px;
      font-size: 11px;
      color: #666;
    }

    .fuentes {
      margin-top: 8px;
      font-size: 11px;
      color: #666;
    }

    .fuentes-label {
      font-weight: 500;
    }

    .mensaje-timestamp {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 4px;
    }

    .mensaje-usuario .mensaje-timestamp {
      text-align: right;
    }

    .sugerencias-container {
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .sugerencias-container h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #374151;
    }

    .sugerencias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
    }

    .sugerencia-btn {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
      transition: all 0.2s;
    }

    .sugerencia-btn:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }    .chat-input-container {
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #e2e8f0;
      flex-shrink: 0;
      position: relative;
      bottom: 0;
      left: 0;
      right: 0;
    }

    .input-wrapper {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .chat-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 12px;
      font-size: 14px;
      resize: none;
      min-height: 44px;
      max-height: 120px;
      font-family: inherit;
    }

    .chat-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .chat-input:disabled {
      background: #f9fafb;
      color: #6b7280;
    }

    .btn-enviar {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
      min-width: 44px;
      height: 44px;
    }

    .btn-enviar:hover:not(:disabled) {
      background: #5a67d8;
    }

    .btn-enviar:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .input-hint {
      font-size: 11px;
      color: #6b7280;
      margin-top: 6px;
    }

    /* Responsive */    /* Responsive Design */
    @media (max-width: 768px) {
      .asistente-virtual-container {
        height: calc(100vh - 80px);
        border-radius: 0;
      }

      .contenido-mensaje {
        max-width: 85%;
      }

      .sugerencias-grid {
        grid-template-columns: 1fr;
      }
      
      .chat-input-container {
        padding: 12px 16px;
      }
      
      .input-wrapper {
        gap: 6px;
      }
      
      .chat-input {
        font-size: 16px; /* Evita el zoom en iOS */
      }
    }

    /* Estilos para mejor visualización */
    .sugerencias-container {
      padding: 20px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .sugerencias-container h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .sugerencias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
    }

    .sugerencia-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 12px;
      text-align: left;
      transition: all 0.2s;
    }

    .sugerencia-btn:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    /* Scrollbar personalizada */
    .mensajes-container::-webkit-scrollbar {
      width: 6px;
    }

    .mensajes-container::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .mensajes-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .mensajes-container::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class AsistenteVirtualComponent implements OnInit, AfterViewChecked {
  @ViewChild('mensajesContainer') private mensajesContainer!: ElementRef;
  @ViewChild('inputConsulta') private inputConsulta!: ElementRef;
  mensajes: MensajeChat[] = [];
  consultaActual = '';
  cargando = false;
  chatMinimizado = false;
  
  sugerencias = [
    '¿Cuándo vence mi declaración mensual?',
    '¿Cómo calculo el IGV de una factura?',
    '¿Qué documentos necesito para una fiscalización?',
    '¿Cuáles son las tasas del Impuesto a la Renta?',
    '¿Qué hacer si recibo una resolución de cobranza coactiva?',
    '¿Cómo funciona la retención del IGV?'
  ];

  constructor(private asistenteService: AsistenteVirtualService) {}

  ngOnInit() {
    // Cargar capacidades del asistente al iniciar
    this.cargarCapacidades();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.mensajesContainer.nativeElement.scrollTop = this.mensajesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  trackByMessageId(index: number, mensaje: MensajeChat): string {
    return mensaje.id;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarConsulta();
    }
  }

  enviarSugerencia(sugerencia: string) {
    this.consultaActual = sugerencia;
    this.enviarConsulta();
  }

  enviarConsulta() {
    if (!this.consultaActual.trim() || this.cargando) return;

    const consulta = this.consultaActual.trim();
    this.consultaActual = '';

    // Agregar mensaje del usuario
    const mensajeUsuario: MensajeChat = {
      id: this.generateId(),
      tipo: 'usuario',
      contenido: consulta,
      timestamp: new Date()
    };
    this.mensajes.push(mensajeUsuario);

    // Agregar mensaje de carga del asistente
    const mensajeCarga: MensajeChat = {
      id: this.generateId(),
      tipo: 'asistente',
      contenido: '',
      timestamp: new Date(),
      cargando: true
    };
    this.mensajes.push(mensajeCarga);
    this.cargando = true;    // Enviar consulta al backend
    const payload: AsistenteConsulta = {
      consulta: consulta,
      usuarioId: 1,
      contexto: 'Chat web interface',
      incluirHistorial: true
    };

    this.asistenteService.consultar(payload).subscribe({
      next: (respuesta: AsistenteRespuesta) => {
        // Remover mensaje de carga
        this.mensajes = this.mensajes.filter(m => m.id !== mensajeCarga.id);
        
        // Agregar respuesta del asistente
        const mensajeRespuesta: MensajeChat = {
          id: this.generateId(),
          tipo: 'asistente',
          contenido: respuesta.respuesta,
          timestamp: new Date(),
          metadata: respuesta
        };
        this.mensajes.push(mensajeRespuesta);
        this.cargando = false;
      },
      error: (error: any) => {
        // Remover mensaje de carga
        this.mensajes = this.mensajes.filter(m => m.id !== mensajeCarga.id);
        
        // Agregar mensaje de error
        const mensajeError: MensajeChat = {
          id: this.generateId(),
          tipo: 'error',
          contenido: error.message || 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta nuevamente.',
          timestamp: new Date()
        };
        this.mensajes.push(mensajeError);
        this.cargando = false;
        console.error('Error consultando asistente:', error);
      }
    });

    // Focus al input después de enviar
    setTimeout(() => {
      this.inputConsulta?.nativeElement.focus();
    }, 100);
  }
  private cargarCapacidades() {
    this.asistenteService.obtenerCapacidades().subscribe({
      next: (capacidades: any) => {
        console.log('Capacidades del asistente:', capacidades);
      },
      error: (error: any) => {
        console.error('Error cargando capacidades:', error);
      }
    });
  }

  limpiarChat() {
    this.mensajes = [];
  }

  toggleChat() {
    this.chatMinimizado = !this.chatMinimizado;
  }

  formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
