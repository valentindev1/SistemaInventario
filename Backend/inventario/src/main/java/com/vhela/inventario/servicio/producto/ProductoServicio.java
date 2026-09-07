package com.vhela.inventario.servicio.producto;

import com.vhela.inventario.dto.producto.producto.ProductoAdminObtenerDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarCostoManualDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarCostoProductoDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarPrecioVentaDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarReglaGananciaDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCrearDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEditarDTO;

import java.util.List;

public interface ProductoServicio {

    ProductoAdminObtenerDTO crear(Long usuarioId, ProductoCrearDTO dto);

    List<?> listar(Long usuarioId);

    List<?> listarPorEmpresa(Long usuarioId, Long empresaId);

    Object obtenerPorId(Long usuarioId, Long productoId);

    ProductoAdminObtenerDTO editar(Long usuarioId, Long productoId, ProductoEditarDTO dto);

    ProductoAdminObtenerDTO actualizarPrecioVenta(
            Long usuarioId,
            Long productoId,
            ActualizarPrecioVentaDTO dto
    );

    ProductoAdminObtenerDTO actualizarCostoManual(
            Long usuarioId,
            Long productoId,
            ActualizarCostoManualDTO dto
    );

    ProductoAdminObtenerDTO actualizarCosto(
            Long usuarioId,
            Long productoId,
            ActualizarCostoProductoDTO dto
    );

    ProductoAdminObtenerDTO actualizarReglaGanancia(
            Long usuarioId,
            Long productoId,
            ActualizarReglaGananciaDTO dto
    );

    void eliminar(Long usuarioId, Long productoId);
}
