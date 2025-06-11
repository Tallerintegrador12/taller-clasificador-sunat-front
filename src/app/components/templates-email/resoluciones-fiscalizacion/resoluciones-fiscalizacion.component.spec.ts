import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionesFiscalizacionComponent } from './resoluciones-fiscalizacion.component';

describe('ResolucionesFiscalizacionComponent', () => {
  let component: ResolucionesFiscalizacionComponent;
  let fixture: ComponentFixture<ResolucionesFiscalizacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionesFiscalizacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResolucionesFiscalizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
