package com.vhela.inventario.dto.inventario;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ResumenInventarioSucursalDTO {

    private Long sucursalId;
    private String sucursalNombre;

    private Integer cantidadReferencias;
    private Integer cantidadUnidades;

    private BigDecimal valorCostoTotal;
    private BigDecimal valorVentaTotal;
    private BigDecimal utilidadProyectada;
}