package com.vhela.inventario.servicio.empresa;

import com.vhela.inventario.dto.empresa.EmpresaCrearDTO;
import com.vhela.inventario.dto.empresa.EmpresaEditarDTO;
import com.vhela.inventario.dto.empresa.EmpresaObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EmpresaServicioImpl implements EmpresaServicio {

    private final EmpresaRepositorio empresaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    // ✅ CREAR
    @Override
    public EmpresaObtenerDTO crear(Long usuarioId, EmpresaCrearDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo el SUPER_ADMIN puede crear empresas");
        }

        Empresa empresa = new Empresa();
        empresa.setNombre(dto.getNombre());
        empresa.setCorreo(dto.getCorreo());
        empresa.setNit(dto.getNit());
        empresa.setDireccion(dto.getDireccion());
        empresa.setTelefono(dto.getTelefono());

        return mapToDTO(empresaRepositorio.save(empresa));
    }

    // ✅ LISTAR
    @Override
    @Transactional(readOnly = true)
    public List<EmpresaObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return empresaRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            return List.of(mapToDTO(usuario.getEmpresa()));
        }

        throw new RuntimeException("No tiene permisos para ver empresas");
    }

    // ✅ OBTENER POR ID
    @Override
    @Transactional(readOnly = true)
    public EmpresaObtenerDTO obtenerPorId(Long usuarioId, Long idEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Empresa empresa = empresaRepositorio.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return mapToDTO(empresa);
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (!usuario.getEmpresa().getId().equals(idEmpresa)) {
                throw new RuntimeException("No puede ver esta empresa");
            }
            return mapToDTO(empresa);
        }

        throw new RuntimeException("No tiene permisos");
    }

    // ✅ OBTENER POR NIT
    @Override
    @Transactional(readOnly = true)
    public EmpresaObtenerDTO obtenerPorNit(Long usuarioId, String nitEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Empresa empresa = empresaRepositorio.findByNit(nitEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return mapToDTO(empresa);
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (!usuario.getEmpresa().getNit().equals(nitEmpresa)) {
                throw new RuntimeException("No puede ver esta empresa");
            }
            return mapToDTO(empresa);
        }

        throw new RuntimeException("No tiene permisos");
    }

    // ✅ EDITAR
    @Override
    public EmpresaObtenerDTO editar(Long usuarioId, Long idEmpresa, EmpresaEditarDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo SUPER_ADMIN puede editar empresas");
        }

        Empresa empresa = empresaRepositorio.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (!empresa.getNit().equals(dto.getNit()) &&
                empresaRepositorio.findByNit(dto.getNit()).isPresent()) {
            throw new RuntimeException("Ya existe otra empresa con ese NIT");
        }

        empresa.setNombre(dto.getNombre());
        empresa.setNit(dto.getNit());
        empresa.setCorreo(dto.getCorreo());
        empresa.setTelefono(dto.getTelefono());
        empresa.setDireccion(dto.getDireccion());

        return mapToDTO(empresaRepositorio.save(empresa));
    }

    // ✅ ELIMINAR POR ID
    @Override
    public void eliminarPorId(Long usuarioId, Long idEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo SUPER_ADMIN puede eliminar empresas");
        }

        Empresa empresa = empresaRepositorio.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        empresaRepositorio.delete(empresa);
    }

    // ✅ ELIMINAR POR NIT
    @Override
    public void eliminarPorNit(Long usuarioId, String nitEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo SUPER_ADMIN puede eliminar empresas");
        }

        Empresa empresa = empresaRepositorio.findByNit(nitEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        empresaRepositorio.delete(empresa);
    }

    // ✅ MAPPER
    private EmpresaObtenerDTO mapToDTO(Empresa empresa) {

        EmpresaObtenerDTO dto = new EmpresaObtenerDTO();

        dto.setId(empresa.getId());
        dto.setNombre(empresa.getNombre());
        dto.setNit(empresa.getNit());
        dto.setCorreo(empresa.getCorreo());
        dto.setDireccion(empresa.getDireccion());
        dto.setTelefono(empresa.getTelefono());
        dto.setFechaCreacion(empresa.getFechaCreacion());

        return dto;
    }
}
