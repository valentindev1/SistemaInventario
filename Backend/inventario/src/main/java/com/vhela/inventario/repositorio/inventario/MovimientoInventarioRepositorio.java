package com.vhela.inventario.repositorio.inventario;

import java.time.LocalDateTime;
import java.util.List;

import com.vhela.inventario.modelo.inventario.enums.TipoMovimiento;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.inventario.MovimientoInventario;

public interface MovimientoInventarioRepositorio extends JpaRepository<MovimientoInventario, Long> {

    List<MovimientoInventario> findBySucursalIdOrderByFechaDesc(Long sucursalId);

    List<MovimientoInventario> findBySucursal_Empresa_IdOrderByFechaDesc(Long empresaId);

    List<MovimientoInventario> findByProductoIdOrderByFechaDesc(Long productoId);



    List<MovimientoInventario> findBySucursalAndTipoAndFechaBetweenOrderByFechaDesc(
            Sucursal sucursal,
            TipoMovimiento tipo,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    List<MovimientoInventario> findBySucursal_Empresa_IdAndTipoAndFechaBetweenOrderByFechaDesc(
            Long empresaId,
            TipoMovimiento tipo,
            LocalDateTime inicio,
            LocalDateTime fin
    );

    boolean existsByProductoId(Long productoId);
}
