package com.vhela.inventario.modelo.producto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.detalles.Categoria;
import com.vhela.inventario.modelo.producto.detalles.Color;
import com.vhela.inventario.modelo.producto.detalles.Genero;
import com.vhela.inventario.modelo.producto.detalles.Talla;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(
        name = "productos",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_producto_empresa_codigo",
                columnNames = {"empresa_id", "codigo"}
        )
)
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, length = 80)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id", nullable = false)
    private Color color;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "talla_id", nullable = false)
    private Talla talla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "genero_id", nullable = false)
    private Genero genero;

    @Column(name = "tipo_costo", length = 20)
    private String tipoCosto;

    @Column(name = "es_remanufacturado", nullable = false)
    private Boolean esRemanufacturado = false;

    @Column(name = "costo_personalizado")
    private Boolean costoPersonalizado = false;

    @OneToMany(
            mappedBy = "producto",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @OrderBy("orden ASC, id ASC")
    private List<ProductoCostoDetalle> desgloseCosto = new ArrayList<>();

    @DecimalMin(value = "0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitario;

    @DecimalMin(value = "0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVenta;

    @Column(name = "tipo_ganancia", length = 20)
    private String tipoGanancia;

    @Column(name = "valor_ganancia", precision = 12, scale = 2)
    private BigDecimal valorGanancia;



    @Column(nullable = false)
    private Boolean activo = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false)
    private LocalDateTime fechaActualizacion;

    @PrePersist
    protected void onCreate() {
        LocalDateTime ahora = LocalDateTime.now();
        this.fechaCreacion = ahora;
        this.fechaActualizacion = ahora;

        if (this.activo == null) {
            this.activo = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();

        if (this.activo == null) {
            this.activo = true;
        }
    }
}
