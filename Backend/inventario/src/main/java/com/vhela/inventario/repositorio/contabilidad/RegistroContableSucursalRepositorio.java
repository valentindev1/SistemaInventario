package com.vhela.inventario.repositorio.contabilidad;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.contabilidad.RegistroContableSucursal;
import com.vhela.inventario.modelo.contabilidad.TipoRegistroContable;

public interface RegistroContableSucursalRepositorio
        extends JpaRepository<RegistroContableSucursal, Long> {

    List<RegistroContableSucursal> findBySucursalIdOrderByFechaDescFechaCreacionDesc(Long sucursalId);

    List<RegistroContableSucursal> findBySucursalIdAndUsuarioIdAndTipoOrderByFechaDescFechaCreacionDesc(
            Long sucursalId,
            Long usuarioId,
            TipoRegistroContable tipo
    );

    List<RegistroContableSucursal> findBySucursal_Empresa_IdAndFechaBetweenOrderByFechaAsc(
            Long empresaId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    );

    List<RegistroContableSucursal> findBySucursalIdAndFechaBetweenOrderByFechaAsc(
            Long sucursalId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    );
}
