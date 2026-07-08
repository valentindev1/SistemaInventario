package com.vhela.inventario.repositorio.producto.detalles;



import com.vhela.inventario.modelo.producto.detalles.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepositorio extends JpaRepository<Categoria, Long> {

    boolean existsByNombreAndEmpresaId(String nombre, Long empresaId);

    Optional<Categoria> findByNombreAndEmpresaId(String nombre, Long empresaId);

    List<Categoria> findByEmpresaId(Long empresaId);
}
