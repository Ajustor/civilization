module.exports = {
	// PostCSS plugins must be an object map (or an array of plugin names). The
	// previous version put object-property syntax inside an array literal, which
	// is a JS syntax error — PostCSS then failed to load and Tailwind never ran,
	// leaving the whole site unstyled.
	plugins: {
		'@tailwindcss/postcss': {},
		autoprefixer: {},
	},
}
