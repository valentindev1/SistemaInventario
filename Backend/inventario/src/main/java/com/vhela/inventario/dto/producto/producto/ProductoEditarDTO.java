package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductoEditarDTO {

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    private String nombre;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 150, message = "La descripción no puede superar 150 caracteres")
    private String descripcion;

    @NotNull(message = "El ID del color es obligatorio")
    private Long colorId;

    @NotNull(message = "El ID de la categoría es obligatorio")
    private Long categoriaId;

    @NotNull(message = "El ID de la talla es obligatorio")
    private Long tallaId;

    @NotNull(message = "El ID del género es obligatorio")
    private Long generoId;


}