package com.vhela.inventario.modelo.ventas;

import java.math.BigDecimal;

import com.vhela.inventario.modelo.producto.Producto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "detalle_ventas")
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Venta a la que pertenece el detalle.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id", nullable = false)
    private Venta venta;

    /**
     * Producto vendido.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    /**
     * Cantidad vendida.
     */
    @Column(nullable = false)
    private Integer cantidad;




    @Column(nullable = false)
    private Integer cantidadDevuelta = 0;




    /**
     * Costo unitario del producto al momento de la venta.
     * Queda congelado para la trazabilidad histórica.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitarioMomento;

    /**
     * Indica si el producto era remanufacturado al momento de la venta.
     * Se conserva en el detalle para que los informes históricos no cambien
     * cuando posteriormente se edite el producto.
     */
    @Column(name = "remanufacturado_momento")
    private Boolean remanufacturadoMomento;

    /**
     * Precio unitario de venta al momento de la venta.
     * Queda congelado para la trazabilidad histórica.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitarioMomento;

    /**
     * Cantidad * precioUnitarioMomento.
     */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;
}
