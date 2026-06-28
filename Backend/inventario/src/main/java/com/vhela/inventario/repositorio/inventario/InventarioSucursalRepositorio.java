package com.vhela.inventario.repositorio.inventario;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.inventario.InventarioSucursal;

public interface InventarioSucursalRepositorio extends JpaRepository<InventarioSucursal, Long> {

    List<InventarioSucursal> findBySucursalId(Long sucursalId);

    List<InventarioSucursal> findByProductoId(Long productoId);

    Optional<InventarioSucursal> findBySucursalIdAndProductoId(Long sucursalId, Long productoId);
}
