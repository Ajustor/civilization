console.log('Start building main code');
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: true,
  target: 'bun',
  // React / react-email exposent des entrées conditionnelles (react-dom/server.node
  // vs .browser vs .edge) que le bundler résout mal : une fois bundlé, react-dom/server
  // devient `undefined` et le rendu des emails échoue
  // (TypeError: Object.hasOwn(undefined, 'renderToReadableStream')).
  // On les laisse EXTERNES : Bun les charge depuis node_modules au runtime (présent
  // dans l'image Docker, hérité du stage `base`), avec la bonne résolution conditionnelle.
  external: ['react', 'react-dom', 'resend', '@react-email/render', '@react-email/components'],
});
