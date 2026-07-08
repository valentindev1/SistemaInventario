package com.vhela.inventario.dto.producto.detalles.color;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ColorCrearDTO {

    @NotBlank(message = "El nombre del color es obligatorio")
    @Size(max = 80, message = "El nombre del color no puede superar 80 caracteres")
    private String nombre;

    /*
     * Solo lo usará SUPER_ADMIN.
     * Si el usuario creador es ADMIN, este campo se ignora
     * y se usa automáticamente la empresa del ADMIN.
     */
    @NotNull(message = "El ID de la empresa es obligatorio")
    private Long empresaId;
}
