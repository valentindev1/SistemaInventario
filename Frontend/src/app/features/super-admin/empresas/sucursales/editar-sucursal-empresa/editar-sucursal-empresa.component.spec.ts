import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarSucursalEmpresaComponent } from './editar-sucursal-empresa.component';

describe('EditarSucursalEmpresaComponent', () => {
  let component: EditarSucursalEmpresaComponent;
  let fixture: ComponentFixture<EditarSucursalEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarSucursalEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarSucursalEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
