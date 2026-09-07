package com.vhela.inventario.servicio.producto.atributocosto;

import java.util.List;

import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoCrearDTO;
import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoEditarDTO;
import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoObtenerDTO;

public interface AtributoCostoServicio {

    AtributoCostoObtenerDTO crear(Long usuarioId, AtributoCostoCrearDTO dto);

    List<AtributoCostoObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId);

    List<AtributoCostoObtenerDTO> listarActivosPorCategoria(Long usuarioId, Long categoriaId);

    AtributoCostoObtenerDTO editar(Long usuarioId, Long atributoId, AtributoCostoEditarDTO dto);

    void eliminar(Long usuarioId, Long atributoId);

    AtributoCostoObtenerDTO activar(Long usuarioId, Long atributoId);
}
