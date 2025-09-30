# Next.js 14 Frontend Architecture Plan

**Author:** Next.js Architecture Expert
**Date:** September 30, 2025
**Sprint Context:** 48-hour competition MVP
**Priority:** P0 - Critical Path

---

## Executive Summary

This document outlines the frontend architecture for the Adaptive Travel Agent using Next.js 14 with App Router, React Server Components, and modern state management patterns. The architecture is optimized for rapid development while delivering a polished, production-ready demo experience.

**Key Approach:** Leverage Next.js 14's App Router and Server Components for optimal performance, combined with client-side interactivity for real-time crisis management. Focus on component modularity, type safety, and animations that showcase AI reasoning.

**Critical Success Factor:** Build a UI that makes Claude's autonomous reasoning visible and impressive during demos. Every interaction should feel responsive, intelligent, and polished.

---

## Technical Approach Overview

### Architecture Philosophy

**Principles:**
1. **Server-First by Default:** Use React Server Components for static content
2. **Client When Needed:** Client components only for interactivity
3. **Progressive Enhancement:** Core functionality works without JavaScript
4. **Real-Time UX:** WebSocket integration for live updates
5. **Demo-Optimized:** Every animation and transition designed for wow-factor

### Technology Stack

```yaml
Core Framework:
  - Next.js 14.2+ (App Router)
  - React 18+ (with Server Components)
  - TypeScript 5.0+

Styling:
  - Tailwind CSS 3.4+
  - Framer Motion 11+ (animations)
  - Lucide React (icons)

State Management:
  - React Query (TanStack Query v5)
  - Zustand (lightweight global state)
  - Native React hooks

Real-Time:
  - Socket.io Client
  - Server-Sent Events (SSE)

UI Components:
  - Radix UI (accessible primitives)
  - Custom components built on Radix
```

---

## Detailed Implementation Breakdown

### Phase 1: Project Structure (Hours 0-2)

```
app/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Main crisis management interface
├── globals.css                # Global styles and Tailwind imports
├── providers.tsx              # Client-side provider wrapper
│
├── api/                       # API routes (Next.js backend)
│   ├── crisis/
│   │   ├── analyze/route.ts
│   │   ├── solve/route.ts
│   │   └── execute/route.ts
│   └── socket/route.ts
│
├── components/                # Shared components
│   ├── crisis/               # Crisis-specific components
│   │   ├── CrisisInput.tsx
│   │   ├── StatusDisplay.tsx
│   │   ├── SolutionCard.tsx
│   │   └── ReasoningChain.tsx
│   │
│   ├── ui/                   # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast.tsx
│   │
│   └── layout/               # Layout components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Container.tsx
│
├── hooks/                    # Custom React hooks
│   ├── useCrisisAnalysis.ts
│   ├── useSolutionGeneration.ts
│   ├── useRealtimeUpdates.ts
│   └── useDemoMode.ts
│
└── lib/                      # Utilities and helpers
    ├── api-client.ts         # API client wrapper
    ├── types.ts              # TypeScript types
    ├── utils.ts              # Utility functions
    └── constants.ts          # App constants
```

---

### Phase 2: Core Layout Structure (Hours 2-3)

**File:** `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Adaptive Travel Agent - Autonomous Crisis Management',
  description: 'AI-powered travel crisis resolution with Claude 4.5',
  openGraph: {
    title: 'Adaptive Travel Agent',
    description: '24/7 AI travel crisis management',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
```

**File:** `app/providers.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SocketProvider } from '@/hooks/useRealtimeUpdates';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        {children}
      </SocketProvider>
    </QueryClientProvider>
  );
}
```

---

### Phase 3: Main Crisis Interface (Hours 8-10)

**File:** `app/page.tsx`

```typescript
import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { CrisisInput } from '@/components/crisis/CrisisInput';
import { StatusDisplay } from '@/components/crisis/StatusDisplay';
import { SolutionGrid } from '@/components/crisis/SolutionGrid';
import { DemoController } from '@/components/demo/DemoController';
import { Container } from '@/components/layout/Container';

export default function CrisisManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <Header />

      <main className="py-8 md:py-12">
        <Container>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Travel Crisis?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                We'll Handle It
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Powered by Claude 4.5 - Autonomous crisis resolution in minutes, not hours
            </p>
          </div>

          {/* Crisis Input */}
          <section className="mb-8">
            <CrisisInput />
          </section>

          {/* Real-time Status */}
          <Suspense fallback={<StatusSkeleton />}>
            <section className="mb-8">
              <StatusDisplay />
            </section>
          </Suspense>

          {/* Solution Options */}
          <Suspense fallback={<SolutionsSkeleton />}>
            <section>
              <SolutionGrid />
            </section>
          </Suspense>
        </Container>
      </main>

      {/* Demo Mode Controller (hidden in production) */}
      {process.env.NODE_ENV === 'development' && <DemoController />}
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Skeleton UI */}
    </div>
  );
}

function SolutionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Skeleton cards */}
    </div>
  );
}
```

