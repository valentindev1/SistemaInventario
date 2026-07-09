import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultarFacturaComponent } from './consultar-factura.component';

describe('ConsultarFacturaComponent', () => {
  let component: ConsultarFacturaComponent;
  let fixture: ComponentFixture<ConsultarFacturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarFacturaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultarFacturaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
