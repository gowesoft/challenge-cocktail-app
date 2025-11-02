# Cocktail Bar Manager

Una aplicación moderna para gestión de cócteles construida con Angular 20 y Angular Material.

## Características

- **Búsqueda Avanzada**: Busca cócteles por nombre, ingrediente o ID con validación en tiempo real
- **Búsqueda Automática**: Búsqueda instantánea mientras escribes con debounce de 500ms
- **Limpiar Filtros**: Botón para borrar todos los filtros y búsquedas, y volver a cargar la lista completa
- **Vista en Grilla Responsiva**: Visualización de cócteles en tarjetas adaptables a diferentes dispositivos
- **Infinite Scroll**: Carga progresiva de contenido para optimizar el rendimiento
- **Favoritos Persistentes**: Sistema de favoritos sincronizado entre múltiples pestañas del navegador
- **Detalles Completos**: Vista detallada con ingredientes, medidas e instrucciones de preparación
- **Menú Contextual**: Acciones rápidas para cada cóctel (ver detalles, añadir a favoritos)
- **Persistencia de Estado**: Mantiene el estado de búsqueda y posición de scroll entre sesiones
- **Sincronización Multi-tab**: Estado compartido entre múltiples pestañas abiertas
- **Accesibilidad (a11y)**: Cumple con estándares WCAG para accesibilidad
- **Diseño Responsivo**: Optimizado para móvil, tablet y desktop

## Estructura del Proyecto

```
src/app/
├── components/
│   ├── cocktail-card/        # Tarjeta presentacional reutilizable
│   ├── cocktail-detail/      # Vista de detalle con layout responsive
│   ├── cocktail-list/        # Contenedor principal (grid + tabla)
│   └── search-bar/           # Buscador reactivo con validaciones
├── models/                   # Interfaces y tipos TypeScript
├── services/                 # Lógica de negocio y estado persistente
├── shared/
│   └── components/
│       └── cocktail-skeleton/ # Skeleton loaders reutilizables
├── utils/                    # Helpers puros
└── route-reuse-strategy.ts   # Estrategia personalizada de reuso de rutas
```

La estructura sigue un enfoque por features con componentes standalone, servicios desacoplados y utilidades compartidas; el módulo `shared/components` centraliza piezas reutilizables como skeleton loaders para otras vistas.

## Decisiones Técnicas

- **Angular 20 + Signals**: Se adoptó Signals para un estado reactivo sin `zone.js`, lo que reduce ciclos de detección y simplifica la propagación de cambios.
- **Standalone Components**: Facilitan tree-shaking, lazy loading y reutilización al evitar NgModules tradicionales.
- **StateService personalizado**: Signals + `localStorage` permiten persistir búsqueda, scroll y favoritos entre sesiones/pestañas sin necesidad de NgRx.
- **Angular Material + SCSS**: Proporciona componentes accesibles (WCAG) listos para usar y un sistema de estilos personalizable.
- **RxJS**: Los flujos asíncronos se controlan con operadores (`takeUntil`, `debounceTime`, `forkJoin`, `catchError`) para peticiones cancelables y eficientes.
- **Optimización de UX**: Skeleton loaders, lazy loading de imágenes con fade-in, infinite scroll con `IntersectionObserver`, `trackBy` en listas y restauración automática de scroll.
- **Testing >80 %**: Cobertura amplia sobre servicios, componentes clave y utilidades para mitigar regresiones.

## Cómo Ejecutar y Probar

### Prerrequisitos
- Node.js 18 o superior
- npm 9 o superior

### Instalación
```bash
npm install
```

### Ejecutar en Desarrollo
```bash
npm start
# Disponible en http://localhost:4200
```

### Construir para Producción
```bash
npm run build
# Artefactos generados en dist/cocktail-app/
```

### Testing
```bash
# Tests unitarios interactivos
npm test

# Tests con cobertura (objetivo ≥80 %)
npm run test:coverage

# Modo CI/headless
npm test -- --no-watch --code-coverage
```

