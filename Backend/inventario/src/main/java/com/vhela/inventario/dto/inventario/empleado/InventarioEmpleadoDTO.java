package com.vhela.inventario.dto.inventario.empleado;

import java.math.BigDecimal;

import lombok.Data;


@Data
public class InventarioEmpleadoDTO {

    private Long id;

    private Long productoId;
    private String codigo;
    private String nombre;
    private String descripcion;

    private String categoria;
    private String color;
    private String talla;
    private String genero;

    private Long sucursalId;
    private String sucursalNombre;

    private Integer stockActual;

    private BigDecimal precioVenta;
}