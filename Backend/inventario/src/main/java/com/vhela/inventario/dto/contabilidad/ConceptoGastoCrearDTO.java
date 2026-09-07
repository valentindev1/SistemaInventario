package com.vhela.inventario.dto.contabilidad;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConceptoGastoCrearDTO {

    @NotBlank(message = "El nombre del concepto es obligatorio")
    @Size(max = 120, message = "El nombre del concepto no puede superar 120 caracteres")
    private String nombre;

    private String tipo;

    private Long clasificacionId;

    @Size(max = 300, message = "La descripción no puede superar 300 caracteres")
    private String descripcion;

    @NotBlank(message = "La clasificación del gasto es obligatoria")
    private String clasificacion;

    @NotNull(message = "El ID de la empresa es obligatorio")
    private Long empresaId;
}
