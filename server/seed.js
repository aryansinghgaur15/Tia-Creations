import 'dotenv/config';
import { prisma } from './lib/prisma.js';
import { hashPassword } from './lib/auth.js';
import { computeScopes } from './lib/scopes.js';

const CATEGORIES = [
  { name: 'Painting', slug: 'painting', children: [
    { name: 'Oil Painting', slug: 'oil-painting' },
    { name: 'Acrylic Painting', slug: 'acrylic-painting' },
    { name: 'Watercolor', slug: 'watercolor' },
    { name: 'Mixed Media', slug: 'mixed-media-painting' },
    { name: 'Gouache', slug: 'gouache' },
    { name: 'Spray Paint', slug: 'spray-paint' },
  ]},
  { name: 'Drawing', slug: 'drawing', children: [
    { name: 'Pencil / Graphite', slug: 'pencil-graphite' },
    { name: 'Charcoal', slug: 'charcoal' },
    { name: 'Ink', slug: 'ink' },
    { name: 'Pastel', slug: 'pastel' },
    { name: 'Pen & Ink', slug: 'pen-ink' },
    { name: 'Marker', slug: 'marker' },
  ]},
  { name: 'Photography', slug: 'photography', children: [
    { name: 'Landscape Photography', slug: 'landscape-photography' },
    { name: 'Portrait Photography', slug: 'portrait-photography' },
    { name: 'Street Photography', slug: 'street-photography' },
    { name: 'Nature Photography', slug: 'nature-photography' },
    { name: 'Architecture Photography', slug: 'architecture-photography' },
  ]},
  { name: 'Sculpture', slug: 'sculpture', children: [
    { name: 'Wood Sculpture', slug: 'wood-sculpture' },
    { name: 'Bronze Sculpture', slug: 'bronze-sculpture' },
    { name: 'Clay Sculpture', slug: 'clay-sculpture' },
    { name: 'Metal Sculpture', slug: 'metal-sculpture' },
    { name: 'Stone Sculpture', slug: 'stone-sculpture' },
  ]},
  { name: 'Digital Art', slug: 'digital-art', children: [
    { name: 'Digital Painting', slug: 'digital-painting' },
    { name: '3D Art', slug: '3d-art' },
    { name: 'Pixel Art', slug: 'pixel-art' },
    { name: 'Vector Art', slug: 'vector-art' },
  ]},
  { name: 'Printmaking', slug: 'printmaking', children: [
    { name: 'Linocut', slug: 'linocut' },
    { name: 'Woodcut', slug: 'woodcut' },
    { name: 'Lithography', slug: 'lithography' },
    { name: 'Screen Print', slug: 'screen-print' },
    { name: 'Etching', slug: 'etching' },
  ]},
  { name: 'Textile Art', slug: 'textile-art', children: [
    { name: 'Embroidery', slug: 'embroidery' },
    { name: 'Fabric Painting', slug: 'fabric-painting' },
    { name: 'Weaving', slug: 'weaving' },
    { name: 'Quilting', slug: 'quilting' },
  ]},
  { name: 'Mixed Media & Collage', slug: 'mixed-media-collage', children: [
    { name: 'Paper Collage', slug: 'paper-collage' },
    { name: 'Found Object Art', slug: 'found-object-art' },
    { name: 'Assemblage', slug: 'assemblage' },
  ]},
];

async function seedCategories() {
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log('Categories already seeded:', existing);
    return;
  }
  for (const parent of CATEGORIES) {
    const created = await prisma.category.create({
      data: { name: parent.name, slug: parent.slug },
    });
    for (const child of (parent.children || [])) {
      await prisma.category.create({
        data: { name: child.name, slug: child.slug, parentId: created.id },
      });
    }
  }
  console.log(`Seeded ${CATEGORIES.length} parent categories with children`);
}

const TAXONOMIES = {
  medium: [
    'Oil', 'Acrylic', 'Watercolor', 'Gouache', 'Pastel', 'Charcoal',
    'Ink', 'Pencil', 'Digital', 'Mixed Media', 'Spray Paint', 'Marker',
    'Pen & Ink', 'Wood', 'Bronze', 'Clay', 'Metal', 'Stone',
    'Photography', 'Linocut', 'Woodcut', 'Lithography', 'Screen Print',
    'Fabric', 'Embroidery', 'Weaving', 'Paper Collage',
  ],
  style: [
    'Abstract', 'Modern', 'Contemporary', 'Traditional', 'Realism',
    'Impressionism', 'Expressionism', 'Minimal', 'Figurative',
    'Surrealism', 'Pop Art', 'Cubism', 'Art Deco', 'Folk Art',
    'Tribal', 'Street Art', 'Digital Art',
  ],
  theme: [
    'Landscape', 'Portrait', 'Nature', 'Spiritual', 'Abstract',
    'Cityscape', 'Floral', 'Wildlife', 'Village', 'Sunset',
    'People', 'Architecture', 'Minimal', 'Cultural',
  ],
  subject: [
    'Landscape', 'Portrait', 'Nature', 'Spiritual', 'Abstract',
    'Cityscape', 'Floral', 'Wildlife', 'People', 'Architecture',
    'Village', 'Cultural', 'Mythology', 'Religious',
  ],
};

async function seedTaxonomies() {
  for (const [type, items] of Object.entries(TAXONOMIES)) {
    const existing = await prisma.taxonomy.count({ where: { type } });
    if (existing > 0) {
      console.log(`Taxonomy "${type}" already seeded: ${existing}`);
      continue;
    }
    for (const name of items) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await prisma.taxonomy.create({ data: { type, name, slug } });
    }
    console.log(`Seeded ${items.length} "${type}" taxonomy items`);
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@tiacreations.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const fullName = process.env.ADMIN_NAME || 'TIA Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
  } else {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        fullName,
        displayName: fullName,
        role: 'admin',
        artistStatus: 'none',
      },
    });
    const scopes = computeScopes(user);
    await prisma.user.update({ where: { id: user.id }, data: { scopes } });
    console.log('Admin seeded:', email);
  }

  await seedCategories();
  await seedTaxonomies();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
