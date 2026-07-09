import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelDetalleProductoComponent } from './panel-detalle-producto.component';

describe('PanelDetalleProductoComponent', () => {
  let component: PanelDetalleProductoComponent;
  let fixture: ComponentFixture<PanelDetalleProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelDetalleProductoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelDetalleProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
