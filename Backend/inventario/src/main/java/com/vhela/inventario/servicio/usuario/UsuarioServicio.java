package com.vhela.inventario.servicio.usuario;


import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioObtenerDTO;

import java.util.List;

public interface UsuarioServicio {

    UsuarioObtenerDTO crear(Long usuarioId, UsuarioCrearDTO dto);

    List<UsuarioObtenerDTO> listar(Long usuarioId);

    UsuarioObtenerDTO obtenerPorId(Long usuarioId, Long id);

    UsuarioObtenerDTO editar(Long usuarioId, Long id, UsuarioEditarDTO dto);

    void eliminar(Long usuarioId, Long id);

    // ✅ NUEVOS
    List<UsuarioObtenerDTO> listarPorSucursal(Long usuarioId, Long sucursalId);

    List<UsuarioObtenerDTO> listarPorEmpresa(Long usuarioId);

    List<UsuarioObtenerDTO> listarTodos(Long usuarioId);


    List<UsuarioObtenerDTO> listarPorEmpresaSeleccionada(Long usuarioId, Long empresaId);

    boolean empresaTieneUsuarios(Long usuarioId, Long empresaId);

}
