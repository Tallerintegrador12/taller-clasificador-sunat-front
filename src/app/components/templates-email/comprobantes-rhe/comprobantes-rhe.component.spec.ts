import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprobantesRheComponent } from './comprobantes-rhe.component';

describe('ComprobantesRheComponent', () => {
  let component: ComprobantesRheComponent;
  let fixture: ComponentFixture<ComprobantesRheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprobantesRheComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprobantesRheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
