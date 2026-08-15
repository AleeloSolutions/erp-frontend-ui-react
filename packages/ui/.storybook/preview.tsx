import type { Preview } from "@storybook/react";
import { useEffect, type ReactNode } from "react";
import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { uiI18nResources } from "../src/i18n";
import "./preview.css";

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

function DirectionDecorator({
  direction,
  children,
}: {
  direction: "ltr" | "rtl";
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = direction === "rtl" ? "ar" : "en";
  }, [direction]);

  return (
    <I18nextProvider i18n={i18n}>
      <div
        dir={direction}
        className="min-h-screen bg-erp-bg p-4 font-sans text-erp-text"
      >
        {children}
      </div>
    </I18nextProvider>
  );
}

const preview: Preview = {
  globalTypes: {
    direction: {
      name: "Direction",
      description: "HTML writing direction",
      defaultValue: "ltr",
      toolbar: {
        icon: "globe",
        items: [
          { value: "ltr", title: "LTR" },
          { value: "rtl", title: "RTL" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const direction = (context.globals.direction as "ltr" | "rtl") ?? "ltr";
      return (
        <DirectionDecorator direction={direction}>
          <Story />
        </DirectionDecorator>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "padded",
  },
};

export default preview;
