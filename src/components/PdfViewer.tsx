// TypeScript fallback. Metro selects PdfViewer.web.tsx on web and
// PdfViewer.native.tsx on Android/iOS for extensionless imports.
export { default } from "./PdfViewer.native";
