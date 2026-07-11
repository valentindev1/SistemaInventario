package com.vhela.inventario.dto.venta.empleado.venta;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class InformeVentasEmpleadoDTO {

    private String fechaInicio;

    private String fechaFin;

    private Long sucursalId;

    private String sucursalNombre;

    private Integer cantidadVentas;

    private Integer cantidadProductosVendidos;

    private BigDecimal totalVentas;
}