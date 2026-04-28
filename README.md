# ⚠️ Zodiac Scammer

A darkly comedic single-page web application where users select their zodiac sign and an AI generates an absurdly specific cosmic "scam" the universe is plotting against them, complete with a countdown timer and shareable alert card.

## Features

- **Cosmic UI:** Deep space background with a spinning SVG zodiac wheel and beautifully gradient-styled sign selection cards.
- **AI Oracle Mock:** Simulates generating a personalized, hyper-specific scam based on canonical zodiac personality traits.
- **Emergency Alert System:** A highly polished modal designed to look like a government emergency alert overlay with sirens, bold typography, and a live countdown timer.
- **Canvas Export:** Generates an image of your scam alert using html2canvas so you can share it with friends.
- **Procedural Audio:** Web Audio API powers an ominous cosmic drone, emergency sirens, and ticking timer sound effects.
- **History Scroll:** Keeps a local record of all the scams the universe has thrown your way.

## Tech Stack

- HTML5 / CSS3 (CSS Grid, Animations, Custom Styling)
- Vanilla JavaScript (ES Modules)
- [html2canvas](https://html2canvas.hertzen.com/) for exporting the alert card
- [Vite](https://vitejs.dev/) for the development server and bundling

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the provided local URL in your browser.

## How to Play

1. Select your zodiac sign from the grid.
2. Click **"REVEAL MY SCAM ⚠️"**.
3. Read the cosmic alert and see exactly how the universe plans to scam you based on your worst traits.
4. Download your warning and dismiss the modal (at your own risk).

## License

MIT
