# SEO Toolkit Pro

## Analisi AI: ora solo Gemini 2.5 Pro (Google AI)

Tutte le funzionalità di analisi AI (tool 3, tool 4, tool 5, chat, ecc.) ora utilizzano **Gemini 2.5 Pro** tramite [Genkit](https://github.com/genkit-dev/genkit) e GoogleAI. Non è più necessario fornire una chiave API OpenAI.

### Requisiti per l'AI
- **Google API Key**: ottieni la tua chiave su [Google AI Studio](https://makersuite.google.com/app/apikey)
- Imposta la variabile d'ambiente `GOOGLE_API_KEY` nel tuo ambiente di sviluppo o deploy.

Esempio `.env`:
```
GOOGLE_API_KEY=la-tua-chiave-google
```

### Tool supportati
- **Tool 3**: Analisi angle Facebook Ads (Metodo 7C) — ora con Gemini
- **Tool 4**: Analisi landing page GSC — ora con Gemini
- **Tool 5**: Analisi landing page avanzata (10 Metrics) — ora con Gemini
- **Chat AI**: Tutte le risposte AI sono fornite da Gemini

### Come funziona ora l'integrazione AI
- Tutte le chiamate AI passano tramite i flow Genkit e il modello `googleai/gemini-2.5-pro`.
- Non sono più richieste né accettate chiavi OpenAI.
- I prompt sono ottimizzati per Gemini.

### Migrazione da OpenAI
- Tutte le vecchie chiamate fetch a OpenAI sono state rimosse.
- Tutti i riferimenti a OpenAI API Key sono stati eliminati dalla UI e dalla documentazione.

### Troubleshooting
- Se non ricevi risposte AI, verifica che la variabile `GOOGLE_API_KEY` sia correttamente impostata.
- Per problemi con Genkit o GoogleAI, consulta la [documentazione ufficiale Genkit](https://github.com/genkit-dev/genkit) o [Google AI Studio](https://makersuite.google.com/).

---

Per dettagli su ogni tool, consulta la documentazione nelle rispettive cartelle o il file `docs/blueprint.md`.
