package com.vhela.inventario.modelo.producto.detalles;

import com.vhela.inventario.modelo.empresa.Empresa;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(
        name = "categorias",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_categoria_empresa_nombre",
                columnNames = {"empresa_id", "nombre"}
        )
)
public class Categoria {

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

    @Column(name = "porcentaje_ganancia", precision = 7, scale = 2)
    private BigDecimal porcentajeGanancia;

    @Column(name = "tipo_ganancia", length = 20)
    private String tipoGanancia;

    @Column(name = "valor_ganancia", precision = 12, scale = 2)
    private BigDecimal valorGanancia;

    private Boolean activo = true;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}
