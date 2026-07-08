package com.vhela.inventario.dto.producto.detalles.talla;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TallaEditarDTO {

    @NotBlank(message = "El nombre de la talla es obligatorio")
    @Size(max = 80, message = "El nombre de la talla no puede superar 80 caracteres")
    private String nombre;
}