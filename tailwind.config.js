/** @type {import('tailwindcss').Config} */
module.exports = {
   content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
   // "class": required by NativeWind v4 to switch the color scheme manually (colorScheme.set), "system" still follows the OS
   darkMode: "class",
   presets: [require("nativewind/preset")],
   theme: {
      extend: {
         fontFamily: {
            marker: ["PermanentMarker-Regular", "sans-serif"],
         },
      },
   },
   plugins: [],
}
