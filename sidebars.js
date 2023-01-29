module.exports = {
  main: [
    'welcome',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/prerequisites',
        'getting-started/installation-initial-setup'
      ]
    },
    {
      type: 'category',
      label: 'Production',
      items: [
        'production/provision',
        'production/build-deploy'
      ]
    },
    'troubleshooting',
    'best-practices'
  ],
};
