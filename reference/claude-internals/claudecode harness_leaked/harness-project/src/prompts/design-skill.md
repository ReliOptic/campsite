# Frontend Design Skill

## Design Principles

### Visual Hierarchy
- Primary actions must be immediately visible (size, color, position)
- Information density should match the app's purpose (data-heavy = denser, consumer = spacious)
- Use whitespace as a design element, not just padding

### Color Theory
- Start with one primary color and derive the palette from it
- Use color functionally: status, emphasis, navigation, not decoration
- Ensure WCAG AA contrast ratios (4.5:1 for text, 3:1 for large text)
- Dark mode is not "invert colors." It requires its own palette with adjusted saturation

### Typography
- Maximum 2 font families (1 heading, 1 body)
- Establish a clear type scale (e.g., 12/14/16/20/24/32/40)
- Line height: 1.4-1.6 for body, 1.1-1.3 for headings
- Never use font-weight as the only differentiator

### Spacing System
- Use a consistent base unit (4px or 8px grid)
- Component internal padding should follow a predictable pattern
- Section spacing should create clear visual grouping

### Component Composition
- Every component should look like it belongs to the same family
- Border radius, shadow depth, and padding should be consistent across components
- Interactive elements need visible hover, focus, and active states

## Anti-Slop Patterns (AI Generation Detection)

These patterns are telltale signs of AI-generated UI. Avoid them:

- **Purple gradients over white cards.** The single most common AI default.
- **Unmodified stock components.** Tailwind UI, shadcn/ui, or Material defaults without customization.
- **Template layouts.** Hero + 3-column features + testimonials + CTA footer.
- **Excessive shadows.** Multiple elevation levels on every component.
- **Generic icons.** Heroicons or Lucide defaults without intentional selection.
- **Placeholder-quality copy.** "Lorem ipsum" or obviously AI-generated marketing text.
- **Symmetry obsession.** Real designs use intentional asymmetry for visual interest.

## Design Language Generation

When creating a design language for an app:

1. **Start from the app's purpose.** A music app feels different from a project manager.
2. **Choose a mood.** Professional, playful, minimal, bold, warm, technical.
3. **Derive the palette from the mood.** Not the other way around.
4. **Select typography that reinforces the mood.** Geometric sans for technical, humanist for warm.
5. **Define component tokens.** Border radius, shadow levels, transition speeds.
6. **Create one "signature" element.** Something that makes this app recognizable.

## Accessibility Minimums

- All interactive elements keyboard-accessible
- All images have alt text (decorative images: alt="")
- Form inputs have visible labels (not just placeholders)
- Focus indicators visible on all interactive elements
- Color is never the only indicator of state
