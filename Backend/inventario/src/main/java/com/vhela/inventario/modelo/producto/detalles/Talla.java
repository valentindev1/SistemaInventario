package com.vhela.inventario.modelo.producto.detalles;

import com.vhela.inventario.modelo.empresa.Empresa;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(
        name = "tallas",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_talla_empresa_nombre",
                columnNames = {"empresa_id", "nombre"}
        )
)
public class Talla {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    private Boolean activo = true;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }


}
