package com.vhela.inventario.repositorio.producto.detalles;


import com.vhela.inventario.modelo.producto.detalles.Genero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GeneroRepositorio extends JpaRepository<Genero, Long> {

    boolean existsByNombreAndEmpresaId(String nombre, Long empresaId);

    Optional<Genero> findByNombreAndEmpresaId(String nombre, Long empresaId);

    List<Genero> findByEmpresaId(Long empresaId);
}
