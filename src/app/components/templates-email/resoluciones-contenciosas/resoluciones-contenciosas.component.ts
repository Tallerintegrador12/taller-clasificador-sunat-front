import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-resoluciones-contenciosas',
  imports: [],
  templateUrl: './resoluciones-contenciosas.component.html',
  styleUrl: './resoluciones-contenciosas.component.css'
})
export class ResolucionesContenciosasComponent {

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
