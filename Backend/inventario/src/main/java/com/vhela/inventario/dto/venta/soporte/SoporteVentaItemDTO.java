package com.vhela.inventario.dto.venta.soporte;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class SoporteVentaItemDTO {

    private String codigoProducto;
    private String nombreProducto;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
}