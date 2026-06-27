package com.vhela.inventario.modelo.producto;

import com.vhela.inventario.modelo.producto.detalles.Categoria;
import com.vhela.inventario.modelo.producto.detalles.Color;
import com.vhela.inventario.modelo.producto.detalles.Genero;
import com.vhela.inventario.modelo.producto.detalles.Talla;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;



@Entity
@Data
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;



    // Información básica
    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String codigo; // SKU o código interno




    // Relaciones
    @ManyToOne
    @JoinColumn(name = "color_id",nullable = false)
    private Color color;

    @ManyToOne
    @JoinColumn(name = "categoria_id",nullable = false)
    private Categoria categoria;

    @ManyToOne
    @JoinColumn(name = "talla_id",nullable = false)
    private Talla talla;

    @ManyToOne
    @JoinColumn(name = "genero_id",nullable = false)
    private Genero genero;




    // Costos y precios
    @Column(nullable = false)
    private BigDecimal costoUnitario;

    @Column(nullable = false)
    private BigDecimal precioVenta;




    // Inventario
    @Column(nullable = false)
    private Integer stockActual;




    // Auditoría
    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}
