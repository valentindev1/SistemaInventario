import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AuthTemporalService } from '../../auth/auth-temporal.service';
import {
  AtributoCostoCrearDTO,
  AtributoCostoEditarDTO,
  AtributoCostoObtenerDTO
} from '../../../models/producto/atributo-costo.model';

@Injectable({
  providedIn: 'root'
})
export class AtributoCostoService {

  private apiUrl = `${environment.apiUrl}/atributos-costo`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  crear(dto: AtributoCostoCrearDTO): Observable<AtributoCostoObtenerDTO> {
    return this.http.post<AtributoCostoObtenerDTO>(
      this.apiUrl,
      dto,
      { params: this.obtenerUsuarioIdComoParam() }
    );
  }

  listarPorEmpresa(empresaId: number): Observable<AtributoCostoObtenerDTO[]> {
    return this.http.get<AtributoCostoObtenerDTO[]>(
      `${this.apiUrl}/empresa/${empresaId}`,
      { params: this.obtenerUsuarioIdComoParam() }
    );
  }

  listarActivosPorCategoria(categoriaId: number): Observable<AtributoCostoObtenerDTO[]> {
    return this.http.get<AtributoCostoObtenerDTO[]>(
      `${this.apiUrl}/categoria/${categoriaId}`,
      { params: this.obtenerUsuarioIdComoParam() }
    );
  }

  editar(
    atributoId: number,
    dto: AtributoCostoEditarDTO
  ): Observable<AtributoCostoObtenerDTO> {
    return this.http.put<AtributoCostoObtenerDTO>(
      `${this.apiUrl}/${atributoId}`,
      dto,
      { params: this.obtenerUsuarioIdComoParam() }
    );
  }

  eliminar(atributoId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${atributoId}`,
      { params: this.obtenerUsuarioIdComoParam() }
    );
  }

  activar(atributoId: number): Observable<AtributoCostoObtenerDTO> {
    return this.http.patch<AtributoCostoObtenerDTO>(
      `${this.apiUrl}/${atributoId}/activar`,
      {},
      { params: this.obtenerUsuarioIdComoParam() }
    );
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }
}
