package com.vhela.inventario.modelo.empresa;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.Usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "empresas")
public class Empresa {


    //informacion basica

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150, unique = true)
    private String nombre;

    @Column(unique = true, length = 50)
    private String nit;

    @Column(unique = true, length = 120)
    private String correo;

    @Column(unique = true, length = 30)
    private String telefono;

    @Column(unique = true, length = 200)
    private String direccion;


    //relaciones

    @OneToMany(mappedBy = "empresa")
    private List<Sucursal> sucursales = new ArrayList<>();

    @OneToMany(mappedBy = "empresa")
    private List<Usuario> usuarios = new ArrayList<>();



    //fecha

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();
    }


}
