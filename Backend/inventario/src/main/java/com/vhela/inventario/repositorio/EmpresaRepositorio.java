package com.vhela.inventario.repositorio;

import com.vhela.inventario.modelo.empresa.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmpresaRepositorio extends JpaRepository<Empresa, Long> {

    Optional<Empresa> findByNit(String nit);

    Optional<Empresa> findByNombre(String nombre);

    boolean existsByNit(String nit);

    void deleteByNit(String nit);
}