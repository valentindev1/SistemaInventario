import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { AuthTemporalService } from '../auth/auth-temporal.service';

import {
  CancelarVentaDTO,
  CrearVentaDTO,
  DevolucionVentaDTO,
  FacturaVentaDTO, InformeConsolidadoVentasDTO,
  InformeVentasDTO,
  PeriodoInformeVentas
} from '../../models/venta/venta.model';
import {RankingProductosVentasDTO} from '../../models/producto/producto.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private apiUrl = `${environment.apiUrl}/ventas`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  private obtenerUsuarioIdComoParam(): HttpParams {
    const usuarioId = this.authTemporalService.obtenerUsuarioId();

    return new HttpParams().set('usuarioId', usuarioId);
  }

  crearVenta(dto: CrearVentaDTO): Observable<FacturaVentaDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<FacturaVentaDTO>(
      this.apiUrl,
      dto,
      { params }
    );
  }


  generarSoporteVentaPdf(ventaId: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${ventaId}/soporte/pdf`,
      {
        responseType: 'blob'
      }
    );
  }


  obtenerPorId(ventaId: number): Observable<FacturaVentaDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<FacturaVentaDTO>(
      `${this.apiUrl}/${ventaId}`,
      { params }
    );
  }

  obtenerPorNumero(numeroVenta: string): Observable<FacturaVentaDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<FacturaVentaDTO>(
      `${this.apiUrl}/numero/${numeroVenta}`,
      { params }
    );
  }

  listarPorSucursal(sucursalId: number): Observable<FacturaVentaDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<FacturaVentaDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}`,
      { params }
    );
  }

  cancelarVenta(ventaId: number, motivo: string): Observable<FacturaVentaDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.put<FacturaVentaDTO>(
      `${this.apiUrl}/${ventaId}/cancelar`,
      { motivo },
      { params }
    );
  }

  generarDevolucion(
    ventaId: number,
    dto: DevolucionVentaDTO
  ): Observable<FacturaVentaDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<FacturaVentaDTO>(
      `${this.apiUrl}/${ventaId}/devoluciones`,
      dto,
      { params }
    );
  }

  generarInformeConsolidado(
    sucursalId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<InformeConsolidadoVentasDTO> {
    const params = this.obtenerUsuarioIdComoParam()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<InformeConsolidadoVentasDTO>(
      `${this.apiUrl}/informe-consolidado/sucursal/${sucursalId}`,
      { params }
    );
  }

  obtenerRankingProductosVentas(
    sucursalId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<RankingProductosVentasDTO> {
    const params = this.obtenerUsuarioIdComoParam()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<RankingProductosVentasDTO>(
      `${this.apiUrl}/ranking-productos/sucursal/${sucursalId}`,
      { params }
    );
  }


  generarInformeVentas(
    sucursalId: number,
    periodo: PeriodoInformeVentas,
    fecha?: string
  ): Observable<InformeVentasDTO> {
    let params = this.obtenerUsuarioIdComoParam()
      .set('periodo', periodo);

    if (fecha) {
      params = params.set('fecha', fecha);
    }

    return this.http.get<InformeVentasDTO>(
      `${this.apiUrl}/sucursal/${sucursalId}/informe`,
      { params }
    );
  }
}
