package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductoCostoDetalleDTO {

    private Long id;
    private Long atributoCostoId;
    private String concepto;
    private BigDecimal valor;
    private Integer orden;
}
