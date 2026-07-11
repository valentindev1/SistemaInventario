import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearUsuarioEmpresaComponent } from './crear-usuario-empresa.component';

describe('CrearUsuarioEmpresaComponent', () => {
  let component: CrearUsuarioEmpresaComponent;
  let fixture: ComponentFixture<CrearUsuarioEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearUsuarioEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearUsuarioEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
