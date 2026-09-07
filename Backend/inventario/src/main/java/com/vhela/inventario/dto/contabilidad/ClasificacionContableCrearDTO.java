package com.vhela.inventario.dto.contabilidad;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClasificacionContableCrearDTO {

    @NotBlank(message = "El nombre de la clasificación es obligatorio")
    @Size(max = 120, message = "El nombre de la clasificación no puede superar 120 caracteres")
    private String nombre;

    @NotBlank(message = "El tipo de clasificación es obligatorio")
    private String tipo;

    @NotNull(message = "El ID de la empresa es obligatorio")
    private Long empresaId;
}
