# 🔒 Guía de Seguridad - Pokemon Admin Panel

## Mejoras de Seguridad Implementadas

### 1. **Validación de Entrada (XSS & HTML Injection Prevention)**
- ✅ Sanitización de texto eliminando caracteres peligrosos (<, >, ", ',  `)
- ✅ Validación de longitud (máximo 100 caracteres para nombres/sets)
- ✅ Validación de formato (regex para caracteres permitidos)
- ✅ Validación de precios (números positivos, máximo 999,999.99)
- ✅ Validación de rareza (whitelist de valores permitidos)

**Archivos:**
- `lib/security.js` - Funciones de validación

### 2. **Autenticación Mejorada**
- ✅ Contraseñas hasheadas con PBKDF2 (1000 iteraciones)
- ✅ Rate limiting: máximo 5 intentos de login en 15 minutos por IP
- ✅ Sesiones con expiración (24 horas)
- ✅ Limpieza automática de sesiones expiradas
- ✅ Comparación constante de contraseñas (timing attack resistant)

**Archivos:**
- `lib/auth.js` - Gestión de autenticación y sesiones
- `lib/security.js` - Hashing y verificación de contraseñas

### 3. **Seguridad de Cookies**
- ✅ HttpOnly: Previene acceso desde JavaScript (XSS)
- ✅ Secure: Solo se envía por HTTPS en producción
- ✅ SameSite=Strict: Previene CSRF attacks
- ✅ Max-Age: Expiración automática

```javascript
Set-Cookie: adminToken=...; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

### 4. **Protección CSRF**
- ✅ SameSite cookies (prevención de cross-site request forgery)
- ✅ Validación de método HTTP (POST, PUT, DELETE solo desde rutas correctas)

### 5. **Rate Limiting**
- ✅ 5 intentos de login máximo en 15 minutos por IP
- ✅ Previene brute force attacks
- ✅ Respuesta amigable al usuario

### 6. **Autorización**
- ✅ Endpoints protegidos requieren sesión válida
- ✅ GET /api/cards - Público (cualquiera puede ver cartas)
- ✅ POST /api/cards - Requiere autenticación (solo admin puede crear)
- ✅ PUT /api/cards/[id] - Requiere autenticación (solo admin puede editar)
- ✅ DELETE /api/cards/[id] - Requiere autenticación (solo admin puede eliminar)

### 7. **Manejo de Errores Seguro**
- ✅ Errores genéricos que no revelan detalles internos
- ✅ Ejemplos:
  - ❌ "Usuario no existe" (malo - revela info)
  - ✅ "Credenciales inválidas" (bueno - genérico)
  - ❌ "Error: Cannot read property of undefined" (malo - revela stack)
  - ✅ "Error procesando solicitud" (bueno - genérico)

### 8. **Headers de Seguridad**
- ✅ `X-Content-Type-Options: nosniff` - Previene MIME sniffing
- ✅ `X-Frame-Options: DENY` - Previene clickjacking
- ✅ `X-XSS-Protection: 1; mode=block` - Protección XSS del navegador

### 9. **Logging de Seguridad**
Todos los eventos sensibles se registran:
- ✅ Intentos de login (exitosos y fallidos)
- ✅ Rate limiting triggers
- ✅ Acceso no autorizado
- ✅ Creación/actualización/eliminación de cartas
- ✅ Logout

**Formato:**
```
[SECURITY] 2026-02-18T10:30:45.123Z - LOGIN_SUCCESS { username: 'admin', ip: '192.168.1.1' }
[SECURITY] 2026-02-18T10:31:20.456Z - LOGIN_RATE_LIMITED { ip: '192.168.1.2' }
```

## 📋 Checklist de Seguridad

### Antes de Producción:

- [ ] **Instalar bcrypt** para mejor hashing de contraseñas:
  ```bash
  npm install bcrypt
  ```
  Actualizar `lib/security.js` para usar bcrypt en lugar de PBKDF2

- [ ] **Configurar HTTPS**: 
  - Las cookies con flag `Secure` requieren HTTPS
  - Usar certificado SSL válido

- [ ] **Cambiar contraseña admin por defecto**:
  - Editar `data/admins.json`
  - Usar contraseña fuerte (12+ caracteres, números, símbolos)

- [ ] **Configurar variables de entorno**:
  - Copiar `.env.example` a `.env.local`
  - Nunca commitear `.env.local`

- [ ] **Implementar base de datos segura**:
  - Usar parameterized queries para prevenir SQL injection
  - Nunca concatenar strings en queries
  - Validar entrada ANTES de la query

- [ ] **Agregar CSRF tokens** (si usas formularios HTML):
  - Token único por sesión
  - Validar en cada request POST/PUT/DELETE

- [ ] **Configurar Content Security Policy (CSP)**:
  ```javascript
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  ```

- [ ] **Implementar 2FA** (autenticación de dos factores):
  - Email code o TOTP
  - Requiere `npm install speakeasy qrcode`

- [ ] **Backup seguro**:
  - Encriptar datos en reposo
  - Hacer backups frecuentes
  - Guardar en lugar seguro

- [ ] **Auditoría regular**:
  - Revisar logs de seguridad semanalmente
  - Monitorear intentos de acceso fallidos
  - Limpiar sesiones antiguas

### Desarrollo:

- [ ] **never commit:**
  - `.env.local` con credenciales
  - `data/sessions.json` (datos de sesión)
  - `data/admins.json` (considerar encriptar)

- [ ] **Usar archivo .gitignore:**
  ```
  .env.local
  .env
  node_modules/
  data/sessions.json
  *.log
  ```

- [ ] **Testing de seguridad:**
  - Intentar SQL injection (cuando uses BD)
  - Intentar XSS payloads
  - Intentar CSRF (sin CSRF token)
  - Intentar brute force
  - Intentar directory traversal

## 🔐 Recomendaciones Futuras

### Cuando Agreges Base de Datos:

1. **Prepared Statements**:
   ```javascript
   // ✅ CORRECTO
   db.query('SELECT * FROM cards WHERE id = ?', [id]);
   
   // ❌ INCORRECTO
   db.query(`SELECT * FROM cards WHERE id = ${id}`);
   ```

2. **Least Privilege**:
   - Usuario DB solo con permisos necesarios
   - Separar usuarios para lectura vs escritura

3. **Encripción**:
   - Datos sensibles encriptados en BD
   - Contraseñas nunca en texto plano

### Autenticación OAuth2:

```javascript
// Ejemplo con Google OAuth
import { GoogleAuth } from 'google-auth-library';
```

### Monitoreo:

- Sentry para error tracking
- New Relic para performance monitoring
- Email alerts para eventos críticos

## 🛠️ Cómo Usar

### Para El Usuario Actual:

Las mejoras están automáticamente aplicadas en todos los endpoints. Solo asegúrate:

1. Contraseña fuerte en admin.json
2. Cambiar contraseña por defecto
3. No compartir credenciales

### Para Reportar Vulnerabilidades:

Si encuentras un problema de seguridad:
1. NO lo publiques públicamente
2. Reporta privadamente al desarrollador
3. Proporciona pasos para reproducir
4. Describe el impacto

---

**Última actualización:** 18 de Febrero, 2026
**Estado:** ✅ Seguridad Mejorada para Desarrollo
**Próximos pasos:** Implementar base de datos segura
