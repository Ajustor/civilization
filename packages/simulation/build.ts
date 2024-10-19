console.log('Start building main code')
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: true,
  splitting: true
})
console.log('Start building threads')


await Bun.build({
  entrypoints: ['./src/threads/world.ts', './src/threads/civilization.ts'],
  outdir: './dist/threads',
  minify: true,
  splitting: true
})