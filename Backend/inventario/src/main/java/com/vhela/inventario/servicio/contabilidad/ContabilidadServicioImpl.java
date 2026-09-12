package com.vhela.inventario.servicio.contabilidad;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vhela.inventario.dto.contabilidad.ConceptoGastoCrearDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoEditarDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableCrearDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableEditarDTO;
import com.vhela.inventario.dto.contabilidad.RegistroContableCrearDTO;
import com.vhela.inventario.dto.contabilidad.RegistroContableDTO;
import com.vhela.inventario.dto.contabilidad.RegistroGastoEmpleadoDTO;
import com.vhela.inventario.modelo.contabilidad.ClasificacionGasto;
import com.vhela.inventario.modelo.contabilidad.ClasificacionContable;
import com.vhela.inventario.modelo.contabilidad.ConceptoGasto;
import com.vhela.inventario.modelo.contabilidad.RegistroContableSucursal;
import com.vhela.inventario.modelo.contabilidad.TipoRegistroContable;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.contabilidad.ConceptoGastoRepositorio;
import com.vhela.inventario.repositorio.contabilidad.ClasificacionContableRepositorio;
import com.vhela.inventario.repositorio.contabilidad.RegistroContableSucursalRepositorio;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ContabilidadServicioImpl implements ContabilidadServicio {

    private static final String CONCEPTO_REGISTRO_EMPLEADO = "Registro del empleado";

    private final RegistroContableSucursalRepositorio registroRepositorio;
    private final ConceptoGastoRepositorio conceptoGastoRepositorio;
    private final ClasificacionContableRepositorio clasificacionContableRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final SucursalRepositorio sucursalRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    @Override
    public RegistroContableDTO registrar(
            Long usuarioId,
            Long sucursalId,
            RegistroContableCrearDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarPermisoYAcceso(usuario, sucursal);

        return registrarInterno(usuario, sucursal, dto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistroContableDTO> listarGastosEmpleado(
            Long usuarioId,
            Long sucursalId
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);
        validarAccesoEmpleado(usuario, sucursal);

        return registroRepositorio
                .findBySucursalIdAndUsuarioIdAndTipoOrderByFechaDescFechaCreacionDesc(
                        sucursalId,
                        usuarioId,
                        TipoRegistroContable.GASTO
                )
                .stream()
                .map(this::mapear)
                .toList();
    }

    @Override
    public RegistroContableDTO registrarGastoEmpleado(
            Long usuarioId,
            Long sucursalId,
            RegistroGastoEmpleadoDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);
        validarAccesoEmpleado(usuario, sucursal);

        RegistroContableSucursal registro = new RegistroContableSucursal();
        registro.setTipo(TipoRegistroContable.GASTO);
        registro.setConcepto(CONCEPTO_REGISTRO_EMPLEADO);
        registro.setDescripcion(normalizarRequerido(
                dto.getDescripcion(),
                "La descripción del gasto es obligatoria"
        ));
        registro.setValor(dto.getValor());
        registro.setFecha(dto.getFecha());
        registro.setSucursal(sucursal);
        registro.setUsuario(usuario);

        return mapear(registroRepositorio.save(registro));
    }

    @Override
    public RegistroContableDTO editarGastoEmpleado(
            Long usuarioId,
            Long sucursalId,
            Long registroId,
            RegistroGastoEmpleadoDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);
        validarAccesoEmpleado(usuario, sucursal);

        RegistroContableSucursal registro = registroRepositorio.findById(registroId)
                .orElseThrow(() -> new RuntimeException("El registro de gasto no existe"));

        if (registro.getSucursal() == null
                || !registro.getSucursal().getId().equals(sucursalId)) {
            throw new RuntimeException("El registro no pertenece a esta sucursal");
        }

        if (registro.getUsuario() == null
                || !registro.getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Solo puedes editar tus propios registros");
        }

        if (registro.getTipo() != TipoRegistroContable.GASTO) {
            throw new RuntimeException("Solo puedes editar registros de gasto");
        }

        registro.setConcepto(CONCEPTO_REGISTRO_EMPLEADO);
        registro.setConceptoGasto(null);
        registro.setClasificacion(null);
        registro.setClasificacionContable(null);
        registro.setClasificacionNombre(null);
        registro.setDescripcion(normalizarRequerido(
                dto.getDescripcion(),
                "La descripción del gasto es obligatoria"
        ));
        registro.setValor(dto.getValor());
        registro.setFecha(dto.getFecha());

        return mapear(registroRepositorio.save(registro));
    }

    @Override
    public void eliminarGastoEmpleado(
            Long usuarioId,
            Long sucursalId,
            Long registroId
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);
        validarAccesoEmpleado(usuario, sucursal);

        RegistroContableSucursal registro = registroRepositorio.findById(registroId)
                .orElseThrow(() -> new RuntimeException("El registro de gasto no existe"));

        if (registro.getSucursal() == null
                || !registro.getSucursal().getId().equals(sucursalId)) {
            throw new RuntimeException("El registro no pertenece a esta sucursal");
        }

        if (registro.getUsuario() == null
                || !registro.getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("Solo puedes eliminar tus propios registros");
        }

        if (registro.getTipo() != TipoRegistroContable.GASTO) {
            throw new RuntimeException("Solo puedes eliminar registros de gasto");
        }

        registroRepositorio.delete(registro);
    }

    private RegistroContableDTO registrarInterno(
            Usuario usuario,
            Sucursal sucursal,
            RegistroContableCrearDTO dto
    ) {

        TipoRegistroContable tipo;
        try {
            tipo = TipoRegistroContable.valueOf(dto.getTipo().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("El tipo de registro debe ser COSTO o GASTO");
        }

        ConceptoGasto conceptoGasto = null;
        String concepto = dto.getConcepto().trim();
        ClasificacionGasto clasificacion = parsearClasificacionOpcional(dto.getClasificacion());
        ClasificacionContable clasificacionContable = null;
        TipoRegistroContable tipoConcepto = null;

        if (dto.getConceptoGastoId() != null) {
            conceptoGasto = conceptoGastoRepositorio.findById(dto.getConceptoGastoId())
                    .orElseThrow(() -> new RuntimeException("Concepto de gasto no encontrado"));

            if (!Boolean.TRUE.equals(conceptoGasto.getActivo())) {
                throw new RuntimeException("El concepto de gasto está inactivo");
            }

            validarConceptoEnSucursal(conceptoGasto, sucursal);
            // Se conserva una copia del nombre para no alterar el histórico si luego se edita.
            concepto = conceptoGasto.getNombre();
            clasificacion = conceptoGasto.getClasificacion();
            clasificacionContable = conceptoGasto.getClasificacionContable();
            tipoConcepto = conceptoGasto.getTipo();

            if (tipoConcepto != null && tipoConcepto != tipo) {
                throw new RuntimeException("El concepto seleccionado no corresponde al tipo de movimiento");
            }
        }

        if (tipo == TipoRegistroContable.COSTO && clasificacion == null) {
            throw new RuntimeException("Selecciona la clasificación del costo");
        }

        if (tipo == TipoRegistroContable.COSTO
                && !esCostoIndirecto(clasificacion, clasificacionContable)) {
            throw new RuntimeException("En este módulo los costos deben ser costos indirectos de producción");
        }

        RegistroContableSucursal registro = new RegistroContableSucursal();
        registro.setTipo(tipo);
        registro.setConcepto(concepto);
        registro.setClasificacion(clasificacion);
        registro.setClasificacionContable(clasificacionContable);
        registro.setClasificacionNombre(clasificacionContable == null
                ? null
                : clasificacionContable.getNombre());
        registro.setConceptoGasto(conceptoGasto);
        registro.setDescripcion(normalizarOpcional(dto.getDescripcion()));
        registro.setValor(dto.getValor());
        registro.setFecha(dto.getFecha());
        registro.setSucursal(sucursal);
        registro.setUsuario(usuario);

        return mapear(registroRepositorio.save(registro));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistroContableDTO> listarPorSucursal(Long usuarioId, Long sucursalId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarPermisoYAcceso(usuario, sucursal);

        return registroRepositorio.findBySucursalIdOrderByFechaDescFechaCreacionDesc(sucursalId)
                .stream()
                .map(this::mapear)
                .toList();
    }

    @Override
    public ConceptoGastoDTO crearConcepto(Long usuarioId, ConceptoGastoCrearDTO dto) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);

        Empresa empresa = obtenerEmpresa(dto.getEmpresaId());
        validarAccesoAEmpresa(usuario, empresa.getId());

        String nombre = normalizarRequerido(dto.getNombre(), "El nombre del concepto es obligatorio");
        if (conceptoGastoRepositorio.existsByEmpresaIdAndNombreIgnoreCase(empresa.getId(), nombre)) {
            throw new RuntimeException("Ya existe un concepto con ese nombre en la empresa");
        }

        ConceptoGasto concepto = new ConceptoGasto();
        TipoRegistroContable tipoConcepto = parsearTipoConcepto(dto.getTipo());
        ClasificacionContable clasificacionContable = resolverClasificacionContable(
                usuario,
                empresa,
                dto.getClasificacionId(),
                tipoConcepto
        );
        ClasificacionGasto clasificacion = clasificacionContable == null
                ? parsearClasificacion(dto.getClasificacion())
                : ClasificacionGasto.OTRO;
        validarTipoYClasificacionConcepto(tipoConcepto, clasificacion, clasificacionContable);
        concepto.setNombre(nombre);
        concepto.setTipo(tipoConcepto);
        concepto.setDescripcion(normalizarOpcional(dto.getDescripcion()));
        concepto.setClasificacion(clasificacion);
        concepto.setClasificacionContable(clasificacionContable);
        concepto.setEmpresa(empresa);
        concepto.setActivo(true);

        return mapearConcepto(conceptoGastoRepositorio.save(concepto));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConceptoGastoDTO> listarConceptosPorEmpresa(Long usuarioId, Long empresaId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);
        validarAccesoAEmpresa(usuario, empresaId);

        return conceptoGastoRepositorio.findByEmpresaIdOrderByNombreAsc(empresaId)
                .stream()
                .map(this::mapearConcepto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConceptoGastoDTO> listarConceptosActivosPorEmpresa(Long usuarioId, Long empresaId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);
        validarAccesoAEmpresa(usuario, empresaId);

        return conceptoGastoRepositorio.findByEmpresaIdAndActivoTrueOrderByNombreAsc(empresaId)
                .stream()
                .map(this::mapearConcepto)
                .toList();
    }

    @Override
    public ConceptoGastoDTO editarConcepto(
            Long usuarioId,
            Long conceptoId,
            ConceptoGastoEditarDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);

        ConceptoGasto concepto = obtenerConcepto(conceptoId);
        validarAccesoAEmpresa(usuario, concepto.getEmpresa().getId());

        String nombre = normalizarRequerido(dto.getNombre(), "El nombre del concepto es obligatorio");
        if (!concepto.getNombre().equalsIgnoreCase(nombre)
                && conceptoGastoRepositorio.existsByEmpresaIdAndNombreIgnoreCaseAndIdNot(
                        concepto.getEmpresa().getId(), nombre, conceptoId)) {
            throw new RuntimeException("Ya existe otro concepto con ese nombre en la empresa");
        }

        concepto.setNombre(nombre);
        TipoRegistroContable tipoConcepto = dto.getTipo() != null && !dto.getTipo().isBlank()
                ? parsearTipoConcepto(dto.getTipo())
                : (concepto.getTipo() == null ? TipoRegistroContable.GASTO : concepto.getTipo());
        ClasificacionContable clasificacionContable = resolverClasificacionContable(
                usuario,
                concepto.getEmpresa(),
                dto.getClasificacionId(),
                tipoConcepto
        );
        ClasificacionGasto clasificacion = clasificacionContable == null
                ? parsearClasificacion(dto.getClasificacion())
                : ClasificacionGasto.OTRO;
        if (dto.getTipo() != null && !dto.getTipo().isBlank()) {
            concepto.setTipo(tipoConcepto);
        } else if (concepto.getTipo() == null) {
            concepto.setTipo(clasificacion == ClasificacionGasto.PRODUCCION_INDIRECTA
                    ? TipoRegistroContable.COSTO
                    : TipoRegistroContable.GASTO);
        }
        validarTipoYClasificacionConcepto(concepto.getTipo(), clasificacion, clasificacionContable);
        concepto.setDescripcion(normalizarOpcional(dto.getDescripcion()));
        concepto.setClasificacion(clasificacion);
        concepto.setClasificacionContable(clasificacionContable);

        return mapearConcepto(conceptoGastoRepositorio.save(concepto));
    }

    @Override
    public void eliminarConcepto(Long usuarioId, Long conceptoId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);

        ConceptoGasto concepto = obtenerConcepto(conceptoId);
        validarAccesoAEmpresa(usuario, concepto.getEmpresa().getId());

        // Se inactiva para conservar la trazabilidad de los gastos existentes.
        concepto.setActivo(false);
        conceptoGastoRepositorio.save(concepto);
    }

    @Override
    public ClasificacionContableDTO crearClasificacion(
            Long usuarioId,
            ClasificacionContableCrearDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);

        Empresa empresa = obtenerEmpresa(dto.getEmpresaId());
        validarAccesoAEmpresa(usuario, empresa.getId());

        String nombre = normalizarRequerido(
                dto.getNombre(),
                "El nombre de la clasificación es obligatorio"
        );
        TipoRegistroContable tipo = parsearTipoConcepto(dto.getTipo());

        ClasificacionContable existente = clasificacionContableRepositorio
                .findByEmpresaIdAndTipoAndNombreIgnoreCase(empresa.getId(), tipo, nombre)
                .orElse(null);
        if (existente != null) {
            if (Boolean.TRUE.equals(existente.getActivo())) {
                throw new RuntimeException("Ya existe una clasificación con ese nombre para este tipo");
            }

            // Se reactiva el mismo registro para no romper sus relaciones históricas.
            existente.setActivo(true);
            return mapearClasificacion(clasificacionContableRepositorio.save(existente));
        }

        ClasificacionContable clasificacion = new ClasificacionContable();
        clasificacion.setNombre(nombre);
        clasificacion.setTipo(tipo);
        clasificacion.setEmpresa(empresa);
        clasificacion.setActivo(true);

        return mapearClasificacion(clasificacionContableRepositorio.save(clasificacion));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClasificacionContableDTO> listarClasificacionesPorEmpresa(
            Long usuarioId,
            Long empresaId
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);
        validarAccesoAEmpresa(usuario, empresaId);

        return clasificacionContableRepositorio.findByEmpresaIdOrderByTipoAscNombreAsc(empresaId)
                .stream()
                .map(this::mapearClasificacion)
                .toList();
    }

    @Override
    public ClasificacionContableDTO editarClasificacion(
            Long usuarioId,
            Long clasificacionId,
            ClasificacionContableEditarDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);

        ClasificacionContable clasificacion = obtenerClasificacion(clasificacionId);
        validarAccesoAEmpresa(usuario, clasificacion.getEmpresa().getId());

        String nombre = normalizarRequerido(
                dto.getNombre(),
                "El nombre de la clasificación es obligatorio"
        );
        if (!clasificacion.getNombre().equalsIgnoreCase(nombre)
                && clasificacionContableRepositorio.existsByEmpresaIdAndTipoAndNombreIgnoreCaseAndIdNot(
                        clasificacion.getEmpresa().getId(),
                        clasificacion.getTipo(),
                        nombre,
                        clasificacionId)) {
            throw new RuntimeException("Ya existe otra clasificación con ese nombre para este tipo");
        }

        clasificacion.setNombre(nombre);
        return mapearClasificacion(clasificacionContableRepositorio.save(clasificacion));
    }

    @Override
    public void eliminarClasificacion(Long usuarioId, Long clasificacionId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoGestionConceptos(usuario);

        ClasificacionContable clasificacion = obtenerClasificacion(clasificacionId);
        validarAccesoAEmpresa(usuario, clasificacion.getEmpresa().getId());

        // Eliminación lógica: conserva conceptos y movimientos históricos.
        clasificacion.setActivo(false);
        clasificacionContableRepositorio.save(clasificacion);
    }

    private RegistroContableDTO mapear(RegistroContableSucursal registro) {
        RegistroContableDTO dto = new RegistroContableDTO();
        dto.setId(registro.getId());
        dto.setTipo(registro.getTipo().name());
        dto.setConcepto(registro.getConcepto());
        if (registro.getClasificacion() != null) {
            dto.setClasificacion(registro.getClasificacion().name());
        }
        if (registro.getClasificacionContable() != null) {
            dto.setClasificacionId(registro.getClasificacionContable().getId());
            dto.setClasificacionNombre(registro.getClasificacionNombre() == null
                    ? registro.getClasificacionContable().getNombre()
                    : registro.getClasificacionNombre());
        }
        if (registro.getConceptoGasto() != null) {
            dto.setConceptoGastoId(registro.getConceptoGasto().getId());
            dto.setConceptoGastoNombre(registro.getConceptoGasto().getNombre());
            dto.setClasificacionGasto(registro.getConceptoGasto().getClasificacionContable() != null
                    ? registro.getConceptoGasto().getClasificacionContable().getNombre()
                    : registro.getConceptoGasto().getClasificacion().name());
        }
        dto.setDescripcion(registro.getDescripcion());
        dto.setValor(registro.getValor());
        dto.setFecha(registro.getFecha());
        dto.setSucursalId(registro.getSucursal().getId());
        dto.setSucursalNombre(registro.getSucursal().getNombre());
        dto.setUsuarioId(registro.getUsuario().getId());
        dto.setUsuarioNombre(registro.getUsuario().getNombre());
        dto.setUsuarioRol(registro.getUsuario().getRol().name());
        dto.setFechaCreacion(registro.getFechaCreacion());
        return dto;
    }

    private ConceptoGastoDTO mapearConcepto(ConceptoGasto concepto) {
        ConceptoGastoDTO dto = new ConceptoGastoDTO();
        dto.setId(concepto.getId());
        dto.setNombre(concepto.getNombre());
        dto.setTipo(concepto.getTipo() == null ? TipoRegistroContable.GASTO.name() : concepto.getTipo().name());
        if (concepto.getClasificacionContable() != null) {
            dto.setClasificacionId(concepto.getClasificacionContable().getId());
            dto.setClasificacionNombre(concepto.getClasificacionContable().getNombre());
        }
        dto.setDescripcion(concepto.getDescripcion());
        dto.setClasificacion(concepto.getClasificacion().name());
        dto.setEmpresaId(concepto.getEmpresa().getId());
        dto.setEmpresaNombre(concepto.getEmpresa().getNombre());
        dto.setActivo(concepto.getActivo());
        dto.setFechaCreacion(concepto.getFechaCreacion());
        return dto;
    }

    private ClasificacionContableDTO mapearClasificacion(ClasificacionContable clasificacion) {
        ClasificacionContableDTO dto = new ClasificacionContableDTO();
        dto.setId(clasificacion.getId());
        dto.setNombre(clasificacion.getNombre());
        dto.setTipo(clasificacion.getTipo().name());
        dto.setEmpresaId(clasificacion.getEmpresa().getId());
        dto.setEmpresaNombre(clasificacion.getEmpresa().getNombre());
        dto.setActivo(clasificacion.getActivo());
        dto.setFechaCreacion(clasificacion.getFechaCreacion());
        return dto;
    }

    private void validarPermisoYAcceso(Usuario usuario, Sucursal sucursal) {
        if (usuario.getRol() != RolEnum.SUPER_ADMIN && usuario.getRol() != RolEnum.ADMIN) {
            throw new RuntimeException("No tiene permisos para gestionar reportes contables");
        }

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null || sucursal.getEmpresa() == null
                || !sucursal.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
            throw new RuntimeException("No puede consultar reportes de otra empresa");
        }
    }

    private void validarAccesoEmpleado(Usuario usuario, Sucursal sucursal) {
        if (usuario.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Este acceso es exclusivo para empleados");
        }

        if (usuario.getSucursal() == null
                || !usuario.getSucursal().getId().equals(sucursal.getId())) {
            throw new RuntimeException("El empleado solo puede operar en su sucursal asignada");
        }
    }

    private void validarPermisoGestionConceptos(Usuario usuario) {
        if (usuario.getRol() != RolEnum.SUPER_ADMIN && usuario.getRol() != RolEnum.ADMIN) {
            throw new RuntimeException("No tiene permisos para gestionar conceptos de gasto");
        }
    }

    private void validarAccesoAEmpresa(Usuario usuario, Long empresaId) {
        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getRol() == RolEnum.ADMIN
                && usuario.getEmpresa() != null
                && usuario.getEmpresa().getId().equals(empresaId)) {
            return;
        }

        throw new RuntimeException("No puede acceder a los conceptos de otra empresa");
    }

    private void validarConceptoEnSucursal(ConceptoGasto concepto, Sucursal sucursal) {
        if (sucursal.getEmpresa() == null
                || concepto.getEmpresa() == null
                || !sucursal.getEmpresa().getId().equals(concepto.getEmpresa().getId())) {
            throw new RuntimeException("El concepto no pertenece a la empresa de la sucursal");
        }
    }

    private boolean esConceptoDeGasto(ConceptoGasto concepto) {
        return concepto.getTipo() == TipoRegistroContable.GASTO
                || (concepto.getTipo() == null
                && concepto.getClasificacion() != ClasificacionGasto.PRODUCCION_INDIRECTA);
    }

    private ClasificacionGasto parsearClasificacion(String valor) {
        try {
            return ClasificacionGasto.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new RuntimeException(
                    "La clasificación debe ser OPERATIVO, ADMINISTRATIVO, VENTAS, PRODUCCION, PRODUCCION_INDIRECTA u OTRO"
            );
        }
    }

    private ClasificacionGasto parsearClasificacionOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return parsearClasificacion(valor);
    }

    private TipoRegistroContable parsearTipoConcepto(String valor) {
        if (valor == null || valor.isBlank()) {
            return TipoRegistroContable.GASTO;
        }
        try {
            return TipoRegistroContable.valueOf(valor.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new RuntimeException("El tipo de concepto debe ser COSTO o GASTO");
        }
    }

    private void validarTipoYClasificacionConcepto(
            TipoRegistroContable tipo,
            ClasificacionGasto clasificacion,
            ClasificacionContable clasificacionContable
    ) {
        if (tipo == TipoRegistroContable.COSTO
                && !esCostoIndirecto(clasificacion, clasificacionContable)) {
            throw new RuntimeException("Un concepto de costo debe ser costo indirecto de producción");
        }
        if (tipo == TipoRegistroContable.GASTO
                && clasificacionContable != null
                && clasificacionContable.getTipo() != TipoRegistroContable.GASTO) {
            throw new RuntimeException("La clasificación seleccionada no corresponde a un gasto");
        }
        if (tipo == TipoRegistroContable.GASTO
                && clasificacion == ClasificacionGasto.PRODUCCION_INDIRECTA) {
            throw new RuntimeException("La clasificación de producción indirecta pertenece a los costos");
        }
    }

    private boolean esCostoIndirecto(
            ClasificacionGasto clasificacion,
            ClasificacionContable clasificacionContable
    ) {
        return clasificacionContable != null
                ? clasificacionContable.getTipo() == TipoRegistroContable.COSTO
                : clasificacion == ClasificacionGasto.PRODUCCION_INDIRECTA;
    }

    private ClasificacionContable resolverClasificacionContable(
            Usuario usuario,
            Empresa empresa,
            Long clasificacionId,
            TipoRegistroContable tipo
    ) {
        if (clasificacionId == null) {
            return null;
        }

        ClasificacionContable clasificacion = obtenerClasificacion(clasificacionId);
        validarAccesoAEmpresa(usuario, empresa.getId());
        if (!clasificacion.getEmpresa().getId().equals(empresa.getId())) {
            throw new RuntimeException("La clasificación no pertenece a la empresa");
        }
        if (!Boolean.TRUE.equals(clasificacion.getActivo())) {
            throw new RuntimeException("La clasificación seleccionada está inactiva");
        }
        if (clasificacion.getTipo() != tipo) {
            throw new RuntimeException("La clasificación no corresponde al tipo de concepto");
        }
        return clasificacion;
    }

    private String normalizarRequerido(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) {
            throw new RuntimeException(mensaje);
        }
        return valor.trim();
    }

    private Empresa obtenerEmpresa(Long empresaId) {
        return empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
    }

    private ConceptoGasto obtenerConcepto(Long conceptoId) {
        return conceptoGastoRepositorio.findById(conceptoId)
                .orElseThrow(() -> new RuntimeException("Concepto de gasto no encontrado"));
    }

    private ClasificacionContable obtenerClasificacion(Long clasificacionId) {
        return clasificacionContableRepositorio.findById(clasificacionId)
                .orElseThrow(() -> new RuntimeException("Clasificación contable no encontrada"));
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private Sucursal obtenerSucursal(Long sucursalId) {
        return sucursalRepositorio.findById(sucursalId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
    }

    private String normalizarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
