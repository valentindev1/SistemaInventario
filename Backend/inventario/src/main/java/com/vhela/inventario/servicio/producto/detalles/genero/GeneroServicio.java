package com.vhela.inventario.servicio.producto.detalles.genero;

import com.vhela.inventario.dto.producto.detalles.genero.GeneroCrearDTO;
import com.vhela.inventario.dto.producto.detalles.genero.GeneroEditarDTO;
import com.vhela.inventario.dto.producto.detalles.genero.GeneroObtenerDTO;

import java.util.List;

public interface GeneroServicio {

    GeneroObtenerDTO crear(Long usuarioId, GeneroCrearDTO dto);

    List<GeneroObtenerDTO> listar(Long usuarioId);

    List<GeneroObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId);

    GeneroObtenerDTO obtenerPorId(Long usuarioId, Long generoId);

    GeneroObtenerDTO editar(Long usuarioId, Long generoId, GeneroEditarDTO dto);

    void eliminar(Long usuarioId, Long generoId);
}