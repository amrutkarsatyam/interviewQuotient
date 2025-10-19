// client/src/utils/speech.js
export class SpeechManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSpeaking = false;
  }

  async speakAsync(text) {
    if (!text || !this.synth) return "skipped";
    if (this.synth.speaking || this.synth.pending) this.synth.cancel();
    
    return new Promise((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      this.isSpeaking = true;
      u.onend = () => { this.isSpeaking = false; resolve("ended"); };
      u.onerror = (e) => { 
        this.isSpeaking = false; 
        if (e.error === "interrupted" || e.error === "canceled") {
            resolve(e.error);
        } else {
            reject(e);
        }
      };
      this.synth.speak(u);
    });
  }

  cancel() {
    if (this.synth && (this.synth.speaking || this.synth.pending)) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}