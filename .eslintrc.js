module.exports = {
	env: {
		es2021: true,
	},
	extends: [
		'eslint:recommended',
		/* optional */
		// 'eslint:all',
		// 'plugin:prettier/recommended',
	],
	ignorePatterns: ['.eslintrc.*', '/dist'],
	// "noInlineConfig": true,
	/* parser: '@typescript-eslint/parser', */
	parserOptions: { ecmaVersion: 'latest' },
	/* plugins: ['@typescript-eslint'], */
	reportUnusedDisableDirectives: true,
	root: true,
	rules: {
		'@typescript-eslint/await-thenable': ['error'],
		'@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
		'@typescript-eslint/prefer-as-const': ['warn'],
		camelcase: ['warn'],
		'consistent-return': ['error', { treatUndefinedAsUnspecified: true }],
		'default-param-last': ['error'],
		'dot-notation': ['warn'],
		eqeqeq: ['warn'],
		'func-style': ['warn', 'declaration', { allowArrowFunctions: false }],
		'logical-assignment-operators': ['warn', 'always'],
		'no-constant-binary-expression': ['error'],
		'no-constructor-return': ['error'],
		'no-duplicate-imports': ['error'],
		'no-else-return': ['warn'],
		'no-invalid-this': ['error'],
		'no-lone-blocks': ['error'],
		'no-lonely-if': ['error'],
		'no-loop-func': ['error'],
		/* 'no-magic-numbers': ['warn'], */
		'no-negated-condition': ['warn'],
		'no-new-native-nonconstructor': ['error'],
		'no-new-wrappers': ['error'],
		'no-promise-executor-return': ['error'],
		'no-return-assign': ['warn'],
		'no-self-compare': ['error'],
		'no-throw-literal': ['error'],
		'no-unmodified-loop-condition': ['error'],
		'no-unneeded-ternary': ['warn'],
		'no-unreachable-loop': ['error'],
		'no-unused-expressions': ['error'],
		'no-unused-private-class-members': ['error'],
		'no-useless-computed-key': ['error'],
		'no-useless-concat': ['error'],
		'no-useless-constructor': ['error'],
		'no-useless-return': ['error'],
		'no-var': ['error'],
		// 'no-warning-comments': ['warn'],
		'operator-assignment': ['warn'],
		'prefer-arrow-callback': ['warn'],
		'prefer-const': ['error'],
		'prefer-destructuring': ['warn'],
		'prefer-numeric-literals': ['warn'],
		'prefer-promise-reject-errors': ['warn'],
		'prefer-rest-params': ['warn'],
		'prefer-template': ['warn'],
		'require-await': ['error'],
		/* 'sort-imports': ['warn'], */
		/* 'sort-keys': ['warn'], */
		yoda: ['warn'],
	},
};
