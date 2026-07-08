package com.vhela.inventario.dto.producto.detalles.categoria;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoriaCrearDTO {

    @NotBlank(message = "El nombre de la categoría es obligatorio")
    @Size(max = 80, message = "El nombre de la categoría no puede superar 80 caracteres")
    private String nombre;

    @NotNull(message = "El ID de la empresa es obligatorio")
    private Long empresaId;
}
