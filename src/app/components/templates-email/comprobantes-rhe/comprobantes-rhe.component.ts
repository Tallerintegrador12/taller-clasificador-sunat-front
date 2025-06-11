import {Component, Input} from '@angular/core';

interface ReportData {
  adq_fa_rein: string;
  pro_fa_rein: string;
  pro_rxh_pend: string;
  nombre: string;
  fecha: string;
  sistema: string;
  razonSocial: string;
  pro_fa_nval: string;
  adq_fa_nval: string;
  pro_rxh_disc: string;
  pro_fa_conf: string;
  adq_fa_conf: string;
  adq_rxh_pend: string;
  adq_fa_sub: string;
  pro_rxh_rein: string;
  adq_rxh_disc: string;
  pro_rxh_sub: string;
  adq_rxh_sub: string;
  pro_rxh_nval: string;
  pro_rxh_conf: string;
  adq_fa_pend: string;
  pro_fa_pend: string;
  dependencia: string;
  adq_rxh_rein: string;
  numruc: string;
  pro_fa_sub: string;
  pro_fa_disc: string;
  adq_fa_disc: string;
  adq_rxh_nval: string;
  adq_rxh_conf: string;
  numRuc: string;
}

@Component({
  selector: 'app-comprobantes-rhe',
  imports: [],
  templateUrl: './comprobantes-rhe.component.html',
  styleUrl: './comprobantes-rhe.component.css'
})
export class ComprobantesRheComponent {

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
