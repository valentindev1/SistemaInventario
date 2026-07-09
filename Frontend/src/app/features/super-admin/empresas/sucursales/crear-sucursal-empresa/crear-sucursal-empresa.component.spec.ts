import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearSucursalEmpresaComponent } from './crear-sucursal-empresa.component';

describe('CrearSucursalEmpresaComponent', () => {
  let component: CrearSucursalEmpresaComponent;
  let fixture: ComponentFixture<CrearSucursalEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearSucursalEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearSucursalEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
