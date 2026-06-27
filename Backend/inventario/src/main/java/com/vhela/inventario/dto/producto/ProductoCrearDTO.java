package com.vhela.inventario.dto.producto;

import lombok.Data;

@Data
public class ProductoCrearDTO {


    private String nombre;
    private String codigo;
    private Double precioVenta;
    private String talla;
    private Long fabricaId;

}
