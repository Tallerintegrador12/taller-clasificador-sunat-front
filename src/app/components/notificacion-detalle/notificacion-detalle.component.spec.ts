import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionDetalleComponent } from './notificacion-detalle.component';

describe('NotificacionDetalleComponent', () => {
  let component: NotificacionDetalleComponent;
  let fixture: ComponentFixture<NotificacionDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificacionDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
