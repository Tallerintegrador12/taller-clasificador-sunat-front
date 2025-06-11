import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-valores',
  imports: [],
  templateUrl: './valores.component.html',
  styleUrl: './valores.component.css'
})
export class ValoresComponent {

  @Input() data: any;

  getUrlDoc(numDoc: string): string {
    // Reemplaza esta URL con la lógica real del enlace
    return `https://www.sunat.gob.pe/descargar/documento/${numDoc}`;
  }

  decode(text: string): string {
    if (text) {
      return decodeURIComponent(text.replace(/%26%23243;/g, 'ó')
        .replace(/%26%23176;/g, '°')
        .replace(/%26%23233;/g, 'é'));

    }else {
      return '';
    }

  }

}
