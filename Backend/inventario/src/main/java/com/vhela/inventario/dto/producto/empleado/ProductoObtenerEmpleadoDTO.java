package com.vhela.inventario.dto.producto.empleado;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductoObtenerEmpleadoDTO {

    // atributos base
    private Long id;
    private String nombre;
    private String codigo;
    private String descripcion;

    // atributos de detalle
    private String categoria;
    private String talla;
    private String color;
    private String genero;

    // atributos de venta
    private BigDecimal precioVenta;
    private Integer stockDisponible;

}
