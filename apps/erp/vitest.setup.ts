import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { uiI18nResources } from "@erp/ui";

// The shared components read their chrome strings through i18next; give
// the tests the same English resources the app boots with.
if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: uiI18nResources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "ui",
    ns: ["common", "ui"],
    interpolation: { escapeValue: false },
  });
}

// jsdom has no ResizeObserver; DataTable and the sticky headers measure
// themselves with it. A stub that never fires keeps their layout static.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Nor a visualViewport (the shell's sticky offsets read it): a fixed one.
if (typeof window !== "undefined" && !window.visualViewport) {
  const viewport = {
    width: 1280,
    height: 800,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    onresize: null,
    onscroll: null,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return true;
    },
  };
  Object.defineProperty(window, "visualViewport", {
    value: viewport,
    configurable: true,
  });
}
