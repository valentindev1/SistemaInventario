package com.vhela.inventario.dto.venta;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class InformeVentasDTO {

    private String periodo;

    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    private Long sucursalId;

    private String sucursalNombre;

    private Integer cantidadVentas;

    private Integer cantidadProductosVendidos;

    private BigDecimal subtotal;

    private BigDecimal total;

    private BigDecimal costoTotal;

    private BigDecimal utilidad;

    private List<ReporteVentasDiaDTO> ventasPorDia;
}