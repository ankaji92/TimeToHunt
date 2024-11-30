import type { Config } from "tailwindcss";
import { colors } from './src/theme/colors';

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  important: "#__next",
  theme: {
    extend: {
      colors: {
        primary: {
          light: colors.primary.light,
          DEFAULT: colors.primary.main,
          dark: colors.primary.dark,
        },
        secondary: {
          light: colors.secondary.light,
          DEFAULT: colors.secondary.main,
          dark: colors.secondary.dark,
        }
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};

export default config;

module.exports = {
}