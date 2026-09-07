# Desarrollo local

Este entorno ejecuta MySQL, Spring Boot y Angular con Docker. El frontend y el backend usan los archivos del proyecto mediante volúmenes, por lo que puedes editar el código y ver los cambios sin reconstruir las imágenes de producción.

## Primer arranque

En PowerShell, desde la raíz del proyecto:

```powershell
Copy-Item .env.local.example .env.local
docker compose -f docker-compose.local.yml up
```

Abre [http://localhost:4200](http://localhost:4200). El backend queda disponible en [http://localhost:8080](http://localhost:8080) y MySQL en el puerto local `3307` (`3306` dentro de Docker).

## Comandos habituales

```powershell
# Ejecutar en segundo plano
docker compose -f docker-compose.local.yml up -d

# Ver logs del backend o frontend
docker compose -f docker-compose.local.yml logs -f inventario-api
docker compose -f docker-compose.local.yml logs -f inventario-frontend

# Detener servicios sin borrar la base de datos
docker compose -f docker-compose.local.yml down

# Detener y borrar también los datos locales de MySQL
docker compose -f docker-compose.local.yml down -v
```

El archivo `.env.local` es local y está excluido del repositorio. Si Docker Desktop no está iniciado, inicia el motor Linux antes de ejecutar Compose.
