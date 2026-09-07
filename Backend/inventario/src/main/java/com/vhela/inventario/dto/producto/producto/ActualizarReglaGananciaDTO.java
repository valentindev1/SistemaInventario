package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import lombok.Data;

@Data
public class ActualizarReglaGananciaDTO {

    private String tipoGanancia;

    @DecimalMin(value = "0.00", message = "El valor de ganancia no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El valor de ganancia debe tener máximo 2 decimales")
    private BigDecimal valorGanancia;
}
