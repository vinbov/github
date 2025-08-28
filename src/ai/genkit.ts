import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Configurazione base di Genkit per usare solo Google AI.
// Nota: Con il nuovo approccio OpenRouter, questo file diventerà meno importante.
export default genkit({
  plugins: [
    googleAI(),
  ],
});