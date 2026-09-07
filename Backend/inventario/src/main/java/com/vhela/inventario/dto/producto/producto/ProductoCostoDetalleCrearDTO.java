package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductoCostoDetalleCrearDTO {

    @NotBlank(message = "El concepto del desglose es obligatorio")
    @Size(max = 120, message = "El concepto del desglose no puede superar 120 caracteres")
    private String concepto;

    private Long atributoCostoId;

    @NotNull(message = "El valor del desglose es obligatorio")
    @DecimalMin(value = "0.01", message = "El valor del desglose debe ser mayor que cero")
    @Digits(integer = 10, fraction = 2, message = "El valor del desglose debe tener máximo 2 decimales")
    private BigDecimal valor;
}
