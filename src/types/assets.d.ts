// Allow side-effect imports of stylesheets under standalone `tsc --noEmit`.
// (Next's own build understands these via its compiler plugin.)
declare module "*.css";
