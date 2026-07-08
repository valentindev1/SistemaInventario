package com.vhela.inventario.servicio.venta;

import java.time.LocalDate;
import java.util.List;

import com.vhela.inventario.dto.venta.*;

public interface VentaServicio {

    FacturaVentaDTO crearVenta(Long usuarioId, CrearVentaDTO dto);

    FacturaVentaDTO obtenerPorId(Long usuarioId, Long ventaId);

    FacturaVentaDTO obtenerPorNumero(Long usuarioId, String numeroVenta);

    List<FacturaVentaDTO> listarPorSucursal(Long usuarioId, Long sucursalId);

    FacturaVentaDTO cancelarVenta(Long usuarioId, Long ventaId, String motivo);

    InformeVentasDTO generarInformeVentas(
            Long usuarioId,
            Long sucursalId,
            String periodo,
            LocalDate fecha
    );


    FacturaVentaDTO generarDevolucion(
            Long usuarioId,
            Long ventaId,
            DevolucionVentaDTO dto
    );


    List<VentaHistorialDTO> historialVentas(
            Long usuarioId,
            Long sucursalId
    );

    InformeConsolidadoVentasDTO generarInformeConsolidado(
            Long usuarioId,
            Long sucursalId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    );

}