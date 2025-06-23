import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionesCobranzaComponent } from './resoluciones-cobranza.component.component';

describe('ResolucionesCobranzaComponent', () => {
  let component: ResolucionesCobranzaComponent;
  let fixture: ComponentFixture<ResolucionesCobranzaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionesCobranzaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResolucionesCobranzaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
