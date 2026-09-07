package com.vhela.inventario.dto.producto.detalles.categoria;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

@Data
public class CategoriaCrearDTO {

    @NotBlank(message = "El nombre de la categoría es obligatorio")
    @Size(max = 80, message = "El nombre de la categoría no puede superar 80 caracteres")
    private String nombre;

    @NotNull(message = "El ID de la empresa es obligatorio")
    private Long empresaId;

    @DecimalMin(value = "0.00", message = "El porcentaje no puede ser negativo")
    @DecimalMax(value = "1000.00", message = "El porcentaje no puede superar 1000%")
    @Digits(integer = 4, fraction = 2, message = "El porcentaje debe tener máximo 2 decimales")
    private BigDecimal porcentajeGanancia;

    private String tipoGanancia;

    @DecimalMin(value = "0.00", message = "El valor de ganancia no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El valor de ganancia debe tener máximo 2 decimales")
    private BigDecimal valorGanancia;
}
