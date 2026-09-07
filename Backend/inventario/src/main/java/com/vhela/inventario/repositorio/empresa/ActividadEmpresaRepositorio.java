package com.vhela.inventario.repositorio.empresa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.empresa.ActividadEmpresa;

public interface ActividadEmpresaRepositorio extends JpaRepository<ActividadEmpresa, Long> {

    List<ActividadEmpresa> findByEmpresaIdOrderByFechaDesc(Long empresaId);
}
