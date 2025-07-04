# SEO Toolkit Pro — Blueprint Tecnico

## Integrazione AI (2024)

### Modello AI utilizzato
- Tutte le analisi AI (tool 3, tool 4, tool 5, chat, ecc.) usano **Gemini 2.5 Pro** tramite [Genkit](https://github.com/genkit-dev/genkit) e GoogleAI.
- Il modello usato nei flow è `googleai/gemini-2.5-pro`.

### Configurazione ambiente
- È richiesta la variabile d'ambiente `GOOGLE_API_KEY`.
- Ottieni la chiave su [Google AI Studio](https://makersuite.google.com/app/apikey).
- Esempio `.env`:
  ```
  GOOGLE_API_KEY=la-tua-chiave-google
  ```

### Prompt e compatibilità
- Tutti i prompt sono ottimizzati per Gemini (risposte strutturate, JSON, ecc).
- I flow Genkit sono usati per tutte le chiamate AI.
- Non sono più supportate chiavi OpenAI né modelli OpenAI.

### Tool coperti
- **Tool 3**: Analisi angle Facebook Ads (Metodo 7C)
- **Tool 4**: Analisi landing page GSC
- **Tool 5**: Analisi landing page avanzata (10 Metrics)
- **Chat AI**: Risposte fornite da Gemini

### Troubleshooting
- Se le analisi AI non funzionano, verifica la variabile `GOOGLE_API_KEY`.
- Consulta la documentazione Genkit o GoogleAI per errori di autenticazione o limiti API.

---

## Note di migrazione
- Tutte le chiamate fetch a OpenAI sono state rimosse.
- Tutti i riferimenti a OpenAI API Key sono stati eliminati dalla UI e dalla documentazione.
- La UI ora mostra solo riferimenti a Gemini/GoogleAI.

---

Per dettagli sui singoli tool, vedi la documentazione nelle rispettive cartelle o il README principale.