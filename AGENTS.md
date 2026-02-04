## Project Summary
A comprehensive IELTS practice platform for Bangladeshi students, featuring mock tests for all modules (Reading, Listening, Writing, Speaking) with AI-powered feedback and real-time performance tracking.

## Tech Stack
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- UI Components: Shadcn UI, Lucide React, Sonner
- Database/Auth: Supabase
- Animation: GSAP
- AI: Groq (Llama 3.3) for writing evaluation
- **Rich Text Editor**: TipTap v3 (for passage editing with tables, images, formatting, heading gaps)

## Architecture
- `src/app`: Application routes and pages
- `src/components`: Reusable UI components
- `src/components/CDIAdminEditor.tsx`: Complex visual editor for IELTS tests
- `src/components/PassageEditor.tsx`: TipTap-based rich text editor with heading gap support
- `src/components/StudentPassageViewer.tsx`: Reusable component for student exam/preview view with drag & drop
- `src/lib/supabase`: Supabase client and helpers

## User Preferences
- No comments in code unless requested.
- Use functional components.
- Prefer clean, distinctive UI with high-quality typography.

## Project Guidelines
- **Rich Text Editor**: Use TipTap v3 for rich text editing instead of contentEditable. TipTap handles all rendering, selection persistence, and content updates internally.
- **TipTap Extensions**: Create custom Node extensions using `Node.create()` with `ReactNodeViewRenderer` for interactive elements like gaps.
- **Drag & Drop**: Use native HTML5 Drag and Drop for simple interactions, ensuring `preventDefault` on `dragOver` and `dragEnter`.
- **Orphan Sync**: Use a sufficient debounce (e.g., 2000ms) for synchronizing questions with passage tags to avoid accidental deletion during typing.
- **Reusable Viewer Components**: The `StudentPassageViewer` component should be used for both admin preview and student exam interfaces.

## Common Patterns
- **TipTap Custom Nodes**: Use `Node.create()` with `addNodeView()` returning `ReactNodeViewRenderer` for interactive inline elements.
- **Roman Numeral Conversion**: Utility `toRoman` used for labeling headings and gaps.
- **useStudentAnswers Hook**: Custom hook in `StudentPassageViewer.tsx` for managing student answers state.
