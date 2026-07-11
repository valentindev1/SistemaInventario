import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelInventarioSucursalComponent } from './panel-inventario-sucursal.component';

describe('PanelInventarioSucursalComponent', () => {
  let component: PanelInventarioSucursalComponent;
  let fixture: ComponentFixture<PanelInventarioSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelInventarioSucursalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelInventarioSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
