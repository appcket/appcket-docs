module.exports = {
  title: 'Appcket Documentation',
  tagline: 'Learn how to use Appcket for your application',
  url: 'https://docs.appcket.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'appcket', // Usually your GitHub org/user name.
  projectName: 'appcket-docs', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'Docs Home',
      logo: {
        alt: 'Appcket Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: 'https://appcket.org/',
          label: 'Appcket.org',
        },
        {
          href: 'https://github.com/appcket/appcket-org',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Style Guide',
              to: 'docs/',
            },
            {
              label: 'Second Doc',
              to: 'docs/doc2/',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/appcket',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/appcket',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/appcket/appcket',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Appcket. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/appcket/appket-docs/',
          routeBasePath: '/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
