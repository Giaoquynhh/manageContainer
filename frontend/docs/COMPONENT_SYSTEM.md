# Component System - Depot Management System

## 🎯 Tổng quan

Hệ thống component được thiết kế theo nguyên tắc **atomic design** và **design system** để đảm bảo tính nhất quán, tái sử dụng và bảo trì dễ dàng.

## 📁 Cấu trúc

```
components/
├── index.ts                    # Export tất cả components
├── layout/                     # Layout components
│   └── PageLayout.tsx         # Page wrapper layout
├── ui/                        # Basic UI components
│   ├── Badge.tsx             # Status badges
│   └── LoadingSpinner.tsx    # Loading states
├── Button.tsx                # Enhanced button component
├── Card.tsx                  # Card container component  
├── Header.tsx                # Main navigation header
├── Modal.tsx                 # Modal dialog component
└── SearchBar.tsx             # Search input component
```

## 🧩 Component Categories

### 1. Layout Components
**Mục đích:** Cung cấp structure và layout cho pages

- `PageLayout` - Wrapper cho pages với header/content structure

### 2. UI Components  
**Mục đích:** Basic building blocks, atomic components

- `Button` - Buttons với variants và states
- `Badge` - Status indicators và labels
- `LoadingSpinner` - Loading states
- `Modal` - Dialog overlays
- `Card` - Content containers

### 3. Feature Components
**Mục đích:** Specific functionality components

- `Header` - Navigation header với sidebar
- `SearchBar` - Search input với filters

## 🎨 Design Principles

### 1. Consistency
- Tất cả components sử dụng design tokens từ `theme.ts`
- Consistent naming conventions
- Uniform prop interfaces

### 2. Flexibility
- Variant system cho different styles
- Size options (sm, md, lg)
- Customizable through props

### 3. Accessibility
- ARIA labels và roles
- Keyboard navigation support
- Screen reader friendly

### 4. Performance
- Lazy loading khi cần thiết
- Minimal re-renders
- Optimized CSS classes

## 📋 Usage Guidelines

### Import Components
```typescript
// Single import
import Button from '@/components/Button';

// Multiple imports
import { Button, Card, Modal } from '@/components';
```

### Prop Conventions
```typescript
// Size variants
size?: 'sm' | 'md' | 'lg'

// Style variants  
variant?: 'primary' | 'secondary' | 'success' | 'danger'

// States
loading?: boolean
disabled?: boolean

// Customization
className?: string
```

### Example Usage
```tsx
import { PageLayout, Card, Button, Badge } from '@/components';

function ContainerPage() {
  return (
    <PageLayout 
      title="Container Management"
      actions={<Button variant="primary">Add New</Button>}
    >
      <Card title="Container List" padding="lg">
        <Badge variant="success">Active</Badge>
        <p>Container content here...</p>
      </Card>
    </PageLayout>
  );
}
```

## 🔧 Development Guidelines

### Creating New Components

1. **File Naming:** PascalCase (e.g., `MyComponent.tsx`)
2. **Props Interface:** Always define TypeScript interface
3. **Default Props:** Use default parameters in function signature
4. **CSS Classes:** Use BEM-like naming with component prefix

### Component Template
```tsx
import { ReactNode } from 'react';

interface MyComponentProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function MyComponent({
  children,
  variant = 'primary',
  size = 'md', 
  className = ''
}: MyComponentProps) {
  const classes = [
    'my-component',
    `my-component-${variant}`,
    `my-component-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
```

### CSS Guidelines
```css
/* Component base */
.my-component {
  /* Base styles using design tokens */
  padding: var(--space-4);
  border-radius: var(--radius-md);
  transition: var(--transition-default);
}

/* Variants */
.my-component-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

/* Sizes */
.my-component-sm {
  padding: var(--space-2);
  font-size: var(--font-size-sm);
}
```

## 📱 Responsive Design

### Breakpoint Strategy
- **Mobile First:** Start with mobile styles
- **Progressive Enhancement:** Add desktop features
- **Flexible Components:** Adapt to container size

### Responsive Props
```tsx
// Hide on mobile
<Component className="hidden-mobile" />

// Different sizes per breakpoint  
<Component 
  size={{ mobile: 'sm', tablet: 'md', desktop: 'lg' }}
/>
```

## 🧪 Testing Guidelines

### Component Testing
```tsx
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('renders button with correct variant', () => {
  render(<Button variant="primary">Click me</Button>);
  
  const button = screen.getByRole('button', { name: /click me/i });
  expect(button).toHaveClass('btn-primary');
});
```

### Visual Testing
- Test all variants và sizes
- Test responsive behavior
- Test accessibility features

## 🚀 Performance Tips

### Optimization Strategies
1. **Lazy Loading:** Sử dụng dynamic imports cho large components
2. **Memoization:** React.memo cho expensive components
3. **CSS Optimization:** Avoid inline styles, use CSS classes
4. **Bundle Splitting:** Separate vendor và app code

### Example Lazy Loading
```tsx
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## 🔄 Migration Guide

### Upgrading Components
1. **Backup:** Tạo backup của component cũ
2. **Props Mapping:** Map old props sang new interface
3. **CSS Update:** Update CSS classes theo new system
4. **Testing:** Test thoroughly trên all use cases

### Breaking Changes
- Document tất cả breaking changes
- Provide migration scripts nếu cần
- Support old components trong transition period

## 📚 Resources

### Design System
- [Theme Tokens](./styles/theme.ts)
- [CSS Variables](./styles/globals.css)
- [UI Guidelines](./UI_REFACTOR_DOCUMENTATION.md)

### External Libraries
- **Icons:** Sử dụng SVG inline hoặc icon library
- **Animations:** CSS transitions, Framer Motion cho complex animations
- **Utilities:** clsx cho conditional classes

## 🤝 Contributing

### Code Review Checklist
- [ ] Props interface documented
- [ ] Default props provided
- [ ] CSS classes follow naming convention
- [ ] Responsive behavior tested
- [ ] Accessibility features included
- [ ] Performance optimized

### Pull Request Template
```markdown
## Component Changes
- [ ] New component added
- [ ] Existing component updated
- [ ] Breaking changes documented
- [ ] Tests added/updated
- [ ] Documentation updated
```

---

*Tài liệu được cập nhật lần cuối: $(date)*  
*Version: 1.0.0*





