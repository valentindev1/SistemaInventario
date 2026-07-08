package com.vhela.inventario.dto.venta;


import java.math.BigDecimal;

import lombok.Data;

@Data
public class DetalleFacturaVentaDTO {

    private Long productoId;

    private String productoCodigo;

    private String productoNombre;

    private Integer cantidad;

    private BigDecimal costoUnitarioMomento;

    private BigDecimal precioUnitarioMomento;

    private BigDecimal subtotal;


    private Integer cantidadDevuelta;
    private Integer cantidadDisponibleDevolucion;

}
