import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MensajeNormalComponent } from './mensaje-normal.component';

describe('MensajeNormalComponent', () => {
  let component: MensajeNormalComponent;
  let fixture: ComponentFixture<MensajeNormalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensajeNormalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MensajeNormalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
