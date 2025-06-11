import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-resoluciones-cobranza',
  imports: [],
  templateUrl: './resoluciones-cobranza.component.html',
  styleUrl: './resoluciones-cobranza.component.css'
})
export class ResolucionesCobranzaComponent {

  @Input() data: any;


  decode(text: string): string {
    return decodeURIComponent(text
      .replace(/ï¿½/g,'ó')
      .replace(/%26%23243;/g, 'ó')
      .replace(/%26%23176;/g, '°')
      .replace(/%26%23233;/g, 'é'));
  }

  getUrl(numero: string): string {
    /*const numero = this.decode(texto).match(/\d{13,}/)?.[0]; // Busca número largo*/
    return numero ? `https://www.sunat.gob.pe/documentos/${numero}` : '#';
  }

}
