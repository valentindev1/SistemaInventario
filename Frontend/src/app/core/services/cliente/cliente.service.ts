import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../auth/auth.service';

import {
  ClienteCrearDTO,
  ClienteEditarDTO,
  ClienteObtenerDTO
} from '../../models/cliente/cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apiUrl = `${environment.apiUrl}/clientes`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  crear(dto: ClienteCrearDTO): Observable<ClienteObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.post<ClienteObtenerDTO>(
      this.apiUrl,
      dto,
      { params }
    );
  }

  listar(): Observable<ClienteObtenerDTO[]> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<ClienteObtenerDTO[]>(
      this.apiUrl,
      { params }
    );
  }

  obtenerPorId(clienteId: number): Observable<ClienteObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<ClienteObtenerDTO>(
      `${this.apiUrl}/${clienteId}`,
      { params }
    );
  }

  obtenerPorDocumento(numeroDocumento: string): Observable<ClienteObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.get<ClienteObtenerDTO>(
      `${this.apiUrl}/documento/${numeroDocumento}`,
      { params }
    );
  }

  editar(
    clienteId: number,
    dto: ClienteEditarDTO
  ): Observable<ClienteObtenerDTO> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.put<ClienteObtenerDTO>(
      `${this.apiUrl}/${clienteId}`,
      dto,
      { params }
    );
  }

  eliminar(clienteId: number): Observable<void> {
    const params = this.obtenerUsuarioIdComoParam();

    return this.http.delete<void>(
      `${this.apiUrl}/${clienteId}`,
      { params }
    );
  }

  private obtenerUsuarioIdComoParam(): HttpParams {
    const usuarioId = this.authService.obtenerUsuarioId();

    if (!usuarioId) {
      throw new Error('No se pudo identificar el usuario autenticado.');
    }

    return new HttpParams().set(
      'usuarioId',
      usuarioId.toString()
    );
  }
}
