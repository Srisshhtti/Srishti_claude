# Srishti_claude

A frontend prototype for a **Government of India sustainable development scheme** that helps citizens:

- Track daily carbon emissions
- Record positive environmental contributions
- Monitor progress against monthly sustainability targets

## Run locally

No build setup is required.

1. Open `index.html` directly in a browser, or
2. Serve the folder with a static server:
   - Python: `python3 -m http.server 8000`
   - Then open `http://localhost:8000`

## Features

- Citizen profile section with city and monthly carbon target
- Carbon activity logger with category-based emission calculation
- Contribution logger for trees planted, cycling, and waste recycled
- Monthly dashboard cards for emissions, savings, and progress score
- History table with local persistence (`localStorage`)
