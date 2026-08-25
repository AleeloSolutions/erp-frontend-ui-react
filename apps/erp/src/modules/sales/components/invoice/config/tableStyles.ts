import type { ComponentType } from "react";
import type { TableStyleKey } from "../types/invoice";
import type { TableStyleProps } from "../tables/types";
import { LightTable } from "../tables/LightTable";
import { StripedTable } from "../tables/StripedTable";
import { BorderedTable } from "../tables/BorderedTable";

export interface TableStyleEntry {
  label: string;
  thumbnail: string;
  component: ComponentType<TableStyleProps>;
}

export const tableStyles: Record<TableStyleKey, TableStyleEntry> = {
  light: {
    label: "Light",
    thumbnail: "/thumbnails/light.svg",
    component: LightTable,
  },
  striped: {
    label: "Striped",
    thumbnail: "/thumbnails/striped.svg",
    component: StripedTable,
  },
  bordered: {
    label: "Bordered",
    thumbnail: "/thumbnails/bordered.svg",
    component: BorderedTable,
  },
};
