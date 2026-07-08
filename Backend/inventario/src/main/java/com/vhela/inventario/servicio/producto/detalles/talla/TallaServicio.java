package com.vhela.inventario.servicio.producto.detalles.talla;


import com.vhela.inventario.dto.producto.detalles.talla.TallaCrearDTO;
import com.vhela.inventario.dto.producto.detalles.talla.TallaEditarDTO;
import com.vhela.inventario.dto.producto.detalles.talla.TallaObtenerDTO;

import java.util.List;

public interface TallaServicio {

    TallaObtenerDTO crear(Long usuarioId, TallaCrearDTO dto);

    List<TallaObtenerDTO> listar(Long usuarioId);

    List<TallaObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId);

    TallaObtenerDTO obtenerPorId(Long usuarioId, Long tallaId);

    TallaObtenerDTO editar(Long usuarioId, Long tallaId, TallaEditarDTO dto);

    void eliminar(Long usuarioId, Long tallaId);
}