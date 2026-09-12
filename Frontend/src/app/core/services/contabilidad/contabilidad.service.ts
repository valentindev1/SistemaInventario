import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ClasificacionContableCrearDTO,
  ClasificacionContableDTO,
  ClasificacionContableEditarDTO,
  ConceptoGastoCrearDTO,
  ConceptoGastoDTO,
  ConceptoGastoEditarDTO,
  RegistroContableCrearDTO,
  RegistroContableDTO,
  RegistroGastoEmpleadoDTO
} from '../../models/contabilidad/contabilidad.model';
import { AuthTemporalService } from '../auth/auth-temporal.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ContabilidadService {

  private apiUrl = `${environment.apiUrl}/contabilidad`;

  constructor(
    private http: HttpClient,
    private authTemporalService: AuthTemporalService,
    private authService: AuthService
  ) {}

  private obtenerParametros(): HttpParams {
    return new HttpParams().set(
      'usuarioId',
      this.authTemporalService.obtenerUsuarioId()
    );
  }

  listarPorSucursal(sucursalId: number): Observable<RegistroContableDTO[]> {
    return this.http.get<RegistroContableDTO[]>(
      `${this.apiUrl}/sucursal/${sucursalId}/registros`,
      { params: this.obtenerParametros() }
    );
  }

  registrar(
    sucursalId: number,
    dto: RegistroContableCrearDTO
  ): Observable<RegistroContableDTO> {
    return this.http.post<RegistroContableDTO>(
      `${this.apiUrl}/sucursal/${sucursalId}/registros`,
      dto,
      { params: this.obtenerParametros() }
    );
  }

  listarGastosEmpleado(sucursalId: number): Observable<RegistroContableDTO[]> {
    return this.http.get<RegistroContableDTO[]>(
      `${environment.apiUrl}/empleado/contabilidad/sucursal/${sucursalId}/gastos`,
      { params: this.obtenerParametrosAutenticados() }
    );
  }

  registrarGastoEmpleado(
    sucursalId: number,
    dto: RegistroGastoEmpleadoDTO
  ): Observable<RegistroContableDTO> {
    return this.http.post<RegistroContableDTO>(
      `${environment.apiUrl}/empleado/contabilidad/sucursal/${sucursalId}/gastos`,
      dto,
      { params: this.obtenerParametrosAutenticados() }
    );
  }

  editarGastoEmpleado(
    sucursalId: number,
    registroId: number,
    dto: RegistroGastoEmpleadoDTO
  ): Observable<RegistroContableDTO> {
    return this.http.put<RegistroContableDTO>(
      `${environment.apiUrl}/empleado/contabilidad/sucursal/${sucursalId}/gastos/${registroId}`,
      dto,
      { params: this.obtenerParametrosAutenticados() }
    );
  }

  eliminarGastoEmpleado(
    sucursalId: number,
    registroId: number
  ): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/empleado/contabilidad/sucursal/${sucursalId}/gastos/${registroId}`,
      { params: this.obtenerParametrosAutenticados() }
    );
  }

  private obtenerParametrosAutenticados(): HttpParams {
    const usuarioId = this.authService.obtenerUsuarioId();

    if (!usuarioId) {
      throw new Error('No se pudo identificar el usuario autenticado.');
    }

    return new HttpParams().set('usuarioId', usuarioId.toString());
  }

  listarConceptos(empresaId: number): Observable<ConceptoGastoDTO[]> {
    return this.http.get<ConceptoGastoDTO[]>(
      `${this.apiUrl}/conceptos/empresa/${empresaId}`,
      { params: this.obtenerParametros() }
    );
  }

  listarConceptosActivos(empresaId: number): Observable<ConceptoGastoDTO[]> {
    return this.http.get<ConceptoGastoDTO[]>(
      `${this.apiUrl}/conceptos/empresa/${empresaId}/activos`,
      { params: this.obtenerParametros() }
    );
  }

  crearConcepto(dto: ConceptoGastoCrearDTO): Observable<ConceptoGastoDTO> {
    return this.http.post<ConceptoGastoDTO>(
      `${this.apiUrl}/conceptos`,
      dto,
      { params: this.obtenerParametros() }
    );
  }

  editarConcepto(
    conceptoId: number,
    dto: ConceptoGastoEditarDTO
  ): Observable<ConceptoGastoDTO> {
    return this.http.put<ConceptoGastoDTO>(
      `${this.apiUrl}/conceptos/${conceptoId}`,
      dto,
      { params: this.obtenerParametros() }
    );
  }

  eliminarConcepto(conceptoId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/conceptos/${conceptoId}`,
      { params: this.obtenerParametros() }
    );
  }

  listarClasificaciones(empresaId: number): Observable<ClasificacionContableDTO[]> {
    return this.http.get<ClasificacionContableDTO[]>(
      `${this.apiUrl}/clasificaciones/empresa/${empresaId}`,
      { params: this.obtenerParametros() }
    );
  }

  crearClasificacion(dto: ClasificacionContableCrearDTO): Observable<ClasificacionContableDTO> {
    return this.http.post<ClasificacionContableDTO>(
      `${this.apiUrl}/clasificaciones`,
      dto,
      { params: this.obtenerParametros() }
    );
  }

  editarClasificacion(
    clasificacionId: number,
    dto: ClasificacionContableEditarDTO
  ): Observable<ClasificacionContableDTO> {
    return this.http.put<ClasificacionContableDTO>(
      `${this.apiUrl}/clasificaciones/${clasificacionId}`,
      dto,
      { params: this.obtenerParametros() }
    );
  }

  eliminarClasificacion(clasificacionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/clasificaciones/${clasificacionId}`,
      { params: this.obtenerParametros() }
    );
  }
}
