import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionesAnterioresComponent } from './notificaciones-anteriores.component.component';

describe('NotificacionesAnterioresComponent', () => {
  let component: NotificacionesAnterioresComponent;
  let fixture: ComponentFixture<NotificacionesAnterioresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionesAnterioresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificacionesAnterioresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
