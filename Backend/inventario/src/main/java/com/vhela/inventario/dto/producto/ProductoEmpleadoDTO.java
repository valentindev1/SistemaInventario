package com.example.vhelasoft.dto.producto;

import lombok.Data;

@Data
public class ProductoEmpleadoDTO {


    private Long id;
    private String sku;
    private String nombre;
    private String categoria;
    private String talla;
    private String color;
    private String genero;

    private Long precioVenta;
    private Integer stockDisponible;


}
