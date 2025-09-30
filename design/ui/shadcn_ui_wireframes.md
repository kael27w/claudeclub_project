# UI/UX Design and Wireframes Plan

**Author:** shadcn UI Designer & UX Specialist
**Date:** September 30, 2025
**Sprint Context:** 48-hour competition MVP
**Priority:** P0 - Critical Path

---

## Executive Summary

This document outlines the UI/UX design strategy for the Adaptive Travel Agent, focusing on creating an engaging, intuitive crisis management interface that showcases Claude's autonomous reasoning capabilities. The design prioritizes demo impact, emotional resonance, and clear communication of AI decision-making.

**Key Approach:** Build a crisis-focused interface that transforms anxiety into confidence through real-time visibility into AI problem-solving. Every design decision serves the goal of making autonomous AI reasoning tangible and impressive during the 5-minute competition demo.

**Critical Success Factor:** The UI must communicate urgency, intelligence, and resolution in a way that emotionally resonates with judges while remaining technically credible. Visual design should make complex AI reasoning immediately comprehensible.

---

## Design Philosophy

### Core Principles

1. **Crisis-First Design:** Interface acknowledges user stress and provides immediate calm through confident AI communication
2. **Transparency:** Make AI reasoning visible - show the "thinking" that typically happens in a black box
3. **Progressive Disclosure:** Reveal complexity gradually as the AI solves the problem
4. **Real-Time Feedback:** Every AI action has immediate visual confirmation
5. **Demo-Optimized:** Every animation, transition, and visual element designed for presentation impact

### Visual Language

**Emotional Arc:**
```
User State:     Panic → Engagement → Hope → Relief
Visual Design:  Red → Purple → Blue → Green
UI Complexity:  Simple → Complex → Organized → Simple
```

---

## Color System

### Primary Palette

```css
/* Crisis/Urgency States */
--crisis-critical: #EF4444;      /* Bright red */
--crisis-high: #F59E0B;          /* Amber */
--crisis-medium: #3B82F6;        /* Blue */
--crisis-low: #10B981;           /* Green */

/* AI States */
--ai-thinking: #8B5CF6;          /* Purple */
--ai-processing: #6366F1;        /* Indigo */
--ai-success: #10B981;           /* Green */
--ai-error: #EF4444;             /* Red */

/* Background Layers */
--bg-primary: #0F172A;           /* Slate 950 */
--bg-secondary: #1E293B;         /* Slate 900 */
--bg-tertiary: #334155;          /* Slate 700 */
--bg-card: rgba(30, 41, 59, 0.5); /* Slate 900 with opacity */

/* Text Colors */
--text-primary: #F8FAFC;         /* Slate 50 */
--text-secondary: #CBD5E1;       /* Slate 300 */
--text-tertiary: #64748B;        /* Slate 500 */

/* Accent Colors */
--accent-blue: #3B82F6;          /* Primary actions */
--accent-purple: #8B5CF6;        /* AI indicators */
--accent-green: #10B981;         /* Success states */
```

### Gradient System

```css
/* Background Gradients */
--gradient-bg: linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%);
--gradient-card: linear-gradient(180deg, rgba(51, 65, 85, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%);

/* Accent Gradients */
--gradient-ai: linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%);
--gradient-success: linear-gradient(90deg, #10B981 0%, #3B82F6 100%);
--gradient-crisis: linear-gradient(90deg, #EF4444 0%, #F59E0B 100%);
```

---

## Typography

### Font System

```typescript
// Using Inter for everything (already in Next.js)
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },

  fontSize: {
    // Display (Hero text)
    'display-xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '800' }],
    'display-lg': ['3.75rem', { lineHeight: '1.1', fontWeight: '800' }],
    'display-md': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],

    // Headings
    'h1': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
    'h2': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
    'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
    'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '600' }],

    // Body
    'body-lg': ['1.125rem', { lineHeight: '1.75', fontWeight: '400' }],
    'body-md': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
    'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],

    // UI Elements
    'button-lg': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
    'button-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
    'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
  },
};
```

---

## Component Library

### 1. Crisis Input Component

**Purpose:** Primary entry point - where users describe their crisis

**Design Specs:**

```
┌─────────────────────────────────────────────────────────────┐
│  Describe your travel crisis                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │  Example: My flight to London was cancelled due to     │  │
│  │  weather and I have an important meeting tomorrow...   │  │
│  │                                                         │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Quick examples:                                             │
│  [Flight Cancelled] [Natural Disaster] [Lost Documents]     │
│                                                              │
│  [🎤 Voice Input]           [Get Help Now →]                │
└─────────────────────────────────────────────────────────────┘
```

