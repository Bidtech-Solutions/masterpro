import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/** Gunakan Link/redirect/useRouter dari sini (bukan next/link) agar path terlokalisasi. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