---

### Phase 4: Crisis Input Component (Hours 10-11)

**File:** `components/crisis/CrisisInput.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Send, Mic } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useCrisisStore } from '@/stores/crisis-store';
import { motion } from 'framer-motion';

const EXAMPLE_CRISES = [
  {
    label: 'Flight Cancelled',
    text: 'My flight FR423 to Paris just got cancelled and I have a final exam tomorrow at 2PM',
  },
  {
    label: 'Natural Disaster',
    text: 'Typhoon warning in Tokyo, all trains stopped, my flight is tomorrow',
  },
  {
    label: 'Lost Documents',
    text: 'My passport was stolen in Bangkok, I need to fly home in 3 days',
  },
];

export function CrisisInput() {
  const [input, setInput] = useState('');
  const { startAnalysis, setStatus } = useCrisisStore();

  const analyzeMutation = useMutation({
    mutationFn: async (crisisText: string) => {
      const response = await fetch('/api/crisis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crisis: crisisText }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    onSuccess: (data) => {
      startAnalysis(data);
      setStatus('analyzing');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      analyzeMutation.mutate(input);
    }
  };

  const handleExampleClick = (exampleText: string) => {
    setInput(exampleText);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="crisis-input"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Describe your travel crisis
          </label>

          <Textarea
            id="crisis-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: My flight to London was cancelled due to weather and I have an important meeting tomorrow morning..."
            rows={4}
            className="w-full bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
            disabled={analyzeMutation.isPending}
          />
        </div>

        {/* Example Crisis Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 mr-2">Quick examples:</span>
          {EXAMPLE_CRISES.map((example) => (
            <Button
              key={example.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExampleClick(example.text)}
              disabled={analyzeMutation.isPending}
            >
              {example.label}
            </Button>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1"
            disabled={!input.trim() || analyzeMutation.isPending}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Crisis...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Get Help Now
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={analyzeMutation.isPending}
            title="Voice input (coming soon)"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
```

---

### Phase 5: Real-Time Status Display (Hours 11-12)

**File:** `components/crisis/StatusDisplay.tsx`

```typescript
'use client';

import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useCrisisStore } from '@/stores/crisis-store';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function StatusDisplay() {
  const { status, reasoningSteps } = useCrisisStore();
  const updates = useRealtimeUpdates();

  if (status === 'idle') {
    return null;
  }

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          {status === 'analyzing' && 'Analyzing Your Crisis'}
          {status === 'generating_solutions' && 'Generating Solutions'}
          {status === 'executing' && 'Resolving Crisis'}
          {status === 'completed' && 'Crisis Resolved'}
        </h2>

        {/* Reasoning Steps */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {reasoningSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50"
              >
                {/* Step Icon */}
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'completed' && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                  {step.status === 'in_progress' && (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  )}
                  {step.status === 'error' && (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {step.description}
                  </p>

                  {/* Step Details (if any) */}
                  {step.details && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-2 p-3 rounded bg-slate-700/50 text-xs text-slate-300"
                    >
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(step.details, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </div>

                {/* Step Timing */}
                <div className="flex-shrink-0 text-xs text-slate-500">
                  {step.timestamp && (
                    <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Claude Thinking Indicator */}
        {status === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center gap-2 text-sm text-slate-400"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Claude is thinking...</span>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
```

---

### Phase 6: Solution Cards (Hours 12-13)

**File:** `components/crisis/SolutionCard.tsx`

