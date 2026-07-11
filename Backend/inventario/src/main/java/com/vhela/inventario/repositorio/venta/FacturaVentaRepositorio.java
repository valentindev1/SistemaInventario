package com.vhela.inventario.repositorio.venta;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.vhela.inventario.dto.venta.FacturaVentaDTO;
import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.ventas.EstadoFactura;
import com.vhela.inventario.modelo.ventas.Venta;

public interface FacturaVentaRepositorio extends JpaRepository<Venta, Long> {



    Optional<Venta> findByNumeroVenta(String numeroVenta);

    List<Venta> findBySucursalOrderByFechaVentaDesc(Sucursal sucursal);

    List<Venta> findBySucursalAndEstadoOrderByFechaVentaDesc(
            Sucursal sucursal,
            EstadoFactura estado
    );

    List<Venta> findBySucursalAndFechaVentaBetweenOrderByFechaVentaDesc(
            Sucursal sucursal,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin
    );

    List<Venta> findBySucursalAndEstadoAndFechaVentaBetweenOrderByFechaVentaDesc(
            Sucursal sucursal,
            EstadoFactura estado,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin
    );


    
    List<Venta> findByEmpresa_IdAndFechaVentaBetweenOrderByFechaVentaDesc(
            Long empresaId,
            LocalDateTime inicio,
            LocalDateTime fin
    );



    boolean existsByClienteId(Long clienteId);

    boolean existsByUsuarioId(Long usuarioId);



    Long countBySucursalId(Long sucursalId);

}