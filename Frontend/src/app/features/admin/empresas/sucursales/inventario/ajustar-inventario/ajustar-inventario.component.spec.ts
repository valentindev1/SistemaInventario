import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjustarInventarioComponent } from './ajustar-inventario.component';

describe('AjustarInventarioComponent', () => {
  let component: AjustarInventarioComponent;
  let fixture: ComponentFixture<AjustarInventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjustarInventarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjustarInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
