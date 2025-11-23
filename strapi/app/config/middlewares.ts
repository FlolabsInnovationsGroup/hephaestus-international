export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:3001', // Local development
        'https://flolabsfrontend-qjspkjdvi-flomad-dev.vercel.app', // Vercel production
        'https://hephaestus.international', // Custom domain (when configured)
        'https://www.hephaestus.international', // Custom domain with www
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: '256mb', // Form data limit
      jsonLimit: '256mb', // JSON payload limit
      textLimit: '256mb', // Text payload limit
      formidable: {
        maxFileSize: 250 * 1024 * 1024, // 250MB for file uploads
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
