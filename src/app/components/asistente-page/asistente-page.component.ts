import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AsistenteVirtualComponent } from '../asistente-virtual/asistente-virtual.component';

@Component({
  selector: 'app-asistente-page',
  standalone: true,
  imports: [CommonModule, RouterModule, AsistenteVirtualComponent],
  template: `
    <div class="asistente-page">
      <!-- Header -->
      <header class="page-header">
        <div class="container">
          <div class="header-content">
            <div class="header-info">
              <h1>🤖 Asistente Virtual Contable</h1>
              <p>Especialista en tributación peruana powered by IA</p>
            </div>            <div class="header-actions">
              <a routerLink="/panel-email" class="btn-secondary">
                ← Volver al Panel Email
              </a>
            </div>
          </div>
        </div>
      </header>      <!-- Contenido principal -->
      <main class="main-content">
        <div class="container">
          <div class="content-layout">
            <div class="chat-wrapper">
              <app-asistente-virtual></app-asistente-virtual>
            </div>
            
            <!-- Panel de información lateral -->
            <aside class="info-panel">
              <div class="info-card">
                <h3>💡 Sobre el Asistente</h3>
                <ul>
                  <li><strong>Modelo IA:</strong> Gemini-1.5-Pro</li>
                  <li><strong>Especialidad:</strong> Tributación Peruana</li>
                  <li><strong>Disponibilidad:</strong> 24/7</li>
                  <li><strong>Idioma:</strong> Español</li>
                </ul>
              </div>

              <div class="info-card">
                <h3>📚 Especialidades</h3>
                <div class="specialties">
                  <span class="specialty-tag">IGV</span>
                  <span class="specialty-tag">Impuesto a la Renta</span>
                  <span class="specialty-tag">Declaraciones</span>
                  <span class="specialty-tag">Cobranza Coactiva</span>
                  <span class="specialty-tag">Libros Contables</span>
                  <span class="specialty-tag">Fiscalizaciones</span>
                </div>
              </div>

              <div class="info-card">
                <h3>⚡ Consultas Rápidas</h3>
                <div class="quick-queries">
                  <button class="quick-query-btn" (click)="enviarConsultaRapida('¿Cuándo vence mi declaración mensual?')">
                    📅 Vencimientos
                  </button>
                  <button class="quick-query-btn" (click)="enviarConsultaRapida('¿Cómo calculo el IGV?')">
                    🧮 Cálculo IGV
                  </button>
                  <button class="quick-query-btn" (click)="enviarConsultaRapida('¿Qué documentos necesito para una fiscalización?')">
                    📋 Fiscalización
                  </button>
                  <button class="quick-query-btn" (click)="enviarConsultaRapida('¿Cuáles son las tasas del Impuesto a la Renta?')">
                    💰 Tasas IR
                  </button>
                </div>
              </div>

              <div class="info-card warning">
                <h3>⚠️ Importante</h3>
                <p>Este asistente proporciona información general. Para casos específicos complejos, consulta con un contador público colegiado.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .asistente-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding-bottom: 40px;
    }

    .page-header {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding: 20px 0;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info h1 {
      margin: 0;
      color: white;
      font-size: 28px;
      font-weight: 600;
    }

    .header-info p {
      margin: 4px 0 0 0;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }    .main-content {
      padding: 40px 0;
      min-height: calc(100vh - 200px);
    }

    .content-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 30px;
      align-items: start;
    }

    .chat-wrapper {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      max-width: 900px;
      margin: 0 auto;
      min-height: 700px;
      display: flex;
      flex-direction: column;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
      .content-layout {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .info-panel {
        order: -1;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
      }
      
      .chat-wrapper {
        order: 1;
      }
    }

    @media (max-width: 768px) {
      .container {
        padding: 0 15px;
      }
      
      .main-content {
        padding: 20px 0;
      }
      
      .info-panel {
        grid-template-columns: 1fr;
      }
    }

    .info-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .info-card.warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
    }

    .info-card h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .info-card ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .info-card li {
      padding: 4px 0;
      font-size: 14px;
      color: #6b7280;
    }

    .info-card li strong {
      color: #374151;
    }

    .specialties {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .specialty-tag {
      background: #e5e7eb;
      color: #374151;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .quick-queries {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quick-query-btn {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      border-radius: 6px;
      text-align: left;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .quick-query-btn:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .warning p {
      margin: 0;
      font-size: 13px;
      color: #856404;
      line-height: 1.4;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .main-content .container {
        grid-template-columns: 1fr;
      }

      .info-panel {
        order: -1;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        display: grid;
      }
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .main-content {
        padding: 20px 0;
      }

      .info-panel {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AsistentePageComponent {
  
  enviarConsultaRapida(consulta: string) {
    // Este método podría comunicarse con el componente hijo
    // Por ahora, el usuario puede copiar y pegar la consulta
    console.log('Consulta rápida:', consulta);
    
    // Notificar al usuario que puede usar esta consulta
    alert(`Consulta sugerida: "${consulta}"\n\nPuedes escribirla en el chat o copiarla.`);
  }
}