**Tailwind Classes:**

```typescript
<div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-2xl">
  <label className="block text-sm font-medium text-slate-300 mb-2">
    Describe your travel crisis
  </label>

  <textarea
    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-4
               text-white placeholder:text-slate-500
               focus:ring-2 focus:ring-blue-500 focus:border-transparent
               transition-all duration-200"
    rows={4}
    placeholder="Example: My flight to London was cancelled..."
  />

  <div className="flex items-center gap-2 mt-3">
    <span className="text-xs text-slate-400">Quick examples:</span>
    <button className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700
                       text-slate-300 rounded-full transition-colors">
      Flight Cancelled
    </button>
    {/* More example buttons */}
  </div>

  <div className="flex gap-3 mt-4">
    <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600
                       hover:from-blue-500 hover:to-purple-500
                       text-white font-semibold py-3 px-6 rounded-lg
                       transition-all duration-200 transform hover:scale-[1.02]
                       flex items-center justify-center gap-2">
      <span>Get Help Now</span>
      <svg>→</svg>
    </button>

    <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700
                       border border-slate-700 rounded-lg transition-colors">
      🎤
    </button>
  </div>
</div>
```

**Interactive States:**

- **Default:** Calm, inviting
- **Focus:** Blue ring glow
- **Typing:** Character count appears
- **Submitting:** Button shows spinner, textarea disabled
- **Error:** Red border pulse

---

### 2. Reasoning Chain Visualizer

**Purpose:** Show Claude's step-by-step thinking process

**Design Specs:**

