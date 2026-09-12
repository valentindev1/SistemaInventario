package com.vhela.inventario.dto.informes;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class InformeFinancieroClasificacionDTO {

    private String tipo;
    private String clasificacion;
    private BigDecimal valor;
    private BigDecimal porcentajeEgresos;
}
