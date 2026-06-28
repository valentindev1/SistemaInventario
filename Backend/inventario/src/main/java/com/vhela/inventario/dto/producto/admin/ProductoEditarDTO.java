package com.vhela.inventario.dto.producto.admin;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductoEditarDTO {


    private String nombre;

    private BigDecimal costoUnitario;

    private BigDecimal precioVenta;


}
