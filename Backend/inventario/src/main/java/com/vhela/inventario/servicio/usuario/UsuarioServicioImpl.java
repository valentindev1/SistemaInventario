package com.vhela.inventario.servicio.usuario;

import com.vhela.inventario.dto.usuario.UsuarioCrearDTO;
import com.vhela.inventario.dto.usuario.UsuarioEditarDTO;
import com.vhela.inventario.dto.usuario.UsuarioObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.venta.FacturaVentaRepositorio;

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
    private final FacturaVentaRepositorio facturaVentaRepositorio;

    @Override
    public UsuarioObtenerDTO crear(Long usuarioId, UsuarioCrearDTO dto) {

        Usuario creador = obtenerUsuario(usuarioId);

        RolEnum rolCreador = creador.getRol();
        RolEnum rolNuevo = convertirRol(dto.getRol());

        validarUsernameDisponible(dto.getUsername());

        validarPermisoCrearUsuario(rolCreador, rolNuevo);

        Usuario usuario = new Usuario();

        usuario.setNombre(dto.getNombre());
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(dto.getPassword());
        usuario.setRol(rolNuevo);

        asignarEmpresaYSucursal(usuario, creador, rolNuevo, dto);

        Usuario guardado = usuarioRepositorio.save(usuario);

        return mapToResponse(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return usuarioRepositorio.findAll()
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            validarUsuarioConEmpresa(usuario);

            return usuarioRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        return List.of(mapToResponse(usuario));
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioObtenerDTO obtenerPorId(Long usuarioId, Long id) {

        Usuario solicitante = obtenerUsuario(usuarioId);
        Usuario objetivo = obtenerUsuario(id);

        if (solicitante.getRol() == RolEnum.SUPER_ADMIN) {
            return mapToResponse(objetivo);
        }

        if (solicitante.getRol() == RolEnum.ADMIN) {
            validarUsuarioConEmpresa(solicitante);
            validarObjetivoPerteneceAEmpresa(
                    objetivo,
                    solicitante.getEmpresa().getId()
            );

            return mapToResponse(objetivo);
        }

        if (!solicitante.getId().equals(id)) {
            throw new RuntimeException("Solo puede verse a sí mismo");
        }

        return mapToResponse(objetivo);
    }

    @Override
    public UsuarioObtenerDTO editar(Long usuarioId, Long id, UsuarioEditarDTO dto) {

        Usuario solicitante = obtenerUsuario(usuarioId);
        Usuario objetivo = obtenerUsuario(id);

        RolEnum nuevoRol = convertirRol(dto.getRol());

        if (solicitante.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("No puede editar usuarios");
        }

        if (solicitante.getRol() == RolEnum.ADMIN) {
            validarUsuarioConEmpresa(solicitante);

            validarObjetivoPerteneceAEmpresa(
                    objetivo,
                    solicitante.getEmpresa().getId()
            );

            if (nuevoRol == RolEnum.SUPER_ADMIN) {
                throw new RuntimeException("ADMIN no puede asignar SUPER_ADMIN");
            }
        }

        if (usuarioTieneVentas(objetivo.getId())) {
            throw new RuntimeException(
                    "No se puede editar este usuario porque tiene ventas o facturas vinculadas"
            );
        }

        objetivo.setNombre(dto.getNombre());
        objetivo.setPassword(dto.getPassword());
        objetivo.setRol(nuevoRol);

        Usuario actualizado = usuarioRepositorio.save(objetivo);

        return mapToResponse(actualizado);
    }

    @Override
    public void eliminar(Long usuarioId, Long id) {

        Usuario solicitante = obtenerUsuario(usuarioId);
        Usuario objetivo = obtenerUsuario(id);

        if (solicitante.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede eliminar usuarios");
        }

        if (usuarioTieneVentas(objetivo.getId())) {
            throw new RuntimeException(
                    "No se puede eliminar este usuario porque tiene ventas o facturas vinculadas"
            );
        }

        if (solicitante.getRol() == RolEnum.ADMIN &&
                objetivo.getRol() == RolEnum.ADMIN) {

            throw new RuntimeException("ADMIN no puede eliminar usuarios ADMIN");
        }

        if (solicitante.getRol() == RolEnum.ADMIN &&
                objetivo.getRol() == RolEnum.SUPER_ADMIN) {

            throw new RuntimeException("ADMIN no puede eliminar SUPER_ADMIN");
        }

        if (solicitante.getRol() == RolEnum.ADMIN) {
            validarUsuarioConEmpresa(solicitante);

            validarObjetivoPerteneceAEmpresa(
                    objetivo,
                    solicitante.getEmpresa().getId()
            );
        }

        usuarioRepositorio.delete(objetivo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listarPorEmpresa(Long usuarioId) {

        Usuario solicitante = obtenerUsuario(usuarioId);

        List<Usuario> usuarios;

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                usuarios = usuarioRepositorio.findAll();
                break;

            case ADMIN:
                validarUsuarioConEmpresa(solicitante);

                usuarios = usuarioRepositorio.findByEmpresaId(
                        solicitante.getEmpresa().getId()
                );
                break;

            case EMPLEADO:
                throw new RuntimeException("No tienes permisos");

            default:
                throw new RuntimeException("Rol inválido");
        }

        return usuarios.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listarPorEmpresaSeleccionada(
            Long usuarioId,
            Long empresaId
    ) {

        Usuario solicitante = obtenerUsuario(usuarioId);

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                return usuarioRepositorio.findByEmpresaId(empresa.getId())
                        .stream()
                        .map(this::mapToResponse)
                        .toList();

            case ADMIN:
                validarUsuarioConEmpresa(solicitante);

                if (!solicitante.getEmpresa().getId().equals(empresaId)) {
                    throw new RuntimeException("No puedes ver usuarios de otra empresa");
                }

                return usuarioRepositorio.findByEmpresaId(empresa.getId())
                        .stream()
                        .map(this::mapToResponse)
                        .toList();

            case EMPLEADO:
                throw new RuntimeException("No tienes permisos para listar usuarios de empresa");

            default:
                throw new RuntimeException("Rol inválido");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean empresaTieneUsuarios(Long usuarioId, Long empresaId) {

        Usuario solicitante = obtenerUsuario(usuarioId);

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                return !usuarioRepositorio.findByEmpresaId(empresa.getId()).isEmpty();

            case ADMIN:
                validarUsuarioConEmpresa(solicitante);

                if (!solicitante.getEmpresa().getId().equals(empresaId)) {
                    throw new RuntimeException("No puedes consultar usuarios de otra empresa");
                }

                return !usuarioRepositorio.findByEmpresaId(empresa.getId()).isEmpty();

            case EMPLEADO:
                throw new RuntimeException("No tienes permisos para consultar usuarios de empresa");

            default:
                throw new RuntimeException("Rol inválido");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listarPorSucursal(
            Long usuarioId,
            Long sucursalId
    ) {

        Usuario solicitante = obtenerUsuario(usuarioId);

        Sucursal sucursal = sucursalRepositorio.findById(sucursalId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        List<Usuario> usuarios;

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                usuarios = usuarioRepositorio.findBySucursalId(sucursalId);
                break;

            case ADMIN:
                validarUsuarioConEmpresa(solicitante);

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

        return usuarios.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioObtenerDTO> listarTodos(Long usuarioId) {

        Usuario solicitante = obtenerUsuario(usuarioId);

        List<Usuario> usuarios;

        switch (solicitante.getRol()) {

            case SUPER_ADMIN:
                usuarios = usuarioRepositorio.findAll();
                break;

            case ADMIN:
                validarUsuarioConEmpresa(solicitante);

                usuarios = usuarioRepositorio.findByEmpresaId(
                        solicitante.getEmpresa().getId()
                );
                break;

            case EMPLEADO:
                throw new RuntimeException("No tienes permisos");

            default:
                throw new RuntimeException("Rol inválido");
        }

        return usuarios.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private boolean usuarioTieneVentas(Long usuarioId) {
        return facturaVentaRepositorio.existsByUsuarioId(usuarioId);
    }

    private void validarUsernameDisponible(String username) {
        if (usuarioRepositorio.findByUsername(username).isPresent()) {
            throw new RuntimeException("Ya existe un usuario con ese username");
        }
    }

    private RolEnum convertirRol(String rol) {
        return RolEnum.valueOf(rol);
    }

    private void validarPermisoCrearUsuario(
            RolEnum rolCreador,
            RolEnum rolNuevo
    ) {

        switch (rolCreador) {

            case SUPER_ADMIN:
                return;

            case ADMIN:
                if (rolNuevo == RolEnum.SUPER_ADMIN) {
                    throw new RuntimeException("ADMIN no puede crear SUPER_ADMIN");
                }

                if (rolNuevo != RolEnum.ADMIN &&
                        rolNuevo != RolEnum.EMPLEADO) {
                    throw new RuntimeException("Rol no permitido");
                }

                return;

            case EMPLEADO:
                throw new RuntimeException("EMPLEADO no puede crear usuarios");

            default:
                throw new RuntimeException("Rol inválido");
        }
    }

    private void asignarEmpresaYSucursal(
            Usuario usuario,
            Usuario creador,
            RolEnum rolNuevo,
            UsuarioCrearDTO dto
    ) {

        switch (rolNuevo) {

            case SUPER_ADMIN:
                usuario.setEmpresa(null);
                usuario.setSucursal(null);
                break;

            case ADMIN:
                asignarEmpresaAAdmin(usuario, creador, dto);
                usuario.setSucursal(null);
                break;

            case EMPLEADO:
                asignarEmpresaYSucursalAEmpleado(usuario, creador, dto);
                break;

            default:
                throw new RuntimeException("Rol no válido");
        }
    }

    private void asignarEmpresaAAdmin(
            Usuario usuario,
            Usuario creador,
            UsuarioCrearDTO dto
    ) {

        if (creador.getRol() == RolEnum.ADMIN) {
            validarUsuarioConEmpresa(creador);
            usuario.setEmpresa(creador.getEmpresa());
            return;
        }

        if (dto.getEmpresaId() == null) {
            throw new RuntimeException("La empresa es obligatoria para crear un ADMIN");
        }

        Empresa empresa = empresaRepositorio.findById(dto.getEmpresaId())
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        usuario.setEmpresa(empresa);
    }

    private void asignarEmpresaYSucursalAEmpleado(
            Usuario usuario,
            Usuario creador,
            UsuarioCrearDTO dto
    ) {

        Long empresaIdReal;

        if (creador.getRol() == RolEnum.ADMIN) {
            validarUsuarioConEmpresa(creador);
            empresaIdReal = creador.getEmpresa().getId();
        } else {
            if (dto.getEmpresaId() == null) {
                throw new RuntimeException("La empresa es obligatoria para crear un EMPLEADO");
            }

            empresaIdReal = dto.getEmpresaId();
        }

        if (dto.getSucursalId() == null) {
            throw new RuntimeException("La sucursal es obligatoria para crear un EMPLEADO");
        }

        Empresa empresa = empresaRepositorio.findById(empresaIdReal)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Sucursal sucursal = sucursalRepositorio.findById(dto.getSucursalId())
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));

        if (!sucursal.getEmpresa().getId().equals(empresaIdReal)) {
            throw new RuntimeException("Sucursal no pertenece a la empresa");
        }

        usuario.setEmpresa(empresa);
        usuario.setSucursal(sucursal);
    }

    private void validarUsuarioConEmpresa(Usuario usuario) {

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }
    }

    private void validarObjetivoPerteneceAEmpresa(
            Usuario objetivo,
            Long empresaId
    ) {

        if (objetivo.getEmpresa() == null) {
            throw new RuntimeException("El usuario objetivo no pertenece a ninguna empresa");
        }

        if (!objetivo.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("No puede acceder a usuarios de otra empresa");
        }
    }

    private UsuarioObtenerDTO mapToResponse(Usuario usuario) {

        UsuarioObtenerDTO dto = new UsuarioObtenerDTO();

        dto.setId(usuario.getId());
        dto.setNombre(usuario.getNombre());
        dto.setUsername(usuario.getUsername());
        dto.setRol(usuario.getRol().name());

        if (usuario.getEmpresa() != null) {
            dto.setEmpresaId(usuario.getEmpresa().getId());
            dto.setEmpresaNombre(usuario.getEmpresa().getNombre());
        }

        if (usuario.getSucursal() != null) {
            dto.setSucursalId(usuario.getSucursal().getId());
            dto.setSucursalNombre(usuario.getSucursal().getNombre());
        }

        boolean bloqueado = usuarioTieneVentas(usuario.getId());

        dto.setPuedeModificar(!bloqueado);

        dto.setMotivoBloqueo(
                bloqueado
                        ? "Usuario bloqueado porque tiene ventas o facturas vinculadas"
                        : null
        );

        return dto;
    }
}