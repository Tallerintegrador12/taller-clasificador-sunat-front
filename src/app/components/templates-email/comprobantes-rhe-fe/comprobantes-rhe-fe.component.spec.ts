import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprobantesRheFeComponent } from './comprobantes-rhe-fe.component.component';

describe('ComprobantesRheFeComponent', () => {
  let component: ComprobantesRheFeComponent;
  let fixture: ComponentFixture<ComprobantesRheFeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprobantesRheFeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprobantesRheFeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
