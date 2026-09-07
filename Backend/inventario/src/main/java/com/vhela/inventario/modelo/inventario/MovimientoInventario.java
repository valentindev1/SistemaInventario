package com.vhela.inventario.modelo.inventario;


import com.vhela.inventario.modelo.inventario.enums.TipoMovimiento;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.Usuario;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Getter
@Setter
@Table(name = "movimientos_inventario")
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoMovimiento tipo;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
    private Integer stockAntes;

    @Column(nullable = false)
    private Integer stockDespues;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitarioMomento;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVentaMomento;

    @Column(length = 300)
    private String motivo;

    private Long referenciaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    /** Indica que este movimiento ya fue compensado desde la bitácora empresarial. */
    @Column(nullable = true)
    private Boolean revertido = false;

    /** Identificador del movimiento compensatorio generado al revertirlo. */
    private Long movimientoReversionId;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();
    }
}

