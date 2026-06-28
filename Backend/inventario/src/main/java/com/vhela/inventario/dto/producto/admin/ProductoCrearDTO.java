package com.vhela.inventario.dto.producto.admin;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductoCrearDTO {

    private String nombre;
    private String codigo;
    private String descripcion;
    private Long empresaId;
    private Long colorId;
    private Long categoriaId;
    private Long tallaId;
    private Long generoId;
    private BigDecimal costoUnitario;
    private BigDecimal precioVenta;

}
