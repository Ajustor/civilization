module.exports = {
	plugins: [
		//Some plugins, like tailwindcss/nesting, need to run before Tailwind,
		"@tailwindcss/postcss": {},
		//But others, like autoprefixer, need to run after,
		"autoprefixer": {}
	]
}
