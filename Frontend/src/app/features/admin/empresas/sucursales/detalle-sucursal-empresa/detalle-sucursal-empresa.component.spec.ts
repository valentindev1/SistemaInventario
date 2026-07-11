import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleSucursalEmpresaComponent } from './detalle-sucursal-empresa.component';

describe('DetalleSucursalEmpresaComponent', () => {
  let component: DetalleSucursalEmpresaComponent;
  let fixture: ComponentFixture<DetalleSucursalEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleSucursalEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleSucursalEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
