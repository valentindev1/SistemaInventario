package com.vhela.inventario.dto.producto;

import lombok.Data;

import java.time.LocalDateTime;


@Data
public class ProductoResponseDTO {


    private Long id;
    private String nombre;
    private String codigo;
    private Double precioVenta;
    private String talla;
    private Long fabricaId;
    private String nombreFabrica;

    private LocalDateTime fechaCreacion;

}
