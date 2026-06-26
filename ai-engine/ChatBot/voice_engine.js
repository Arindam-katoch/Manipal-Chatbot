import Vapi from "@vapi-ai/web";

const REQUIRED_ENV_KEYS = [
  "NEXT_PUBLIC_VAPI_PUBLIC_KEY",
  "NEXT_PUBLIC_VAPI_ASSISTANT_ID",
];

const DEFAULT_STATE = {
  isActive: false,
  isConnecting: false,
  isListening: false,
  isSpeaking: false,
  isAssistantSpeaking: false,
  isUserSpeaking: false,
  error: null,
  transcript: [],
};

function readVapiEnv(env = process.env) {
  const publicKey = env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key]);

  return {
    publicKey,
    assistantId,
    missing,
    isConfigured: missing.length === 0,
  };
}

function normalizeTranscriptMessage(message) {
  if (!message || typeof message !== "object") {
    return null;
  }

  const role = message.role || message.speaker || message.type;
  const content = message.transcript || message.message || message.content || "";

  if (!role || !content) {
    return null;
  }

  return {
    role: role === "assistant" || role === "bot" ? "assistant" : "user",
    content,
    timestamp: Date.now(),
  };
}

export function createChatbotVoiceEngine(options = {}) {
  const config = readVapiEnv(options.env);
  const onStateChange = options.onStateChange || (() => {});
  const onTranscript = options.onTranscript || (() => {});
  const onError = options.onError || (() => {});
  let vapi = null;
  let state = { ...DEFAULT_STATE };

  function setState(patch) {
    state = { ...state, ...patch };
    onStateChange(state);
    return state;
  }

  function resetState(patch = {}) {
    return setState({
      ...DEFAULT_STATE,
      transcript: state.transcript,
      ...patch,
    });
  }

  function pushTranscript(message) {
    const normalized = normalizeTranscriptMessage(message);
    if (!normalized) {
      return;
    }

    const transcript = [...state.transcript, normalized];
    setState({ transcript });
    onTranscript(normalized, transcript);
  }

  function ensureConfigured() {
    if (!config.isConfigured) {
      throw new Error(`Missing Vapi env variables: ${config.missing.join(", ")}`);
    }
  }

  function ensureBrowserMic() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not available in this browser.");
    }
  }

  function bindEvents(instance) {
    instance.on("call-start", () => {
      setState({
        isActive: true,
        isConnecting: false,
        isListening: true,
        error: null,
      });
    });

    instance.on("call-end", () => {
      resetState();
    });

    instance.on("speech-start", () => {
      setState({
        isSpeaking: true,
        isAssistantSpeaking: true,
        isUserSpeaking: false,
        isListening: false,
      });
    });

    instance.on("speech-end", () => {
      setState({
        isSpeaking: false,
        isAssistantSpeaking: false,
        isListening: state.isActive,
      });
    });

    instance.on("message", (message) => {
      if (message?.type === "speech-update") {
        const role = message.role || message.speaker;
        const isStarted = message.status === "started" || message.status === "speaking";
        const isEnded = message.status === "stopped" || message.status === "ended";

        if (role === "user" && (isStarted || isEnded)) {
          setState({
            isUserSpeaking: isStarted,
            isAssistantSpeaking: isStarted ? false : state.isAssistantSpeaking,
            isListening: isEnded && state.isActive,
          });
        }

        if ((role === "assistant" || role === "bot") && (isStarted || isEnded)) {
          setState({
            isAssistantSpeaking: isStarted,
            isUserSpeaking: isStarted ? false : state.isUserSpeaking,
            isSpeaking: isStarted,
            isListening: isEnded && state.isActive,
          });
        }
      }

      if (message?.type === "transcript" || message?.transcript || message?.message) {
        pushTranscript(message);
      }
    });

    instance.on("error", (error) => {
      const message = error?.message || "Vapi voice session failed.";
      setState({
        isConnecting: false,
        error: message,
      });
      onError(error);
    });
  }

  async function start() {
    try {
      ensureConfigured();
      ensureBrowserMic();
      setState({
        isConnecting: true,
        isActive: false,
        isListening: false,
        isSpeaking: false,
        isAssistantSpeaking: false,
        isUserSpeaking: false,
        error: null,
      });

      await navigator.mediaDevices.getUserMedia({ audio: true });

      if (!vapi) {
        vapi = new Vapi(config.publicKey);
        bindEvents(vapi);
      }

      await vapi.start(config.assistantId);
      return state;
    } catch (error) {
      const message =
        error?.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : error?.message || "Unable to start Vapi voice mode.";

      resetState({ error: message });
      onError(error);
      throw error;
    }
  }

  async function stop() {
    try {
      if (vapi) {
        await vapi.stop();
      }
    } catch (error) {
      const message = error?.message || "Unable to stop Vapi voice mode cleanly.";
      setState({ error: message });
      onError(error);
    } finally {
      resetState();
    }
  }

  function getState() {
    return state;
  }

  return {
    start,
    stop,
    getState,
    isConfigured: config.isConfigured,
    missingEnv: config.missing,
  };
}
