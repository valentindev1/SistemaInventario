import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { InformeFinancieroEmpresaDTO } from '../../models/informes/informe-financiero.model';
import { AuthTemporalService } from '../auth/auth-temporal.service';

@Injectable({ providedIn: 'root' })
export class InformeFinancieroService {

  private readonly apiUrl = `${environment.apiUrl}/informes-financieros`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService
  ) {}

  generar(
    empresaId: number,
    fechaInicio: string,
    fechaFin: string,
    sucursalId?: number
  ): Observable<InformeFinancieroEmpresaDTO> {
    let params = new HttpParams()
      .set('usuarioId', this.authTemporalService.obtenerUsuarioId())
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (sucursalId !== undefined) {
      params = params.set('sucursalId', sucursalId);
    }

    return this.http.get<InformeFinancieroEmpresaDTO>(
      `${this.apiUrl}/empresa/${empresaId}`,
      { params }
    );
  }
}
