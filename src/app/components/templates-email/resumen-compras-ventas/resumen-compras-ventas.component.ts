import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-resumen-compras-ventas',
  imports: [],
  templateUrl: './resumen-compras-ventas.component.html',
  styleUrl: './resumen-compras-ventas.component.css'
})
export class ResumenComprasVentasComponent {

  @Input() data: any;


  formatPeriod(periodo: string | undefined): string {
    if (!periodo) return '202505';

    // Formato: 202505 -> 2025/05
    const year = periodo.substring(0, 4);
    const month = periodo.substring(4, 6);
    return `${year}/${month}`;
  }

  getCleanHTML(htmlString: string | undefined): string {
    if (!htmlString) return '';

    // Decodificar entidades HTML y limpiar el HTML
    return htmlString
      .replace(/\\\//g, '/') // Remover escapes de barras
      .replace(/%27%27/g, '"') // Reemplazar %27%27 con comillas
      .replace(/%26%23233;/g, 'é') // Reemplazar entidad de é
      .replace(/align="right"/g, 'style="text-align: right"'); // Limpiar atributos
  }

}
