package com.vhela.inventario.servicio.producto.detalles.categoria;

import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaCrearDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaEditarDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaObtenerDTO;

import java.util.List;

public interface CategoriaServicio {

    CategoriaObtenerDTO crear(Long usuarioId, CategoriaCrearDTO dto);

    List<CategoriaObtenerDTO> listar(Long usuarioId);

    List<CategoriaObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId);

    CategoriaObtenerDTO obtenerPorId(Long usuarioId, Long categoriaId);

    CategoriaObtenerDTO editar(Long usuarioId, Long categoriaId, CategoriaEditarDTO dto);

    void eliminar(Long usuarioId, Long categoriaId);
}