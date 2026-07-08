package com.vhela.inventario.servicio.producto.detalles.color;


import com.vhela.inventario.dto.producto.detalles.color.ColorCrearDTO;
import com.vhela.inventario.dto.producto.detalles.color.ColorEditarDTO;
import com.vhela.inventario.dto.producto.detalles.color.ColorObtenerDTO;

import java.util.List;

public interface ColorServicio {

    ColorObtenerDTO crear(Long usuarioId, ColorCrearDTO dto);

    List<ColorObtenerDTO> listar(Long usuarioId);

    List<ColorObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId);

    ColorObtenerDTO obtenerPorId(Long usuarioId, Long colorId);

    ColorObtenerDTO editar(Long usuarioId, Long colorId, ColorEditarDTO dto);

    void eliminar(Long usuarioId, Long colorId);
}
