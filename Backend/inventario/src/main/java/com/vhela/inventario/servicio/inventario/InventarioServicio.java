package com.vhela.inventario.servicio.inventario;

import com.vhela.inventario.dto.inventario.AjusteInventarioDTO;
import com.vhela.inventario.dto.inventario.IngresoInventarioDTO;
import com.vhela.inventario.dto.inventario.MovimientoInventarioDTO;
import com.vhela.inventario.dto.inventario.ResumenInventarioSucursalDTO;

import java.util.List;

public interface InventarioServicio {


    void ingresarMercancia(Long usuarioId, IngresoInventarioDTO dto);

    void ajustarInventario(Long usuarioId, AjusteInventarioDTO dto);

    List<?> listarPorSucursal(Long usuarioId, Long sucursalId);

    ResumenInventarioSucursalDTO obtenerResumenSucursal(Long usuarioId, Long sucursalId);

    List<MovimientoInventarioDTO> listarMovimientosPorSucursal(Long usuarioId, Long sucursalId);

}
