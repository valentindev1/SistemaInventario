package com.vhela.inventario.servicio.usuario;


import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.SucursalRepositorio;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioServicioImpl implements UsuarioServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final SucursalRepositorio sucursalRepositorio;

    // ✅ CREAR
    @Override
    public UsuarioObtenerDTO crear(Long usuarioId, UsuarioCrearDTO dto) {

        Usuario creador = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        RolEnum rolCreador = creador.getRol();
        RolEnum rolNuevo = convertirRol(dto.getRol());

        if (usuarioRepositorio.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Ya existe un usuario con ese username");
        }

        // 🔐 VALIDACIÓN
        switch (rolCreador) {

            case SUPER_ADMIN:
                break;

            case ADMIN:
                if (rolNuevo == RolEnum.SUPER_ADMIN) {
                    throw new RuntimeException("ADMIN no puede crear SUPER_ADMIN");
                }
                if (rolNuevo != RolEnum.ADMIN && rolNuevo != RolEnum.EMPLEADO) {
                    throw new RuntimeException("Rol no permitido");
                }
                break;

            case EMPLEADO:
                throw new RuntimeException("EMPLEADO no puede crear usuarios");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(dto.getPassword());
        usuario.setRol(rolNuevo);

        switch (rolNuevo) {

            case SUPER_ADMIN:
                usuario.setEmpresa(null);
                usuario.setSucursal(null);
                break;

            case ADMIN:
                if (rolCreador == RolEnum.ADMIN) {
                    usuario.setEmpresa(creador.getEmpresa());
                } else {
                    Empresa empresa = empresaRepositorio.findById(dto.getEmpresaId())
                            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
                    usuario.setEmpresa(empresa);
                }
                usuario.setSucursal(null);
                break;

            case EMPLEADO:

                Long empresaIdReal = (rolCreador == RolEnum.ADMIN)
                        ? creador.getEmpresa().getId()
                        : dto.getEmpresaId();

                Empresa emp = empresaRepositorio.findById(empresaIdReal)
                        .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

                Sucursal sucursal = sucursalRepositorio.findById(dto.getSucursalId())
                        .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

                if (!sucursal.getEmpresa().getId().equals(empresaIdReal)) {
                    throw new RuntimeException("Sucursal no pertenece a la empresa");
                }

                usuario.setEmpresa(emp);
                usuario.setSucursal(sucursal);
                break;
        }

        return mapToResponse(usuarioRepositorio.save(usuario));
    }

    // ✅ LISTAR
    @Override
    public List<UsuarioObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return usuarioRepositorio.findAll().stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            return usuarioRepositorio
                    .findBySucursalEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        return List.of(mapToResponse(usuario));
    }

    // ✅ OBTENER POR ID
    @Override
    public UsuarioObtenerDTO obtenerPorId(Long usuarioId, Long id) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Usuario objetivo = usuarioRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) return mapToResponse(objetivo);

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (!objetivo.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
                throw new RuntimeException("No puede ver este usuario");
            }
            return mapToResponse(objetivo);
        }

        if (!usuario.getId().equals(id)) {
            throw new RuntimeException("Solo puede verse a si mismo");
        }

        return mapToResponse(objetivo);
    }

    // ✅ EDITAR
    @Override
    public UsuarioObtenerDTO editar(Long usuarioId, Long id, UsuarioEditarDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Usuario objetivo = usuarioRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("No puede editar usuarios");
        }

        if (usuario.getRol() == RolEnum.ADMIN &&
                !objetivo.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {

            throw new RuntimeException("No puede editar usuarios de otra empresa");
        }

        if (usuario.getRol() == RolEnum.ADMIN &&
                convertirRol(dto.getRol()) == RolEnum.SUPER_ADMIN) {

            throw new RuntimeException("No puede asignar SUPER_ADMIN");
        }

        objetivo.setNombre(dto.getNombre());
        objetivo.setPassword(dto.getPassword());
        objetivo.setRol(convertirRol(dto.getRol()));

        return mapToResponse(usuarioRepositorio.save(objetivo));
    }

    // ✅ ELIMINAR
    @Override
    public void eliminar(Long usuarioId, Long id) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Usuario objetivo = usuarioRepositorio.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("No puede eliminar usuarios");
        }

        if (usuario.getRol() == RolEnum.ADMIN &&
                !objetivo.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {

            throw new RuntimeException("No puede eliminar usuarios de otra empresa");
        }

        usuarioRepositorio.delete(objetivo);
    }

    // ✅ POR EMPRESA
    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listarPorEmpresa(Long usuarioId) {

        Usuario solicitante = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Usuario> usuarios;

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                usuarios = usuarioRepositorio.findAll();
                break;

            case ADMIN:
                usuarios = usuarioRepositorio
                        .findBySucursalEmpresaId(solicitante.getEmpresa().getId());
                break;

            case EMPLEADO:
                throw new RuntimeException("No tienes permisos");

            default:
                throw new RuntimeException("Rol inválido");
        }

        return usuarios.stream().map(this::mapToResponse).toList();
    }

    // ✅ POR SUCURSAL
    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listarPorSucursal(Long usuarioId, Long sucursalId) {

        Usuario solicitante = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Sucursal sucursal = sucursalRepositorio.findById(sucursalId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        List<Usuario> usuarios;

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                usuarios = usuarioRepositorio.findBySucursalId(sucursalId);
                break;

            case ADMIN:
                if (!sucursal.getEmpresa().getId()
                        .equals(solicitante.getEmpresa().getId())) {

                    throw new RuntimeException("No puedes acceder a esta sucursal");
                }

                usuarios = usuarioRepositorio.findBySucursalId(sucursalId);
                break;

            case EMPLEADO:
                throw new RuntimeException("No tienes permisos");

            default:
                throw new RuntimeException("Rol inválido");
        }

        return usuarios.stream().map(this::mapToResponse).toList();
    }

    // ✅ TODOS
    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listarTodos(Long usuarioId) {

        Usuario solicitante = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Usuario> usuarios;

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                usuarios = usuarioRepositorio.findAll();
                break;

            case ADMIN:
                usuarios = usuarioRepositorio
                        .findBySucursalEmpresaId(solicitante.getEmpresa().getId());
                break;

            case EMPLEADO:
                throw new RuntimeException("No tienes permisos");

            default:
                throw new RuntimeException("Rol inválido");
        }

        return usuarios.stream().map(this::mapToResponse).toList();
    }

    // 🔧 UTILIDADES
    private RolEnum convertirRol(String rol) {
        return RolEnum.valueOf(rol);
    }


    private UsuarioObtenerDTO mapToResponse(Usuario usuario) {

        UsuarioObtenerDTO dto = new UsuarioObtenerDTO();

        dto.setId(usuario.getId());
        dto.setNombre(usuario.getNombre());
        dto.setUsername(usuario.getUsername());

        // ✅ CORRECCIÓN AQUÍ
        dto.setRol(usuario.getRol().name());

        if (usuario.getSucursal() != null) {
            dto.setSucursalId(usuario.getSucursal().getId());
            dto.setSucursalNombre(usuario.getSucursal().getNombre());
        }

        if (usuario.getEmpresa() != null) {
            dto.setEmpresaId(usuario.getEmpresa().getId());
            dto.setEmpresaNombre(usuario.getEmpresa().getNombre());
        }

        return dto;
    }

}
