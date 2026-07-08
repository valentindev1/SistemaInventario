package com.vhela.inventario.dto.inventario;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class InventarioAdminDTO {

    private Long inventarioId;

    private Long sucursalId;
    private String sucursalNombre;

    private Long productoId;
    private String codigo;
    private String nombre;
    private String descripcion;

    private String categoria;
    private String color;
    private String talla;
    private String genero;

    private Integer stockActual;

    private BigDecimal costoUnitario;
    private BigDecimal precioVenta;

    private BigDecimal valorCostoTotal;
    private BigDecimal valorVentaTotal;
    private BigDecimal utilidadProyectada;
}