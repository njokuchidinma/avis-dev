// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://njokuchidinma.github.io/avis-dev',
	integrations: [
		starlight({
			title: 'Avis',
			description:
				'Ecosystem-agnostic project integration CLI for safely equipping existing software projects.',
			favicon: '/favicon.svg',
			customCss: ['./src/styles/custom.css'],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/njokuchidinma/avis-dev',
				},
			],
			head: [
				{
					tag: 'meta',
					attrs: {
						name: 'theme-color',
						content: '#111827',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:title',
						content: 'Avis - Ecosystem-Agnostic Project Integration CLI',
					},
				},
				{
					tag: 'meta',
					attrs: {
						property: 'og:description',
						content:
							'Equip your project after init with safe ChangePlans, framework-aware integrations, and project health checks.',
					},
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Why Avis?', slug: 'getting-started/why-avis' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Supported Projects', slug: 'getting-started/supported-projects' },
					],
				},
				{
					label: 'Concepts',
					items: [
						{ label: 'How Avis Works', slug: 'concepts/how-avis-works' },
						{ label: 'Capabilities', slug: 'concepts/capabilities' },
						{ label: 'Integrations', slug: 'concepts/integrations' },
						{ label: 'Project Detection', slug: 'concepts/project-detection' },
						{ label: 'ChangePlan', slug: 'concepts/changeplan' },
						{ label: 'Verification', slug: 'concepts/verification' },
						{ label: 'Avis Doctor', slug: 'concepts/avis-doctor' },
						{ label: 'Idempotence', slug: 'concepts/idempotence' },
						{ label: 'Project Safety', slug: 'concepts/project-safety' },
					],
				},
				{
					label: 'Commands',
					items: [{ autogenerate: { directory: 'commands' } }],
				},
				{
					label: 'Guides',
					items: [{ autogenerate: { directory: 'guides' } }],
				},
				{
					label: 'Frameworks',
					items: [{ autogenerate: { directory: 'frameworks' } }],
				},
				{
					label: 'Integrations',
					items: [{ autogenerate: { directory: 'integrations' } }],
				},
				{
					label: 'Contributing',
					items: [{ autogenerate: { directory: 'contributing' } }],
				},
				{
					label: 'Advanced',
					items: [{ autogenerate: { directory: 'advanced' } }],
				},
			],
		}),
	],
});
