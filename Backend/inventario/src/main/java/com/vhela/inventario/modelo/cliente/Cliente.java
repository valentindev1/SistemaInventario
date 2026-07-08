package com.vhela.inventario.modelo.cliente;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.vhela.inventario.modelo.empresa.Empresa;

import com.vhela.inventario.modelo.ventas.Venta;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
        name = "clientes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_cliente_empresa_documento",
                        columnNames = {"empresa_id", "numero_documento"}
                )
        }
)
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_documento", nullable = false, length = 30)
    private String numeroDocumento;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 150)
    private String correo;

    @Column(length = 30)
    private String telefono;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;


    @OneToMany(
            mappedBy = "cliente",
            cascade = CascadeType.ALL
    )
    private List<Venta> ventas = new ArrayList<>();


    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();
    }
}