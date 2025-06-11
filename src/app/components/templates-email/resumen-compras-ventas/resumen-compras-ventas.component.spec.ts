import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenComprasVentasComponent } from './resumen-compras-ventas.component';

describe('ResumenComprasVentasComponent', () => {
  let component: ResumenComprasVentasComponent;
  let fixture: ComponentFixture<ResumenComprasVentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenComprasVentasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenComprasVentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
