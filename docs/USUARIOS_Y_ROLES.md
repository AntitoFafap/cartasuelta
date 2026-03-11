# 👥 Sistema de Usuarios y Roles

## Roles Disponibles

### 1. **Super Admin**
- ✅ Crear, editar y eliminar cartas
- ✅ Crear, editar y eliminar usuarios
- ✅ Acceso completo a todas las funciones
- 👤 Uso: Administrador principal del sistema

### 2. **Staff**
- ✅ Crear, editar y eliminar cartas
- ❌ No puede gestionar usuarios
- 👤 Uso: Personal administrativo para gestión de cartas

## Cómo Crear Nuevos Usuarios

### Desde el Panel de Admin:

1. Haz click en el botón **"Usuarios ▼"** en la esquina superior derecha
2. Se abrirá un menú desplegable con:
   - Lista de usuarios actuales
   - Roles asignados a cada usuario
   - Botón para eliminar usuarios
   - Formulario para crear nuevo usuario

3. Completa el formulario:
   - **Nuevo usuario**: Nombre de usuario (mínimo 3 caracteres)
   - **Contraseña**: Mínimo 6 caracteres
   - **Email** (opcional): Dirección de email
   - **Rol**: Selecciona el rol (Super Admin o Staff)

4. Click en **"Crear Usuario"**

## API REST para Usuarios

### GET /api/admin/users
Obtiene lista de todos los usuarios

```bash
curl http://localhost:3000/api/admin/users
```

**Respuesta:**
```json
[
  {
    "username": "lecheconplatano",
    "role": "Super Admin",
    "email": "admin@pokemon.local",
    "createdAt": "2026-02-18T00:00:00.000Z"
  }
]
```

### POST /api/admin/users
Crea nuevo usuario

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "role": "Staff",
    "email": "user@example.com"
  }'
```

### PUT /api/admin/users/[username]
Actualiza un usuario

```bash
curl -X PUT http://localhost:3000/api/admin/users/newuser \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Staff",
    "email": "newemail@example.com"
  }'
```

### DELETE /api/admin/users/[username]
Elimina un usuario

```bash
curl -X DELETE http://localhost:3000/api/admin/users/newuser
```

## Notas de Seguridad

- ✅ No se pueden eliminar usuarios mientras estén en sesión activa
- ✅ Cada acción de usuarios se registra en logs de seguridad
- ✅ Las contraseñas se hashean con PBKDF2
- ✅ Los roles se validaran en futuras actualizaciones de endpoints

## Próximos Pasos

Para implementar control de permisos basado en roles:

1. Actualizar `/api/cards*` para validar permisos según rol
2. Agregar UI condicional basada en rol del usuario
3. Guardar registro de auditoría de cambios por usuario

---

**Usuarios creados:** Ver menú "Usuarios ▼" en el panel de admin
