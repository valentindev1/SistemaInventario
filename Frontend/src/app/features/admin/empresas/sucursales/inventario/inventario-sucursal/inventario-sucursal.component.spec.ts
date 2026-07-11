import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventarioSucursalComponent } from './inventario-sucursal.component';

describe('InventarioSucursalComponent', () => {
  let component: InventarioSucursalComponent;
  let fixture: ComponentFixture<InventarioSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioSucursalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventarioSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
