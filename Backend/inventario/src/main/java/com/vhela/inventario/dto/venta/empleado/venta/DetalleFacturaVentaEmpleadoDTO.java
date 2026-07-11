package com.vhela.inventario.dto.venta.empleado.venta;


import java.math.BigDecimal;

import lombok.Data;

@Data
public class DetalleFacturaVentaEmpleadoDTO {

    private Long productoId;

    private String productoCodigo;

    private String productoNombre;

    private Integer cantidad;

    private Integer cantidadDevuelta;

    private Integer cantidadDisponibleDevolucion;

    private BigDecimal precioUnitarioMomento;

    private BigDecimal subtotal;
}