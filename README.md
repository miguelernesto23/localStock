# 📦 LocalStock

Sistema web de gestión de inventario y ventas desarrollado para pequeños negocios.

LocalStock permite administrar productos, categorías, compras, ventas, movimientos de inventario, caja y deudas desde una interfaz web moderna, intuitiva y adaptable.

El sistema está diseñado para centralizar las operaciones principales de un negocio, facilitando el control de existencias, el seguimiento de las operaciones comerciales y la gestión financiera.

---

## 🚀 Características

- 📦 Gestión de productos.
- 🏷️ Gestión de categorías.
- 📊 Control de inventario.
- 🛒 Registro y gestión de compras.
- 💰 Registro y gestión de ventas.
- 🧾 Control de inventario mediante movimientos.
- 🗃️ Gestión de inventario por lotes.
- 🔄 Asignación manual de lotes en las ventas.
- 📈 Cálculo de costos y ganancias según los lotes utilizados.
- 💵 Gestión de caja.
- 📒 Gestión de deudas de clientes y proveedores.
- 📊 Métricas y estadísticas.
- 🔐 Autenticación de usuarios.
- 👤 Roles de usuario y administrador.
- 🔎 Búsqueda y filtrado de información.
- 📄 Paginación de registros.
- 🔔 Notificaciones mediante Toast.
- 📱 Interfaz adaptable a diferentes tamaños de pantalla.

---

## 🛠️ Tecnologías utilizadas

### Frontend

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Lucide React](https://lucide.dev/)
- [React Hook Form](https://react-hook-form.com/)

### Backend

- Next.js Server Actions
- [Prisma ORM](https://www.prisma.io/)
- SQLite
- [Zod](https://zod.dev/)

### Herramientas

- Git
- GitHub
- npm

---

## 📋 Requisitos

Antes de ejecutar el proyecto necesitas tener instalado:

- Node.js 20 o superior.
- npm.
- Git.

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

Entra al directorio del proyecto:

```bash
cd localstock
```

Instala las dependencias:

```bash
npm install
```

---

## 🗄️ Base de datos

LocalStock utiliza **SQLite** como sistema de base de datos y **Prisma ORM** para gestionar las operaciones y relaciones entre entidades.

Genera el cliente de Prisma:

```bash
npx prisma generate
```

Aplica las migraciones:

```bash
npx prisma migrate dev
```

> Es necesario tener configuradas las variables de entorno correspondientes antes de ejecutar las operaciones de base de datos.

---

## ▶️ Ejecutar en desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre la aplicación en el navegador:

```text
http://localhost:3000
```

---

## 🏗️ Compilar para producción

Genera la compilación:

```bash
npm run build
```

Inicia la aplicación:

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
│   ├── cashbox/
│   └── ...
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
├── repository/
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

Puede gestionar las principales funcionalidades del sistema y administrar la información del negocio según los permisos definidos.

### Usuario

Puede utilizar las funcionalidades disponibles de acuerdo con los permisos establecidos por el sistema.

---

## 📦 Gestión de inventario

LocalStock permite administrar los productos y controlar sus existencias mediante movimientos de inventario.

Entre los tipos de movimientos contemplados se encuentran:

- Entrada.
- Salida.
- Compra.
- Venta.
- Ajuste.
- Devolución.

Los productos pueden tener:

- Precio de venta.
- Precio de costo.
- Stock disponible.
- Stock mínimo.
- Unidad de medida.
- Código de barras.
- Categoría.
- Estado activo o inactivo.

### Control de inventario por lotes

El sistema incorpora un mecanismo de gestión de existencias por lotes.

Cada lote puede registrar:

- Código de lote.
- Fecha de compra.
- Cantidad inicial.
- Cantidad disponible.
- Costo unitario de adquisición.

Esto permite conservar información sobre el origen y costo de las existencias, incluso cuando un mismo producto se adquiere a precios diferentes.

### Asignación de lotes en las ventas

Durante el registro de una venta se pueden seleccionar los lotes específicos de los que saldrán las unidades vendidas.

El sistema permite:

- Seleccionar uno o varios lotes para un mismo producto.
- Indicar la cantidad que se utilizará de cada lote.
- Consultar la disponibilidad y el costo unitario de cada lote.
- Descontar las cantidades correspondientes del inventario.
- Registrar la relación entre los productos vendidos y sus lotes de origen.

Esto permite calcular el costo real de adquisición de los productos vendidos y obtener una estimación de la ganancia basada en los costos de los lotes utilizados.

---

## 💰 Gestión financiera

LocalStock incluye un módulo de caja para registrar y controlar los movimientos financieros relacionados con las operaciones del negocio.

Entre los movimientos contemplados se encuentran:

- Ventas.
- Compras.
- Gastos.
- Ingresos.
- Pagos de deudas.
- Cobros de deudas.
- Ajustes.

También permite gestionar:

- Deudas de clientes.
- Deudas con proveedores.

---

## 🎯 Objetivo del proyecto

El objetivo de LocalStock es proporcionar una herramienta sencilla y práctica para la administración de pequeños negocios.

La aplicación busca centralizar en un mismo sistema el control de inventario, las compras, las ventas y las operaciones financieras, ofreciendo información organizada que facilite la toma de decisiones.

El proyecto utiliza SQLite como base de datos, permitiendo trabajar sin depender de un servidor de base de datos externo.

---

## 📚 Estado del proyecto

🚧 **En desarrollo**

Actualmente se encuentran implementadas las principales funcionalidades relacionadas con:

- Productos.
- Categorías.
- Inventario.
- Compras.
- Ventas.
- Gestión de lotes.
- Caja.
- Deudas.
- Autenticación.

Se continúa trabajando en mejoras de interfaz, reportes, métricas, optimización y experiencia de usuario.

---

## 👨‍💻 Autor

**Miguel Ernesto Capote Hernández**

Proyecto desarrollado como parte de mi proceso de aprendizaje y desarrollo profesional en programación web.

---

## 📄 Licencia

Este proyecto se encuentra actualmente destinado a fines educativos y de desarrollo personal.