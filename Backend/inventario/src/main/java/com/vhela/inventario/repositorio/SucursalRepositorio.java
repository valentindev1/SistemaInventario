package com.vhela.inventario.repositorio;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.sucursal.Sucursal;


public interface SucursalRepositorio extends JpaRepository<Sucursal, Long> {


    List<Sucursal> findByEmpresaId(Long empresaId);

    Optional<Sucursal> findByIdAndEmpresaId(Long id, Long empresaId);


    Optional<Sucursal> findByNombre(String nombre);


    // validar duplicados
    boolean existsByNombreAndEmpresaId(String nombre, Long empresaId);


}
