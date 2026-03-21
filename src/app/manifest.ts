import type { MetadataRoute } from "next";

import { CURRENTO_BRAND_COLORS } from "@/lib/currento_logo";
import { i18n } from "@/model/i18n";

export default function manifest(): MetadataRoute.Manifest {
  const name = i18n.t("metadata.title") as string;
  const description = i18n.t("metadata.description") as string;

  return {
    name,
    short_name: name,
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#EFF3F7",
    theme_color: CURRENTO_BRAND_COLORS.background,
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
