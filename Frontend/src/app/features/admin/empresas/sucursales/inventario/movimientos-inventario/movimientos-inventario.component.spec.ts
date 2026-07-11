import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimientosInventarioComponent } from './movimientos-inventario.component';

describe('MovimientosInventarioComponent', () => {
  let component: MovimientosInventarioComponent;
  let fixture: ComponentFixture<MovimientosInventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovimientosInventarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MovimientosInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
