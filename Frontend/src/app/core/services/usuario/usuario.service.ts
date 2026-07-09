import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthTemporalService } from '../auth/auth-temporal.service';

import {
  UsuarioCrearDTO,
  UsuarioEditarDTO,
  UsuarioObtenerDTO
} from '../../models/usuario/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: UsuarioCrearDTO): Observable<UsuarioObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<UsuarioObtenerDTO>(this.apiUrl, dto, { params });
  }

  listar(): Observable<UsuarioObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<UsuarioObtenerDTO[]>(this.apiUrl, { params });
  }

  listarPorEmpresaSeleccionada(empresaId: number): Observable<UsuarioObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<UsuarioObtenerDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}`,
      { params }
    );
  }

  listarPorSucursal(sucursalId: number): Observable<UsuarioObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<UsuarioObtenerDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}`,
      { params }
    );
  }


  empresaTieneUsuarios(empresaId: number): Observable<boolean> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<boolean>(
      `${this.apiUrl}/empresa/${empresaId}/tiene-usuarios`,
      { params }
    );
  }

  obtenerPorId(id: number): Observable<UsuarioObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<UsuarioObtenerDTO>(`${this.apiUrl}/${id}`, { params });
  }

  editar(id: number, dto: UsuarioEditarDTO): Observable<UsuarioObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.put<UsuarioObtenerDTO>(`${this.apiUrl}/${id}`, dto, { params });
  }

  eliminar(id: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
