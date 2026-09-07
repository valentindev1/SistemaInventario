package com.vhela.inventario.servicio.inventario;

import com.vhela.inventario.dto.inventario.*;
import com.vhela.inventario.dto.inventario.empleado.MovimientoInventarioEmpleadoDTO;

import java.util.List;

public interface InventarioServicio {


    void ingresarMercancia(Long usuarioId, IngresoInventarioDTO dto);

    void ajustarInventario(Long usuarioId, AjusteInventarioDTO dto);

    List<?> listarPorSucursal(Long usuarioId, Long sucursalId);

    ResumenInventarioSucursalDTO obtenerResumenSucursal(Long usuarioId, Long sucursalId);

    List<MovimientoInventarioDTO> listarMovimientosPorSucursal(Long usuarioId, Long sucursalId);

    List<MovimientoInventarioDTO> listarMovimientosPorEmpresa(Long usuarioId, Long empresaId);

    MovimientoInventarioDTO revertirMovimiento(
            Long usuarioId,
            Long empresaId,
            Long movimientoId
    );


    List<MovimientoInventarioEmpleadoDTO> listarMovimientosPorSucursalEmpleado(
            Long usuarioId,
            Long sucursalId
    );

    List<InventarioEmpleadoDTO> listarInventarioPorSucursalEmpleado(
            Long usuarioId,
            Long sucursalId
    );

}
