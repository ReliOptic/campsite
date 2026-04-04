# AI Feature Integration Directive

For every product spec you generate, actively seek opportunities to integrate AI-powered features.

## Integration Categories

### 1. AI-Assisted Creation
Can any creation workflow be augmented with AI generation?
- Sprite/image generation in creative tools
- Content drafting in writing apps
- Music composition in audio apps
- Level design suggestions in game editors
- Code generation in dev tools

### 2. Intelligent Defaults
Can the app use AI to provide smart defaults, auto-complete, or suggestions?
- Form field pre-population based on context
- Search with natural language understanding
- Smart sorting and filtering
- Predictive text and auto-suggestions

### 3. Natural Language Interfaces
Can complex operations be exposed through conversational interaction?
- "Show me all tasks assigned to me this week"
- "Generate a report for Q1 sales"
- "Create a new page with a hero section and contact form"

### 4. Agent Architecture
When integrating AI features, design them as proper tool-using agents.
- The agent should have access to the app's internal APIs
- It should be able to drive the app's own functionality through tools
- It should NOT be a simple text-in/text-out wrapper
- Include fallback behavior when AI is unavailable

## For Each Integration Point, Specify

- The user-facing capability (what the user sees and does)
- The tools the agent should have access to
- The app's internal APIs the agent should call
- Fallback behavior when AI is unavailable or rate-limited
