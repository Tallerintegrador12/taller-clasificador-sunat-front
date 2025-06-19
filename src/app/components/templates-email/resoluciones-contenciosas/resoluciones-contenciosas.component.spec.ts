import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolucionesContenciosasComponent } from './resoluciones-contenciosas.component';

describe('ResolucionesContenciosasComponent', () => {
  let component: ResolucionesContenciosasComponent;
  let fixture: ComponentFixture<ResolucionesContenciosasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolucionesContenciosasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResolucionesContenciosasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
