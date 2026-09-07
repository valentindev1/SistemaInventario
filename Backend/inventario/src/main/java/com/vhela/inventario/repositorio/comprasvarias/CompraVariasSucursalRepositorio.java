package com.vhela.inventario.repositorio.comprasvarias;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.comprasvarias.CompraVariasSucursal;

public interface CompraVariasSucursalRepositorio
        extends JpaRepository<CompraVariasSucursal, Long> {

    List<CompraVariasSucursal> findBySucursalIdOrderByFechaDescFechaCreacionDesc(Long sucursalId);
}
