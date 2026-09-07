package com.vhela.inventario.repositorio.producto;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.AtributoCosto;

public interface AtributoCostoRepositorio extends JpaRepository<AtributoCosto, Long> {

    List<AtributoCosto> findByEmpresaIdOrderByCategoriaNombreAscNombreAsc(Long empresaId);

    List<AtributoCosto> findByCategoriaIdAndActivoTrueOrderByNombreAsc(Long categoriaId);

    Optional<AtributoCosto> findByCategoriaIdAndNombreIgnoreCase(Long categoriaId, String nombre);
}
