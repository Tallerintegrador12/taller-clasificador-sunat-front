import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-comprobantes-rhe-fe',
  imports: [],
  templateUrl: './comprobantes-rhe-fe.component.html',
  styleUrl: './comprobantes-rhe-fe.component.css'
})
export class ComprobantesRheFeComponent {

  @Input() data: any;

  decode(text: string): string {
    if (text) {
      return decodeURIComponent(text
        .replace(/%26%23243;/g, 'ó')
        .replace(/%26%23176;/g, '°')
        .replace(/%26%23233;/g, 'é'));

    }else {
      return '';
    }

  }

  getUrl(texto: string): string {
    const numero = this.decode(texto).match(/\d{13,}/)?.[0]; // Busca número largo
    return numero ? `https://www.sunat.gob.pe/documentos/${numero}` : '#';
  }

}
