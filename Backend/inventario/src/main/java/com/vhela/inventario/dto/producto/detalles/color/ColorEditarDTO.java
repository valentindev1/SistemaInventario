package com.vhela.inventario.dto.producto.detalles.color;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ColorEditarDTO {

    @NotBlank(message = "El nombre del color es obligatorio")
    @Size(max = 80, message = "El nombre del color no puede superar 80 caracteres")
    private String nombre;
}
