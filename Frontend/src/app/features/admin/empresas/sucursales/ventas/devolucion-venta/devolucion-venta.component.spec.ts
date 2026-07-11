import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevolucionVentaComponent } from './devolucion-venta.component';

describe('DevolucionVentaComponent', () => {
  let component: DevolucionVentaComponent;
  let fixture: ComponentFixture<DevolucionVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevolucionVentaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevolucionVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
