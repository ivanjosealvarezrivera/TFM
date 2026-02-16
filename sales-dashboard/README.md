# Dashboard de Ventas - Hormigón

Un dashboard interactivo y profesional diseñado para el análisis detallado de ventas de hormigón. Esta aplicación permite visualizar indicadores clave de rendimiento (KPIs), tendencias temporales y distribuciones geográficas de las ventas, facilitando la toma de decisiones basada en datos.

## 🛠️ Stack Tecnológico

El proyecto está construido con las tecnologías más modernas para garantizar rendimiento y escalabilidad:

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/)
- **Estado Global**: [Pinia](https://pinia.vuejs.org/)
- **UI Components**: [PrimeVue v4](https://primevue.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Gráficos**: [Plotly.js](https://plotly.com/javascript/)
- **Iconografía**: [Lucide Vue Next](https://lucide.dev/)
- **Procesamiento de Datos**: Web Workers para cálculos pesados.

## 🚀 Instalación y Ejecución

Sigue estos pasos para poner en marcha el proyecto localmente:

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- npm o pnpm

### Pasos

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd sales-dashboard
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

4. **Construir para producción**:
   ```bash
   npm run build
   ```

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura organizada por capas (inspirada en Clean Architecture) para mantener la separación de responsabilidades:

```text
src/
├── core/               # Reglas de negocio y entidades
│   └── entities/       # Modelos de datos principales (e.g., Sale.ts)
├── application/        # Lógica de aplicación y gestión de estado
│   └── useSalesStore.ts # Store de Pinia para las ventas
├── infrastructure/     # Servicios externos y adaptadores
│   ├── services/       # Web Workers, procesamiento de archivos y analítica
│   ├── mappers/        # Transformación de datos raw a entidades
│   └── types/          # Definiciones de tipos globales
├── presentation/       # Capa de interfaz de usuario
│   ├── components/     # Componentes reutilizables (KPIs, Charts, Tables)
│   └── views/          # Vistas principales del dashboard
└── main.ts             # Punto de entrada de la aplicación
```

Aquí te detallo cómo se cumple cada capa:

1. **Capa de Núcleo (Core / Domain)**
Ubicación: src/core/entities
Qué hace: Contiene la definición de Sale.ts. Esta es la "verdad" del negocio. Son objetos puros de TypeScript que no dependen de Vue, ni de Excel, ni de ninguna librería externa. Si cambiaras de framework (ej. a React), esta carpeta se quedaría exactamente igual.

2. **Capa de Aplicación (Application)**
Ubicación: src/application/useSalesStore.ts
Qué hace: Aquí reside la lógica de negocio "viva". Es donde se calculan los KPIs, se filtran las ventas y se preparan los datos para los gráficos. La lógica de "cómo se calcula el volumen total" o "qué es un autoconsumo" está aquí, aislada de la interfaz.

3. **Capa de Infraestructura (Infrastructure)**
Ubicación: src/infrastructure
Qué hace: Es el "traductor" con el mundo exterior. Aquí está la lógica para leer archivos Excel (.xlsx). El resto de la aplicación no sabe que los datos vienen de un Excel; solo reciben una lista de entidades Sale. Si mañana los datos vienen de una base de datos SQL, solo tendríamos que modificar esta capa.

4. **Capa de Presentación (Presentation)**
Ubicación: src/presentation (views, components)
Qué hace: Es la cáscara visual. Solo se encarga de pintar botones, tablas y gráficos. Los componentes como KPICard.vue o BaseChartJS.vue son tontos: solo reciben datos y los muestran. No saben cómo se calculan esos datos ni de dónde vienen.

## ✨ Funcionalidades Principales

- **Análisis de KPIs**: Visualización instantánea de volumen total, número de plantas activas y cobertura de comunidades autónomas.
- **Gráficos Dinámicos**:
  - Evolución mensual y diaria de ventas.
  - Distribución de volumen por planta y comunidad autónoma.
  - Análisis de fidelidad de clientes (Top 10).
- **Análisis de Transporte**: Desglose jerárquico por transportista y matrícula mediante gráficos Sunburst.
- **Tablas Dinámicas (Pivot)**: Exploración detallada de los datos con capacidad de filtrado y agregación.
- **Procesamiento Eficiente**: Carga progresiva de grandes volúmenes de datos mediante Web Workers para mantener la interfaz fluida.
- **Diseño Responsivo**: Interfaz optimizada para diferentes tamaños de pantalla utilizando Tailwind CSS.
