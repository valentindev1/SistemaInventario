package com.vhela.inventario.repositorio.producto;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.producto.Producto;

public interface ProductoRepositorio extends JpaRepository<Producto, Long> {

    List<Producto> findByEmpresaId(Long empresaId);

    Optional<Producto> findByEmpresaIdAndCodigo(Long empresaId, String codigo);
}
