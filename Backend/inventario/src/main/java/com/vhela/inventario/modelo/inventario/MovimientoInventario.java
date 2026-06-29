package com.vhela.inventario.modelo.inventario;


import com.vhela.inventario.modelo.inventario.enums.TipoMovimiento;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_inventario")
@Getter
@Setter

public class MovimientoInventario {



    // atributos basicos
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMovimiento tipo; // ENTRADA o SALIDA


    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
    private Integer stockAntes;

    @Column(nullable = false)
    private Integer stockDespues;

    @Column(nullable = false)
    private String motivo; // "VENTA", "COMPRA", "AJUSTE", etc.

    private Long referenciaId;
    // ID de la venta, compra, etc (para trazabilidad cruzada)



    // atributos basicos
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    // relaciones de la entidad
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;








    // fecha

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();
    }

}
