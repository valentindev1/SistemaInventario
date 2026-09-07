package com.vhela.inventario.repositorio.contabilidad;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.contabilidad.ConceptoGasto;

public interface ConceptoGastoRepositorio extends JpaRepository<ConceptoGasto, Long> {

    boolean existsByEmpresaIdAndNombreIgnoreCase(Long empresaId, String nombre);

    boolean existsByEmpresaIdAndNombreIgnoreCaseAndIdNot(
            Long empresaId,
            String nombre,
            Long id
    );

    List<ConceptoGasto> findByEmpresaIdOrderByNombreAsc(Long empresaId);

    List<ConceptoGasto> findByEmpresaIdAndActivoTrueOrderByNombreAsc(Long empresaId);
}
