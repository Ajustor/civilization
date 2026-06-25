// sveltekit-superforms' `/adapters` barrel eagerly evaluates EVERY adapter,
// including the TypeBox one (`adapters/typebox.js`), which throws
// "Class extends value undefined" with the installed `typebox` package
// (version/ESM-interop mismatch). That crash breaks every form page
// (login, register, civilization creation, civilization config…).
//
// We only use the Zod (v4) adapter, so re-export it straight from its module,
// bypassing the barrel. The deep subpath is not declared in the package
// "exports", so it is reached via a relative node_modules path (a plain file
// import is not subject to "exports" enforcement). zod4.js only imports
// `zod/v4/core` + internal helpers — never typebox.
export {
	zod,
	zodClient,
} from '../../../node_modules/sveltekit-superforms/dist/adapters/zod4.js'
