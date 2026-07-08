package com.vhela.inventario.repositorio.producto;


import com.vhela.inventario.modelo.producto.Producto;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoRepositorio extends JpaRepository<Producto, Long> {

    boolean existsByCodigoAndEmpresaId(String codigo, Long empresaId);

    Optional<Producto> findByCodigoAndEmpresaId(String codigo, Long empresaId);

    List<Producto> findByEmpresaId(Long empresaId);

    List<Producto> findByEmpresaIdAndColorId(Long empresaId, Long colorId);

    List<Producto> findByEmpresaIdAndCategoriaId(Long empresaId, Long categoriaId);

    List<Producto> findByEmpresaIdAndTallaId(Long empresaId, Long tallaId);

    List<Producto> findByEmpresaIdAndGeneroId(Long empresaId, Long generoId);
}