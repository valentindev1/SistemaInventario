package com.vhela.inventario.modelo.producto.detalles;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Genero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String nombre;
}