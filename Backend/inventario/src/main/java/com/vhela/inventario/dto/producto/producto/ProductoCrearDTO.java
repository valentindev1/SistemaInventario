package com.vhela.inventario.dto.producto.producto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;

@Data
public class ProductoCrearDTO {

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
    private String nombre;

    @NotBlank(message = "El código del producto es obligatorio")
    @Size(max = 80, message = "El código no puede superar 80 caracteres")
    private String codigo;

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 150, message = "La descripción no puede superar 150 caracteres")
    private String descripcion;

    @NotNull(message = "El ID de la empresa es obligatorio")
    private Long empresaId;

    @NotNull(message = "El ID del color es obligatorio")
    private Long colorId;

    @NotNull(message = "El ID de la categoría es obligatorio")
    private Long categoriaId;

    @NotNull(message = "El ID de la talla es obligatorio")
    private Long tallaId;

    @NotNull(message = "El ID del género es obligatorio")
    private Long generoId;

    /**
     * MANUAL conserva el flujo actual. DESGLOSE calcula el costo sumando sus componentes.
     */
    private String tipoCosto;

    private Boolean esRemanufacturado;

    private Boolean costoPersonalizado;

    @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El costo unitario debe tener máximo 2 decimales")
    private BigDecimal costoUnitario;

    private List<@Valid ProductoCostoDetalleCrearDTO> desgloseCosto;

}
