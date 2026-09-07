package com.vhela.inventario.dto.producto.atributocosto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AtributoCostoEditarDTO {

    @NotBlank(message = "El nombre del atributo de costo es obligatorio")
    @Size(max = 120, message = "El nombre del atributo de costo no puede superar 120 caracteres")
    private String nombre;

    @Size(max = 200, message = "La descripción no puede superar 200 caracteres")
    private String descripcion;

    @NotNull(message = "El ID de la categoría es obligatorio")
    private Long categoriaId;
}
