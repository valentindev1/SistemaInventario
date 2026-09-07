package com.vhela.inventario.repositorio.contabilidad;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.contabilidad.ClasificacionContable;
import com.vhela.inventario.modelo.contabilidad.TipoRegistroContable;

public interface ClasificacionContableRepositorio extends JpaRepository<ClasificacionContable, Long> {

    List<ClasificacionContable> findByEmpresaIdOrderByTipoAscNombreAsc(Long empresaId);

    Optional<ClasificacionContable> findByEmpresaIdAndTipoAndNombreIgnoreCase(
            Long empresaId,
            TipoRegistroContable tipo,
            String nombre
    );

    boolean existsByEmpresaIdAndTipoAndNombreIgnoreCase(
            Long empresaId,
            TipoRegistroContable tipo,
            String nombre
    );

    boolean existsByEmpresaIdAndTipoAndNombreIgnoreCaseAndIdNot(
            Long empresaId,
            TipoRegistroContable tipo,
            String nombre,
            Long id
    );
}
