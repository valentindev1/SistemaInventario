package com.vhela.inventario.dto.venta;


import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class ReporteVentasDiaDTO {

    private LocalDate fecha;

    private Integer cantidadVentas;

    private Integer cantidadProductosVendidos;

    private BigDecimal subtotal;

    private BigDecimal total;

    private BigDecimal costoTotal;

    private BigDecimal utilidad;
}
