console.log('Start building main code')
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  minify: true,
  splitting: true,
  target: 'bun'
})


console.log('Start building threads')
await Bun.build({
  entrypoints: ['./src/modules/world/threads/world.ts'],
  outdir: './dist/threads',
  minify: true,
  splitting: true,
  target: 'bun'
})