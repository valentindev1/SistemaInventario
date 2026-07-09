import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearUsuarioSucursalComponent } from './crear-usuario-sucursal.component';

describe('CrearUsuarioSucursalComponent', () => {
  let component: CrearUsuarioSucursalComponent;
  let fixture: ComponentFixture<CrearUsuarioSucursalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearUsuarioSucursalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearUsuarioSucursalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
