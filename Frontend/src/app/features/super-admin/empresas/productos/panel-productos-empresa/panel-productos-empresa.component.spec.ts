import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelProductosEmpresaComponent } from './panel-productos-empresa.component';

describe('PanelProductosEmpresaComponent', () => {
  let component: PanelProductosEmpresaComponent;
  let fixture: ComponentFixture<PanelProductosEmpresaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelProductosEmpresaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelProductosEmpresaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
