package com.vhela.inventario.dto.cliente;
//Para autocompletado en caja


import lombok.Data;

@Data
public class ClienteVentaDTO {

    private Long id;

    private String numeroDocumento;

    private String nombre;
}
