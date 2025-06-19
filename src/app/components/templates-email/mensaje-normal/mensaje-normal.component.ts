import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-mensaje-normal',
  imports: [],
  templateUrl: './mensaje-normal.component.html',
  styleUrl: './mensaje-normal.component.css'
})
export class MensajeNormalComponent {

  @Input() data: any;

}
