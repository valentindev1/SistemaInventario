package com.vhela.inventario.modelo.contabilidad;

import java.time.LocalDateTime;

import com.vhela.inventario.modelo.empresa.Empresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
        name = "conceptos_gasto",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_concepto_gasto_empresa_nombre",
                columnNames = {"empresa_id", "nombre"}
        )
)
public class ConceptoGasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    /** Tipo de movimiento al que pertenece el concepto. Nullable para conceptos históricos. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoRegistroContable tipo;

    @Column(length = 300)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClasificacionGasto clasificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clasificacion_contable_id")
    private ClasificacionContable clasificacionContable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        if (this.activo == null) {
            this.activo = true;
        }
    }
}
