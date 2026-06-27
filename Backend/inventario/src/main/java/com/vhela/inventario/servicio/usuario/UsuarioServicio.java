package com.example.vhelasoft.servicio.fabrica.usuario;

import com.example.vhelasoft.dto.usuario.UsuarioCrearDTO;
import com.example.vhelasoft.dto.usuario.UsuarioEditarDTO;
import com.example.vhelasoft.dto.usuario.UsuarioResponseDTO;

import java.util.List;

public interface UsuarioServicio {


    UsuarioResponseDTO crear(UsuarioCrearDTO dto);

    List<UsuarioResponseDTO> listarPorFabrica(Long fabricaId);

    List<UsuarioResponseDTO> listarPorSucursal(Long sucursalId);

    UsuarioResponseDTO obtenerPorId(Long usuarioId, Long fabricaId);

    UsuarioResponseDTO editar(Long usuarioId, Long fabricaId, UsuarioEditarDTO dto);

    void eliminar(Long usuarioId, Long fabricaId);

}
