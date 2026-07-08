package com.vhela.inventario.dto.empresa;



import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardProductoCriticoDTO {

    private Long productoId;

    private String codigo;
    private String nombre;

    private Long sucursalId;
    private String sucursalNombre;

    private Integer stockActual;

    private BigDecimal costoUnitario;
    private BigDecimal precioVenta;

    private BigDecimal valorCostoTotal;
    private BigDecimal valorComercialTotal;

    private String tipoAlerta;
}