```
┌─────────────────────────────────────────────────────────────┐
│  Claude is Analyzing Your Crisis                            │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  ✓  Step 1: Crisis Analysis                    [Completed]  │
│      Identified flight cancellation with critical urgency   │
│      └─ Details: AF456 cancelled, meeting in 18 hours       │
│                                                              │
│  ⟳  Step 2: Impact Assessment              [In Progress]    │
│      Evaluating affected services and options...            │
│      └─ Analyzing: Rebooking options, hotel, transport      │
│                                                              │
│  ○  Step 3: Solution Generation                 [Pending]   │
│      Creating multiple solution pathways                    │
│                                                              │
│  ○  Step 4: Solution Ranking                    [Pending]   │
│      Evaluating options against constraints                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure:**

```typescript
<div className="space-y-4">
  {steps.map((step, index) => (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        p-4 rounded-lg border-l-4 transition-all
        ${step.status === 'completed' ? 'border-green-500 bg-green-950/20' : ''}
        ${step.status === 'in_progress' ? 'border-blue-500 bg-blue-950/20' : ''}
        ${step.status === 'pending' ? 'border-slate-700 bg-slate-900/20' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {step.status === 'completed' && (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          )}
          {step.status === 'in_progress' && (
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          )}
          {step.status === 'pending' && (
            <Circle className="h-6 w-6 text-slate-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-white">
              Step {index + 1}: {step.title}
            </h3>
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              {step.status.replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm text-slate-400 mb-2">
            {step.description}
          </p>

          {/* Expandable Details */}
          {step.details && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              className="mt-2 p-3 bg-slate-800/50 rounded text-xs text-slate-300"
            >
              └─ Details: {step.details}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  ))}
</div>
```

**Animation Details:**

- Each step slides in from left with 100ms stagger
- Spinner rotates during "in_progress" state
- Checkmark animates with scale bounce on completion
- Border color transitions smoothly between states
- Details expand with height animation (not display toggle)

---

### 3. Solution Card Component

**Purpose:** Display generated solution options with clear trade-offs

**Design Specs:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⭐ RECOMMENDED                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Option 1: Express Resolution                         │  │
│  │  Get on the next available flight with hotel upgrade  │  │
│  │                                                        │  │
│  │  ⏱ Time: 2 hours          💵 Cost: $1,250             │  │
│  │                                                        │  │
│  │  ✓ Fastest solution available                         │  │
│  │  ⚠ Higher cost than alternatives                      │  │
│  │                                                        │  │
│  │  [Select This Solution]  [View Details ▼]            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Option 2: Balanced Approach                          │  │
│  │  Morning flight + economy hotel near airport          │  │
│  │                                                        │  │
│  │  ⏱ Time: 8 hours          💵 Cost: $650               │  │
│  │                                                        │  │
│  │  ✓ Good balance of cost and speed                    │  │
│  │  ⚠ Early morning departure (5 AM)                     │  │
│  │                                                        │  │
│  │  [Select This Solution]  [View Details ▼]            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Component Code:**

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className={`
    relative overflow-hidden rounded-xl border-2 transition-all duration-300
    bg-slate-900/50 backdrop-blur-xl
    ${isRecommended
      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
      : 'border-slate-800 hover:border-slate-700'
    }
  `}
>
  {/* Recommended Badge */}
  {isRecommended && (
    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600
                    text-white text-xs font-bold px-4 py-1 rounded-bl-lg rounded-tr-xl">
      ⭐ RECOMMENDED
    </div>
  )}

  <div className="p-6">
    {/* Header */}
    <div className="mb-4">
      <h3 className="text-xl font-bold text-white mb-2">
        {solution.name}
      </h3>
      <p className="text-sm text-slate-400">
        {solution.summary}
      </p>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Clock className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <div className="text-xs text-slate-400">Time</div>
          <div className="text-sm font-semibold text-white">
            {solution.timeToResolve}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <DollarSign className="h-5 w-5 text-green-400" />
        </div>
        <div>
          <div className="text-xs text-slate-400">Cost</div>
          <div className="text-sm font-semibold text-white">
            ${solution.totalCost}
          </div>
        </div>
      </div>
    </div>

    {/* Pros/Cons */}
    <div className="space-y-2 mb-4">
      <div className="flex items-start gap-2 text-sm">
        <span className="text-green-500">✓</span>
        <span className="text-green-400">{solution.pros[0]}</span>
      </div>
      <div className="flex items-start gap-2 text-sm">
        <span className="text-amber-500">⚠</span>
        <span className="text-amber-400">{solution.cons[0]}</span>
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <button className={`
        flex-1 py-3 px-4 rounded-lg font-semibold transition-all
        ${isRecommended
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
        }
      `}>
        Select This Solution
      </button>

      <button className="px-4 py-3 bg-slate-800 hover:bg-slate-700
                         border border-slate-700 rounded-lg transition-colors">
        View Details ▼
      </button>
    </div>
  </div>
</motion.div>
```

**Interaction States:**

- **Hover:** Border glow intensifies, slight scale up (1.02)
- **Selected:** Persistent glow, checkmark animation
- **Expanding:** Details slide down with height animation
- **Loading:** Skeleton shimmer effect

---

### 4. Execution Progress Display

**Purpose:** Show real-time solution execution with step updates

**Design Specs:**

```
┌─────────────────────────────────────────────────────────────┐
│  Executing Your Solution                                    │
│  ═══════════════════════════════════ 75%                   │
│                                                              │
│  ✓  Contacted airline for rebooking        [2 min ago]      │
│  ✓  Secured seat on AF458 (6:30 AM)        [1 min ago]      │
│  ✓  Booked airport hotel for tonight       [30 sec ago]     │
│  ⟳  Arranging airport transfer             [In Progress]    │
│  ○  Sending confirmation emails             [Pending]        │
│                                                              │
│  Estimated completion: 2 minutes                             │
└─────────────────────────────────────────────────────────────┘
```

**Component Code:**

```typescript
<div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
  {/* Header */}
  <h2 className="text-2xl font-bold text-white mb-4">
    Executing Your Solution
  </h2>

  {/* Progress Bar */}
  <div className="mb-6">
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
        className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
      />
    </div>
    <div className="text-right text-sm text-slate-400 mt-1">
      {progress}%
    </div>
  </div>

  {/* Execution Steps */}
  <div className="space-y-3">
    {executionSteps.map((step, index) => (
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
      >
        <div className="flex items-center gap-3">
          {step.status === 'completed' && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          {step.status === 'in_progress' && (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          )}
          {step.status === 'pending' && (
            <Circle className="h-5 w-5 text-slate-600" />
          )}

          <span className={`text-sm ${
            step.status === 'completed' ? 'text-slate-300' : 'text-slate-400'
          }`}>
            {step.description}
          </span>
        </div>

        <span className="text-xs text-slate-500">
          {step.timestamp}
        </span>
      </motion.div>
    ))}
  </div>

  {/* Estimated Completion */}
  <div className="mt-6 p-4 bg-blue-950/20 border border-blue-800 rounded-lg">
    <p className="text-sm text-blue-300">
      ⏱ Estimated completion: {estimatedTime}
    </p>
  </div>
</div>
```

---

## Page Layouts

### Landing/Crisis Input Page

**Layout Structure:**

```
┌───────────────────────────────────────────────────────────────┐
│  Header: Logo + Demo Mode Toggle                              │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│              [Hero Section - Gradient Background]              │
│                                                                │
│         Travel Crisis? We'll Handle It Autonomously            │
│    Powered by Claude 4.5 - Crisis resolution in minutes       │
│                                                                │
│                    [Crisis Input Component]                    │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│                 [Trust Indicators Section]                     │
│  • 24/7 Autonomous AI    • Multi-step Reasoning              │
│  • Real-time Updates     • Multiple Solutions                │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Active Crisis Resolution Page

**Layout Structure:**

```
┌───────────────────────────────────────────────────────────────┐
│  Header: Logo + Crisis ID + Status                            │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│              [Status Display - Left Column]                    │
│  ┌────────────────────────────────┐                          │
│  │  Claude is Analyzing...        │                          │
│  │  Step 1: ✓                     │                          │
│  │  Step 2: ⟳                     │                          │
│  │  Step 3: ○                     │                          │
│  └────────────────────────────────┘                          │
│                                                                │
│              [Solutions - Right Column]                        │
│  ┌────────────────────────────────┐                          │
│  │  Solution 1: Express           │                          │
│  │  Cost: $1,250 | Time: 2hrs     │                          │
│  │  [Select]      [Details]       │                          │
│  └────────────────────────────────┘                          │
│                                                                │
│  ┌────────────────────────────────┐                          │
│  │  Solution 2: Balanced          │                          │
│  │  Cost: $650 | Time: 8hrs       │                          │
│  │  [Select]      [Details]       │                          │
│  └────────────────────────────────┘                          │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

### Mobile (320px - 767px)

- Single column layout
- Stacked components
- Full-width cards
- Simplified navigation
- Touch-optimized buttons (min 44x44px)

### Tablet (768px - 1023px)

- Two-column grid for solutions
- Collapsible sidebar for status
- Medium-sized cards
- Responsive typography scaling

### Desktop (1024px+)

- Multi-column layout
- Fixed sidebar for status
- Grid layout for solutions
- Full feature set visible

---

## Animation Library

### Entry Animations

```typescript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: 'easeOut' }
};
```

### Loading States

```typescript
// Spinner
<Loader2 className="animate-spin" />

// Pulse
<div className="animate-pulse bg-slate-800 h-4 rounded" />

// Progress bar
<motion.div
  animate={{ x: ['-100%', '100%'] }}
  transition={{ repeat: Infinity, duration: 1.5 }}
  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
/>
```

### Success Animations

```typescript
// Checkmark with bounce
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
>
  <CheckCircle2 className="text-green-500" />
</motion.div>

// Confetti (using canvas-confetti library)
confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 }
});
```

---

## Accessibility Considerations

### WCAG 2.1 AA Compliance

1. **Color Contrast:**
   - All text meets 4.5:1 minimum
   - Large text (18pt+) meets 3:1 minimum
   - Interactive elements meet 3:1 minimum

2. **Keyboard Navigation:**
   - All interactive elements focusable
   - Visual focus indicators (ring-2 ring-blue-500)
   - Logical tab order
   - Escape key closes modals

3. **Screen Readers:**
   - Proper semantic HTML
   - ARIA labels for icons
   - Status announcements for loading states
   - Alt text for images

4. **Motion:**
   - Respect `prefers-reduced-motion`
   - Disable animations for users with motion sensitivity

```typescript
// Tailwind configuration
const reducedMotion = '@media (prefers-reduced-motion: reduce)';

// Usage in components
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: useReducedMotion ? 0 : 0.4 }}
>
```

---

## Implementation Timeline

**Hour 8:** Base component structure
**Hour 9:** Crisis input component
**Hour 10:** Reasoning chain visualizer
**Hour 11:** Solution cards
**Hour 12:** Execution progress display
**Hour 13:** Responsive layout
**Hour 14:** Animation polish
**Hour 15:** Accessibility audit

---

## Success Criteria

- [ ] All components render without errors
- [ ] Animations smooth at 60fps
- [ ] Mobile responsive (320px+)
- [ ] WCAG 2.1 AA compliant
- [ ] Demo flows feel polished and professional
- [ ] "Wow moments" clearly identified
- [ ] Zero layout shift (CLS < 0.1)
- [ ] Loading states never show empty UI

---

## Conclusion

This UI design creates an emotional journey from crisis to resolution, making Claude's autonomous reasoning tangible and impressive. Every visual element serves the dual purpose of user experience and demo impact.
