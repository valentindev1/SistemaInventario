package com.vhela.inventario.dto.contabilidad;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistroGastoEmpleadoDTO {

    @NotBlank(message = "La descripción del gasto es obligatoria")
    @Size(max = 400, message = "La descripción no puede superar 400 caracteres")
    private String descripcion;

    @NotNull(message = "El valor es obligatorio")
    @DecimalMin(value = "0.01", message = "El valor debe ser mayor que cero")
    private BigDecimal valor;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fecha;
}
