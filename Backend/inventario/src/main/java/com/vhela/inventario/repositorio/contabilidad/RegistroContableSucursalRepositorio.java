package com.vhela.inventario.repositorio.contabilidad;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.contabilidad.RegistroContableSucursal;

public interface RegistroContableSucursalRepositorio
        extends JpaRepository<RegistroContableSucursal, Long> {

    List<RegistroContableSucursal> findBySucursalIdOrderByFechaDescFechaCreacionDesc(Long sucursalId);
}
