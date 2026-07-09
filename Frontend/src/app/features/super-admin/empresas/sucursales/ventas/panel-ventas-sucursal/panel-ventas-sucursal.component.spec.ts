import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelVentasSucursalComponent } from './panel-ventas-sucursal.component';

describe('PanelVentasSucursalComponent', () => {
  let component: PanelVentasSucursalComponent;
  let fixture: ComponentFixture<PanelVentasSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelVentasSucursalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelVentasSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
