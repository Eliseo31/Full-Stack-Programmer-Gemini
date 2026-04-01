# Documentación del Sistema: CSELITEGROUP Punto de Ventas

Este documento proporciona una guía completa sobre el funcionamiento del sistema y los pasos necesarios para su despliegue en un servidor externo (como Ubuntu Server).

---

## 1. Descripción General
**CSELITEGROUP Punto de Ventas** es una aplicación full-stack diseñada para la gestión integral de ventas, inventario, clientes y reportes. Está optimizada para su uso en entornos comerciales que requieren un control preciso de existencias y facturación con soporte para NCF (Números de Comprobante Fiscal).

### Arquitectura Técnica
- **Frontend**: React 18 con Vite, TypeScript y Tailwind CSS.
- **Backend**: Node.js con Express.js.
- **Base de Datos**: MariaDB (o MySQL).
- **Comunicación**: API RESTful.

---

## 2. Módulos del Sistema

1.  **Panel de Control (Dashboard)**: Visualización en tiempo real de ventas, inventario bajo y métricas clave.
2.  **Punto de Venta (POS)**: Interfaz rápida para realizar ventas, seleccionar clientes y procesar pagos.
3.  **Inventario**: Gestión de productos, SKUs, categorías, costos, precios y control de stock. Incluye importación/exportación vía Excel.
4.  **Facturación (Ventas/Compras)**: Historial detallado de transacciones con visualización de artículos.
5.  **Clientes**: Directorio de clientes con gestión de RNC y tipos de comprobantes requeridos.
6.  **Devoluciones**: Gestión de retornos de mercancía con ajuste automático de inventario.
7.  **Usuarios**: Control de acceso basado en roles (Admin, Gerente, Vendedor, Almacén).
8.  **Configuración**: Personalización de datos de la empresa, logo y secuencias de NCF.

---

## 3. Requisitos Previos

Para desplegar el sistema, asegúrese de tener instalado:
- **Node.js** (Versión 18 o superior).
- **npm** (Gestor de paquetes de Node).
- **MariaDB** (Versión 10.4 o superior) o MySQL.
- **PM2** (Opcional, para mantener el servidor activo).
- **Nginx** (Opcional, como proxy inverso).

---

## 4. Guía de Despliegue (Ubuntu Server)

### Paso 1: Preparación del Servidor
Actualice el sistema e instale las dependencias básicas:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm mariadb-server nginx
```

### Paso 2: Configuración de la Base de Datos
1. Inicie sesión en MariaDB:
   ```bash
   sudo mysql -u root
   ```
2. Ejecute el contenido del archivo `schema.sql` que se encuentra en la raíz del proyecto para crear las tablas e insertar la configuración inicial.
3. Cree un usuario y otorgue permisos:
   ```sql
   CREATE USER 'pos_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';
   GRANT ALL PRIVILEGES ON cselitegroup_pos.* TO 'pos_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Paso 3: Configuración de la Aplicación
1. Suba los archivos del proyecto al servidor (vía Git, SCP o SFTP).
2. Instale las dependencias:
   ```bash
   npm install
   ```
3. Cree el archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Ajuste los valores de `DB_HOST`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` según su configuración.*

4. Construya la aplicación para producción:
   ```bash
   npm run build
   ```

### Paso 4: Ejecución con PM2
Para asegurar que el sistema se reinicie automáticamente si falla o si el servidor se reinicia:
```bash
sudo npm install -g pm2
pm2 start server.ts --interpreter tsx --name "pos-system"
pm2 save
pm2 startup
```

### Paso 5: Configuración de Nginx (Opcional)
Configure Nginx para actuar como proxy inverso hacia el puerto 3000:
1. Cree un archivo de configuración:
   ```bash
   sudo nano /etc/nginx/sites-available/pos-system
   ```
2. Agregue la configuración básica:
   ```nginx
   server {
       listen 80;
       server_name tu_dominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Habilite el sitio y reinicie Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pos-system /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 5. Variables de Entorno (.env)

| Variable | Descripción |
| :--- | :--- |
| `PORT` | Puerto en el que corre el servidor (Default: 3000). |
| `DB_HOST` | Dirección del servidor de MariaDB (Ej: localhost). |
| `DB_USER` | Usuario de la base de datos. |
| `DB_PASSWORD` | Contraseña del usuario de la base de datos. |
| `DB_NAME` | Nombre de la base de datos (Ej: cselitegroup_pos). |
| `DB_PORT` | Puerto de MariaDB (Default: 3306). |
| `NODE_ENV` | Entorno de ejecución (`development` o `production`). |

---

## 6. Mantenimiento
- **Logs**: Puede ver los logs del sistema con `pm2 logs pos-system`.
- **Actualizaciones**: Para actualizar el sistema, suba los nuevos archivos, ejecute `npm install`, `npm run build` y reinicie con `pm2 restart pos-system`.
- **Backups**: Se recomienda realizar respaldos periódicos de la base de datos MariaDB:
  ```bash
  mysqldump -u pos_user -p cselitegroup_pos > backup_fecha.sql
  ```
