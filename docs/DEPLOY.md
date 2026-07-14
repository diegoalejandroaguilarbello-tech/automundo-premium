# Despliegue en Railway

Este proyecto está preparado para desplegarse en Railway desde GitHub como un solo servicio Node.js/Express. El backend sirve la API y también el frontend estático ubicado en `AutoMundo/`.

## 1. Preparar GitHub

Desde la raíz del proyecto:

```bash
git init
git add .
git commit -m "Proyecto de concesionario listo para Railway"
git branch -M main
git remote add origin URL_DE_TU_REPOSITORIO
git push -u origin main
```

## 2. Crear proyecto en Railway

1. En Railway, crea un proyecto nuevo.
2. Selecciona Deploy from GitHub repo.
3. Escoge el repositorio del proyecto.
4. Railway detectará el `package.json` de la raíz.

El archivo `railway.json` define:

```txt
Build command: npm install
Start command: npm start
Healthcheck: /api/health
```

## 3. Agregar MySQL

Dentro del mismo proyecto de Railway:

1. Agrega un servicio MySQL.
2. Conecta o referencia las variables del servicio MySQL al servicio Node.
3. El backend reconoce automáticamente estas variables de Railway:

```txt
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
MYSQL_URL
```

También acepta variables tradicionales:

```txt
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

## 4. Variables necesarias en el servicio Node

```txt
NODE_ENV=production
JWT_SECRET=un_secreto_largo_y_seguro
JWT_EXPIRES_IN=8h
```

`PORT` no hace falta configurarlo manualmente; Railway lo inyecta durante el despliegue.

## 5. Inicializar la base de datos

Usa el archivo:

```txt
database/init.sql
```

Ese script no incluye `CREATE DATABASE` ni `USE`, por eso es más seguro para Railway: crea las tablas dentro de la base que Railway ya te asignó.

Tablas incluidas:

- `users`
- `vehicles`
- `leads`
- `financing_quotes`
- `newsletter_subscribers`
- `favoritos`

También crea la vista:

- `vehiculos`

Y carga datos iniciales:

- usuario administrador
- vehículos de ejemplo

## 6. Probar después del despliegue

Abre estas rutas:

```txt
https://TU-DOMINIO-RAILWAY.up.railway.app/api/health
https://TU-DOMINIO-RAILWAY.up.railway.app
https://TU-DOMINIO-RAILWAY.up.railway.app/admin.html
```

Credenciales iniciales:

```txt
Email: admin@automundo.com
Contraseña: Admin12345!
```

Cambia la contraseña antes de compartir el enlace públicamente.

## 7. Errores comunes

### La página abre pero no carga vehículos

Probablemente la base de datos no fue inicializada. Ejecuta `database/init.sql` en MySQL de Railway.

### Error de conexión MySQL

Revisa que el servicio Node tenga acceso a las variables del servicio MySQL.

### Error de token o login

Revisa que `JWT_SECRET` esté configurado.

### Imágenes subidas desaparecen

Railway puede reiniciar el contenedor. Para producción, usa almacenamiento persistente o un servicio externo de imágenes.
