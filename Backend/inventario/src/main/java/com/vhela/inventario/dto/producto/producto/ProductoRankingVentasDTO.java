package com.vhela.inventario.dto.producto.producto;


import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoRankingVentasDTO {

    private Long productoId;

    private String codigo;

    private String nombre;
    private Boolean esRemanufacturado;

    private Integer stockActual;

    private Integer cantidadVendida;

    private Integer cantidadDevuelta;

    private BigDecimal valorVendido;

    private BigDecimal utilidadEstimada;
}
