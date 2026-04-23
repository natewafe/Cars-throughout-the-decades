import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "camera-orbit"?: string;
          "camera-controls"?: string | boolean;
          "touch-action"?: string;
          "disable-zoom"?: string | boolean;
          "interaction-prompt"?: string;
          "shadow-intensity"?: string | number;
          exposure?: string | number;
          "environment-image"?: string;
          reveal?: string;
        },
        HTMLElement
      >;
    }
  }
}
