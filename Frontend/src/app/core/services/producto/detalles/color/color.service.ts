import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { AuthTemporalService } from '../../../auth/auth-temporal.service';

import {
  ColorCrearDTO,
  ColorEditarDTO,
  ColorObtenerDTO
} from '../../../../models/producto/detalles/color.model';

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  private apiUrl = `${environment.apiUrl}/colores`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: ColorCrearDTO): Observable<ColorObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.post<ColorObtenerDTO>(this.apiUrl, dto, { params });
  }

  listar(): Observable<ColorObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<ColorObtenerDTO[]>(this.apiUrl, { params });
  }

  listarPorEmpresa(empresaId: number): Observable<ColorObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<ColorObtenerDTO[]>(`${this.apiUrl}/empresa/${empresaId}`, { params });
  }

  obtenerPorId(colorId: number): Observable<ColorObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.get<ColorObtenerDTO>(`${this.apiUrl}/${colorId}`, { params });
  }

  editar(colorId: number, dto: ColorEditarDTO): Observable<ColorObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.put<ColorObtenerDTO>(`${this.apiUrl}/${colorId}`, dto, { params });
  }

  eliminar(colorId: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();
    return this.http.delete<void>(`${this.apiUrl}/${colorId}`, { params });
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
