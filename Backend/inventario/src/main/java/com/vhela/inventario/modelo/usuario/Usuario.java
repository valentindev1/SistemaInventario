package com.example.vhelasoft.modelo.usuario;

import com.example.vhelasoft.modelo.sucursal.Sucursal;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;


@Entity
@Getter
@Setter

public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RolEnum rol;


    /**
     * Cada usuario pertenece a UNA sucursal
     */


    @ManyToOne(optional = false)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;


    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }

}
