## 2026-10-16 - DOM XSS in Client-Side Template Rendering
**Vulnerability:** Dynamic properties (lesson titles, module names, descriptions, tool names) fetched from backend or local storage were directly injected into DOM elements via innerHTML string template interpolation in `renderRecent`, `renderCurriculum`, `renderChecklist`, and `renderToolChips`.
**Learning:** Pure client-side JS applications without modern reactive framework escaping (like React or Vue) are susceptible to XSS when constructing HTML strings using template literals.
**Prevention:** Always escape standard HTML entity characters (`&`, `<`, `>`, `"`, `'`) using an `escapeHTML` helper function before embedding untrusted or dynamic strings into `innerHTML` markup.
