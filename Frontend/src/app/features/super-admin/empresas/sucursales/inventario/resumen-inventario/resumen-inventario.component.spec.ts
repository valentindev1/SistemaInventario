import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenInventarioComponent } from './resumen-inventario.component';

describe('ResumenInventarioComponent', () => {
  let component: ResumenInventarioComponent;
  let fixture: ComponentFixture<ResumenInventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenInventarioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResumenInventarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
