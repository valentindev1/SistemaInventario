import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AuthTemporalService } from '../../auth/auth-temporal.service';

import {
  ProductoAdminObtenerDTO,
  ProductoActualizarCostoDTO,
  ProductoCrearDTO,
  ProductoEditarDTO
} from '../../../models/producto/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: ProductoCrearDTO): Observable<ProductoAdminObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.post<ProductoAdminObtenerDTO>(this.apiUrl, dto, { params });
  }

  listar(): Observable<any[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  listarPorEmpresa(empresaId: number): Observable<ProductoAdminObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<ProductoAdminObtenerDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}`,
      { params }
    );
  }

  obtenerPorId(productoId: number): Observable<any> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<any>(`${this.apiUrl}/${productoId}`, { params });
  }

  editar(productoId: number, dto: ProductoEditarDTO): Observable<ProductoAdminObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.put<ProductoAdminObtenerDTO>(
      `${this.apiUrl}/${productoId}`,
      dto,
      { params }
    );
  }

  actualizarPrecioVenta(
    productoId: number,
    datos: {
      precioVenta: number;
      costoUnitario?: number;
      tipoGanancia?: 'PORCENTAJE' | 'DINERO' | null;
      valorGanancia?: number | null;
    }
  ): Observable<ProductoAdminObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.patch<ProductoAdminObtenerDTO>(
      `${this.apiUrl}/${productoId}/precio-venta`,
      datos,
      { params }
    );
  }

  actualizarCostoManual(
    productoId: number,
    datos: { costoUnitario: number }
  ): Observable<ProductoAdminObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.patch<ProductoAdminObtenerDTO>(
      `${this.apiUrl}/${productoId}/costo-manual`,
      datos,
      { params }
    );
  }

  actualizarCosto(
    productoId: number,
    datos: ProductoActualizarCostoDTO
  ): Observable<ProductoAdminObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.patch<ProductoAdminObtenerDTO>(
      `${this.apiUrl}/${productoId}/costo`,
      datos,
      { params }
    );
  }

  actualizarReglaGanancia(
    productoId: number,
    datos: {
      tipoGanancia: 'PORCENTAJE' | 'DINERO' | null;
      valorGanancia: number | null;
    }
  ): Observable<ProductoAdminObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.patch<ProductoAdminObtenerDTO>(
      `${this.apiUrl}/${productoId}/regla-ganancia`,
      datos,
      { params }
    );
  }

  eliminar(productoId: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.delete<void>(`${this.apiUrl}/${productoId}`, { params });
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
