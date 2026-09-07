package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ActualizarCostoManualDTO {

    @NotNull(message = "El costo unitario es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El costo unitario no tiene un formato válido")
    private BigDecimal costoUnitario;
}
