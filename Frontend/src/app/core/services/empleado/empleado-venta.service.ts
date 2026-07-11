import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { AuthTemporalService } from '../auth/auth-temporal.service';

import {
  FacturaVentaEmpleadoDTO,
  VentaHistorialEmpleadoDTO
} from '../../models/venta/empleado/venta-empleado.model';

import {
  CrearVentaDTO,
  DevolucionVentaDTO
} from '../../models/venta/venta.model';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoVentaService {

  private apiUrl = `${environment.apiUrl}/empleado/ventas`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crearVenta(dto: CrearVentaDTO): Observable<FacturaVentaEmpleadoDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<FacturaVentaEmpleadoDTO>(
      this.apiUrl,
      dto,
      { params }
    );
  }

  obtenerPorId(ventaId: number): Observable<FacturaVentaEmpleadoDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<FacturaVentaEmpleadoDTO>(
      `${this.apiUrl}/${ventaId}`,
      { params }
    );
  }

  listarPorSucursal(sucursalId: number): Observable<VentaHistorialEmpleadoDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<VentaHistorialEmpleadoDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}`,
      { params }
    );
  }

  generarDevolucion(
    ventaId: number,
    dto: DevolucionVentaDTO
  ): Observable<FacturaVentaEmpleadoDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<FacturaVentaEmpleadoDTO>(
      `${this.apiUrl}/${ventaId}/devoluciones`,
      dto,
      { params }
    );
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }


  obtenerPorNumero(numeroVenta: string): Observable<FacturaVentaEmpleadoDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<FacturaVentaEmpleadoDTO>(
      `${this.apiUrl}/numero/${numeroVenta}`,
      { params }
    );
  }
}