```typescript
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, CheckCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { SolutionPlan } from '@/lib/types';

interface SolutionCardProps {
  solution: SolutionPlan;
  index: number;
  onSelect: (solution: SolutionPlan) => void;
  isRecommended?: boolean;
}

export function SolutionCard({
  solution,
  index,
  onSelect,
  isRecommended
}: SolutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={`
          relative overflow-hidden bg-slate-900/50 backdrop-blur-xl
          border-2 transition-all duration-300
          ${isRecommended ? 'border-blue-500' : 'border-slate-800'}
          hover:border-blue-400
        `}
      >
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute top-0 right-0">
            <Badge variant="success" className="rounded-bl-lg rounded-tr-xl">
              Recommended
            </Badge>
          </div>
        )}

        <div className="p-6">
          {/* Solution Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">
              {solution.name}
            </h3>
            <p className="text-sm text-slate-400">
              {solution.summary}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-xs text-slate-400">Time</div>
                <div className="text-sm font-semibold text-white">
                  {solution.timeToResolve}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <div className="text-xs text-slate-400">Cost</div>
                <div className="text-sm font-semibold text-white">
                  ${solution.totalCost}
                </div>
              </div>
            </div>
          </div>

          {/* Pros/Cons */}
          <div className="mb-4 space-y-2">
            <div className="text-xs text-green-400">
              ✓ {solution.pros[0]}
            </div>
            <div className="text-xs text-amber-400">
              ⚠ {solution.cons[0]}
            </div>
          </div>

          {/* Expandable Details */}
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">
                  Execution Steps:
                </h4>
                <ol className="space-y-1">
                  {solution.steps.map((step, i) => (
                    <li key={i} className="text-xs text-slate-400">
                      {i + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-2">
                  Cost Breakdown:
                </h4>
                <div className="space-y-1">
                  {solution.costBreakdown.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs text-slate-400"
                    >
                      <span>{item.category}</span>
                      <span>${item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => onSelect(solution)}
              className="flex-1"
              variant={isRecommended ? 'default' : 'outline'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Select Solution
            </Button>

            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="icon"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
```

---

## State Management Strategy

### Global State (Zustand)

**File:** `stores/crisis-store.ts`

```typescript
import { create } from 'zustand';
import type { CrisisContext, SolutionPlan, ReasoningStep } from '@/lib/types';

interface CrisisStore {
  // State
  status: 'idle' | 'analyzing' | 'generating_solutions' | 'executing' | 'completed';
  crisis: CrisisContext | null;
  solutions: SolutionPlan[];
  selectedSolution: SolutionPlan | null;
  reasoningSteps: ReasoningStep[];

  // Actions
  startAnalysis: (crisis: CrisisContext) => void;
  setStatus: (status: CrisisStore['status']) => void;
  setSolutions: (solutions: SolutionPlan[]) => void;
  selectSolution: (solution: SolutionPlan) => void;
  addReasoningStep: (step: ReasoningStep) => void;
  reset: () => void;
}

export const useCrisisStore = create<CrisisStore>((set) => ({
  status: 'idle',
  crisis: null,
  solutions: [],
  selectedSolution: null,
  reasoningSteps: [],

  startAnalysis: (crisis) => set({
    crisis,
    status: 'analyzing',
    reasoningSteps: []
  }),

  setStatus: (status) => set({ status }),

  setSolutions: (solutions) => set({
    solutions,
    status: 'generating_solutions'
  }),

  selectSolution: (solution) => set({
    selectedSolution: solution,
    status: 'executing'
  }),

  addReasoningStep: (step) => set((state) => ({
    reasoningSteps: [...state.reasoningSteps, step]
  })),

  reset: () => set({
    status: 'idle',
    crisis: null,
    solutions: [],
    selectedSolution: null,
    reasoningSteps: []
  }),
}));
```

---

## Real-Time Updates Implementation

**File:** `hooks/useRealtimeUpdates.ts`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCrisisStore } from '@/stores/crisis-store';

