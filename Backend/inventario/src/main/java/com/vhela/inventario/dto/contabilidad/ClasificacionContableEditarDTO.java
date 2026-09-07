package com.vhela.inventario.dto.contabilidad;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClasificacionContableEditarDTO {

    @NotBlank(message = "El nombre de la clasificación es obligatorio")
    @Size(max = 120, message = "El nombre de la clasificación no puede superar 120 caracteres")
    private String nombre;
}
