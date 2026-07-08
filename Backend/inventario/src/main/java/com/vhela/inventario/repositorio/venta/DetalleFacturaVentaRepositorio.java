package com.vhela.inventario.repositorio.venta;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.ventas.DetalleVenta;
import com.vhela.inventario.modelo.ventas.Venta;

public interface DetalleFacturaVentaRepositorio extends JpaRepository<DetalleVenta, Long> {

    List<DetalleVenta> findByVenta(Venta venta);

    boolean existsByProductoId(Long productoId);
}