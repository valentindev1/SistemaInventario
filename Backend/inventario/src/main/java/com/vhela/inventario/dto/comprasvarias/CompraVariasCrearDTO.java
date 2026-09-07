package com.vhela.inventario.dto.comprasvarias;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CompraVariasCrearDTO {

    @NotBlank(message = "El concepto es obligatorio")
    @Size(max = 160, message = "El concepto no puede superar 160 caracteres")
    private String concepto;

    @Size(max = 400, message = "La descripción no puede superar 400 caracteres")
    private String descripcion;

    @NotNull(message = "El valor es obligatorio")
    @Digits(integer = 12, fraction = 2, message = "El valor debe tener máximo 12 enteros y 2 decimales")
    private BigDecimal valor;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;
}
