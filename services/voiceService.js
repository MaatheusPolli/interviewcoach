// Voice Input and Output Service
export class VoiceService {
  constructor() {
    this.recognition = null;
    this.locale = 'pt-BR'; // Unified locale
    
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
    }
  }

  isSupported() {
    return !!this.recognition;
  }

  setLanguage(locale) {
    this.locale = locale;
    if (this.recognition) {
      this.recognition.lang = locale;
    }
  }

  startListening(onInterim, onFinal) {
    if (!this.recognition) return;
    
    this.recognition.lang = this.locale;

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript).join('');
      if (event.results[0].isFinal) {
        onFinal(transcript);
      } else {
        onInterim(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    this.recognition.start();
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // TTS for reading questions aloud
  speak(text, lang = null, onStart = null, onEnd = null) {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = lang || this.locale;
    utterance.lang = targetLang;
    utterance.rate = 1.0; // Slightly faster for natural feel
    utterance.pitch = 1.0;

    // Try to find a more natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => 
      v.lang.startsWith(targetLang.split('-')[0]) && 
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))
    );
    
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  }

  cancel() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}
