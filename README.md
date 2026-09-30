# 📦 LocalStock

Sistema web de gestión de inventario y ventas desarrollado para pequeños negocios.

LocalStock permite administrar productos, categorías, compras, ventas, movimientos de inventario, caja y deudas desde una interfaz web moderna y sencilla.

---

## 🚀 Características

* 📦 Gestión de productos
* 🏷️ Gestión de categorías
* 📊 Control de inventario
* 🛒 Registro de compras
* 💰 Registro de ventas
* 💵 Gestión de caja
* 📒 Gestión de deudas
* 📈 Métricas y estadísticas
* 🧾 Registro de movimientos
* 🔐 Autenticación de usuarios
* 👤 Roles de usuario y administrador
* 🔎 Búsqueda y filtrado de información
* 📄 Paginación de registros
* 🔔 Notificaciones mediante Toast
* 📱 Interfaz adaptable a diferentes tamaños de pantalla

---

## 🛠️ Tecnologías utilizadas

### Frontend

* [Next.js](https://nextjs.org/)
* [React](https://react.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [shadcn/ui](https://ui.shadcn.com/)
* [Lucide React](https://lucide.dev/)

### Backend

* Next.js Server Actions
* Prisma ORM
* SQLite
* Zod
* React Hook Form

### Herramientas

* Git
* GitHub
* npm

---

## 📋 Requisitos

Antes de ejecutar el proyecto necesitas tener instalado:

* Node.js 20 o superior
* npm
* Git

Puedes comprobar las versiones instaladas con:

```bash
node -v
npm -v
git --version
```

---

## ⚙️ Instalación

Clona el repositorio:

```bash
git clone https://github.com/TU-USUARIO/localstock.git
```

Entra al proyecto:

```bash
cd localstock
```

Instala las dependencias:

```bash
npm install
```

---

## 🗄️ Base de datos

LocalStock utiliza **SQLite** como base de datos y **Prisma ORM** para trabajar con ella.

Después de instalar las dependencias, genera el cliente de Prisma:

```bash
npx prisma generate
```

Aplica las migraciones:

```bash
npx prisma migrate dev
```

---

## ▶️ Ejecutar en desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

Luego abre:

```text
http://localhost:3000
```

---

## 🏗️ Compilar para producción

Para generar una compilación de producción:

```bash
npm run build
```

Después puedes iniciar la aplicación con:

```bash
npm run start
```

---

## 📁 Estructura principal

```text
localstock/
│
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── ...
│
├── action/
│   ├── auth/
│   ├── category/
│   ├── product/
│   ├── sale/
│   ├── purchase/
│   ├── debt/
│   └── cashbox/
│
├── components/
│   ├── ui/
│   ├── product/
│   ├── category/
│   ├── sale/
│   ├── purchase/
│   └── ...
│
├── lib/
│
├── schema/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── generated/
│   └── prisma/
│
├── public/
│
├── package.json
└── README.md
```

---

## 🔐 Roles de usuario

El sistema contempla diferentes roles:

### Administrador

Puede gestionar las principales funcionalidades del sistema y administrar la información del negocio.

### Usuario

Puede utilizar las funcionalidades disponibles según los permisos establecidos por el sistema.

---

## 📦 Gestión de inventario

El inventario se actualiza mediante movimientos.

Entre los tipos de movimientos contemplados se encuentran:

* Entrada
* Salida
* Compra
* Venta
* Ajuste
* Devolución

Los productos pueden tener:

* Precio de venta
* Precio de costo
* Stock
* Stock mínimo
* Unidad de medida
* Código de barras
* Categoría
* Estado activo/inactivo

---

## 💰 Gestión financiera

LocalStock incluye un módulo de caja para registrar movimientos financieros relacionados con:

* Ventas
* Compras
* Gastos
* Ingresos
* Pagos de deudas
* Cobros de deudas
* Ajustes

También permite gestionar deudas de:

* Clientes
* Proveedores

---

## 🎯 Objetivo del proyecto

El objetivo de LocalStock es proporcionar una herramienta sencilla para la gestión de pequeños negocios, centralizando en una misma aplicación el control de inventario, ventas, compras, caja y deudas.

El proyecto está desarrollado como una aplicación local, utilizando SQLite, lo que permite trabajar sin depender de un servidor de base de datos externo.

---

## 📚 Estado del proyecto

🚧 **En desarrollo**

Actualmente se encuentran implementadas las principales funcionalidades de:

* Productos
* Categorías
* Inventario
* Ventas
* Compras
* Caja
* Deudas
* Autenticación

Se continúan incorporando mejoras en la interfaz, métricas, reportes y experiencia de usuario.

---

## 👨‍💻 Autor

**Miguel Ernesto Capote Hernández**

Proyecto desarrollado como parte de mi proceso de aprendizaje y desarrollo profesional en programación web.

---

## 📄 Licencia

Este proyecto se encuentra actualmente destinado a fines educativos y de desarrollo personal.