export function useRealtimeUpdates() {
  const socketRef = useRef<Socket | null>(null);
  const { addReasoningStep, setStatus } = useCrisisStore();

  useEffect(() => {
    // Initialize Socket.io connection
    socketRef.current = io({
      path: '/api/socket',
    });

    const socket = socketRef.current;

    // Listen for reasoning step updates
    socket.on('reasoning_step', (step) => {
      addReasoningStep(step);
    });

    // Listen for status changes
    socket.on('status_change', (status) => {
      setStatus(status);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [addReasoningStep, setStatus]);

  return socketRef.current;
}

// Provider component for socket context
export function SocketProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

---

## Responsive Design Strategy

### Breakpoint System

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: '640px',   // Mobile landscape
      md: '768px',   // Tablet
      lg: '1024px',  // Desktop
      xl: '1280px',  // Large desktop
      '2xl': '1536px', // Ultra-wide
    },
  },
};
```

### Mobile-First Approach

- Default styles target mobile (320px+)
- Use `md:` prefix for tablet optimizations
- Use `lg:` prefix for desktop enhancements
- Test on iPhone SE, iPad, and desktop sizes

---

## Animation Strategy

### Key Animation Patterns

1. **Entry Animations:** Fade-in with slide-up (20px)
2. **Exit Animations:** Fade-out with slide-right (20px)
3. **Loading States:** Spin animation for loaders
4. **Success States:** Scale pulse + confetti
5. **Transitions:** 300ms ease-in-out for all

### Performance Considerations

- Use `will-change` sparingly
- Leverage `transform` and `opacity` (GPU-accelerated)
- Avoid animating `height` directly (use `max-height`)
- Use `AnimatePresence` for unmount animations

---

## Dependencies and Integration Points

### External API Integration

```typescript
// lib/api-client.ts
export const apiClient = {
  analyzeCrisis: async (crisis: string) => {
    const response = await fetch('/api/crisis/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crisis }),
    });
    return response.json();
  },

  generateSolutions: async (crisisId: string) => {
    const response = await fetch('/api/crisis/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crisisId }),
    });
    return response.json();
  },
};
```

### Backend API Routes

- `POST /api/crisis/analyze` - Analyze crisis input
- `POST /api/crisis/solve` - Generate solutions
- `POST /api/crisis/execute` - Execute selected solution
- `GET /api/socket` - WebSocket endpoint

---

## Risks and Mitigation Strategies

### Risk 1: Real-Time Connection Failures
**Impact:** High - No live updates breaks core UX
**Mitigation:**
- Implement polling fallback if WebSocket fails
- Show clear connection status indicator
- Cache last known state locally

### Risk 2: Animation Performance on Low-End Devices
**Impact:** Medium - Janky animations hurt demo
**Mitigation:**
- Use `prefers-reduced-motion` media query
- Simplify animations on mobile
- Test on older devices

### Risk 3: Large Bundle Size
**Impact:** Medium - Slow initial load
**Mitigation:**
- Lazy load heavy components
- Use dynamic imports for animations
- Optimize Tailwind CSS with purge

### Risk 4: TypeScript Type Safety Issues
**Impact:** Low - Catches bugs early
**Mitigation:**
- Strict TypeScript config
- Zod for runtime validation
- Comprehensive type definitions

---

## Testing and Validation Strategies

### Component Testing

```typescript
// components/crisis/CrisisInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CrisisInput } from './CrisisInput';

describe('CrisisInput', () => {
  it('should submit crisis description', async () => {
    render(<CrisisInput />);

    const textarea = screen.getByPlaceholderText(/describe your travel crisis/i);
    fireEvent.change(textarea, { target: { value: 'Flight cancelled' } });

    const submitButton = screen.getByRole('button', { name: /get help now/i });
    fireEvent.click(submitButton);

    expect(textarea).toBeDisabled();
  });
});
```

### Visual Regression Testing

- Use Playwright for screenshot comparisons
- Test critical user flows
- Validate responsive layouts

---

## Success Criteria

- [ ] Page loads in <2 seconds on 3G
- [ ] Lighthouse performance score >90
- [ ] All components TypeScript-typed
- [ ] Mobile responsive (320px - 1920px)
- [ ] Real-time updates <100ms latency
- [ ] Animations smooth at 60fps
- [ ] Zero console errors in production
- [ ] Accessible (WCAG 2.1 AA)

---

## Implementation Timeline

**Hours 8-9:** Layout and routing
**Hours 9-10:** Core components structure
**Hours 10-11:** Crisis input interface
**Hours 11-12:** Status display with animations
**Hours 12-13:** Solution cards
**Hours 13-14:** Real-time integration
**Hours 14-15:** Polish and responsive design

---

## Key Architectural Decisions

**Decision 1:** App Router over Pages Router
**Rationale:** Better performance, simpler data fetching, future-proof

**Decision 2:** Zustand over Context API
**Rationale:** Simpler, better performance, easier debugging

**Decision 3:** Framer Motion for animations
**Rationale:** Declarative API, great performance, rich features

**Decision 4:** Socket.io over SSE
**Rationale:** Better browser support, bidirectional communication

---

## Conclusion

This Next.js architecture prioritizes rapid development velocity while maintaining production-quality code. The modular component structure allows parallel development, and the demo-first approach ensures impressive visual presentation.
