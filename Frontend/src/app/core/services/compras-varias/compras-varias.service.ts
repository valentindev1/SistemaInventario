import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  CompraVariasCrearDTO,
  CompraVariasDTO
} from '../../models/compras-varias/compras-varias.model';
import { AuthTemporalService } from '../auth/auth-temporal.service';

@Injectable({
  providedIn: 'root'
})
export class ComprasVariasService {

  private apiUrl = `${environment.apiUrl}/compras-varias`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  private obtenerParametros(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }

  listarPorSucursal(sucursalId: number): Observable<CompraVariasDTO[]> {
    return this.http.get<CompraVariasDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}/registros`,
      { params: this.obtenerParametros() }
    );
  }

  registrar(
    sucursalId: number,
    dto: CompraVariasCrearDTO
  ): Observable<CompraVariasDTO> {
    return this.http.post<CompraVariasDTO>(
      `${this.apiUrl}/sucursal/${sucursalId}/registros`,
      dto,
      { params: this.obtenerParametros() }
    );
  }

  eliminar(sucursalId: number, registroId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/sucursal/${sucursalId}/registros/${registroId}`,
      { params: this.obtenerParametros() }
    );
  }
}
