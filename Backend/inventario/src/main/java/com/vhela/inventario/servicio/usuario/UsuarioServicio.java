package com.vhela.inventario.servicio.usuario;



import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioResponseDTO;

import java.util.List;


public interface UsuarioServicio {


    UsuarioResponseDTO crear(UsuarioCrearDTO dto);

    List<UsuarioResponseDTO> listar();


    UsuarioResponseDTO obtenerPorId(Long usuarioId);

    UsuarioResponseDTO editar(Long usuarioId, UsuarioEditarDTO dto);


    void eliminar(Long usuarioId);


}
