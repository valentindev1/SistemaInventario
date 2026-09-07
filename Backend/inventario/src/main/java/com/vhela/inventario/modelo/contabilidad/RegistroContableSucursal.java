package com.vhela.inventario.modelo.contabilidad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.Usuario;

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
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "registros_contables_sucursal")
public class RegistroContableSucursal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoRegistroContable tipo;

    @Column(nullable = false, length = 160)
    private String concepto;

    /**
     * Clasificación contable conservada en el movimiento para mantener su histórico
     * aunque el concepto del catálogo sea editado posteriormente.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ClasificacionGasto clasificacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clasificacion_contable_id")
    private ClasificacionContable clasificacionContable;

    /** Nombre congelado para que renombrar una clasificación no altere el histórico. */
    @Column(length = 120)
    private String clasificacionNombre;

    /**
     * Catálogo utilizado para registrar nuevos gastos.
     * Puede ser null en movimientos históricos creados antes del catálogo.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concepto_gasto_id")
    private ConceptoGasto conceptoGasto;

    @Column(length = 400)
    private String descripcion;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}
