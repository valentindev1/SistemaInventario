import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelClientesSucursalComponent } from './panel-clientes-sucursal.component';

describe('PanelClientesSucursalComponent', () => {
  let component: PanelClientesSucursalComponent;
  let fixture: ComponentFixture<PanelClientesSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelClientesSucursalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelClientesSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
