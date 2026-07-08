package com.vhela.inventario.dto.venta;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ResumenVentasDiaDTO {

    private LocalDate fecha;

    private Integer facturas;
    private Integer productosVendidos;

    private BigDecimal ventasBrutas;
    private BigDecimal descuentos;
    private BigDecimal ventasNetas;

    private BigDecimal costoVendido;
    private BigDecimal utilidad;
}