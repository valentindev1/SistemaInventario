package com.vhela.inventario.dto.informes;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class InformeFinancieroTipoProductoDTO {

    private String tipo;
    private Integer unidadesVendidas;
    private BigDecimal ingresosNetos;
    private BigDecimal costoVendido;
    private BigDecimal utilidadBruta;
}
