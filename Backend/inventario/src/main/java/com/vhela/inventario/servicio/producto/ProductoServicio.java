package com.vhela.inventario.servicio.producto;

import com.vhela.inventario.dto.producto.producto.ProductoAdminObtenerDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCrearDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEditarDTO;

import java.util.List;

public interface ProductoServicio {

    ProductoAdminObtenerDTO crear(Long usuarioId, ProductoCrearDTO dto);

    List<?> listar(Long usuarioId);

    List<?> listarPorEmpresa(Long usuarioId, Long empresaId);

    Object obtenerPorId(Long usuarioId, Long productoId);

    ProductoAdminObtenerDTO editar(Long usuarioId, Long productoId, ProductoEditarDTO dto);

    void eliminar(Long usuarioId, Long productoId);
}