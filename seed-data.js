#!/usr/bin/env node
/**
 * Seed Script for Directus CMS Test Data
 *
 * Creates:
 * - Collections: posts, pages, categories, authors
 * - Sample data for each collection
 * - Activity logs through various API operations
 */

const API_URL = 'http://localhost:8055';
const EMAIL = 'admin@example.com';
const PASSWORD = 'admin123';

let authToken = null;

/**
 * Authenticate with Directus and get access token
 */
async function authenticate() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  authToken = data.data.access_token;
  console.log('✅ Authenticated successfully');
  return authToken;
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.statusText}\n${error}`);
  }

  return response.json();
}

/**
 * Create a collection with fields
 */
async function createCollection(collectionName, fields) {
  console.log(`\n📦 Creating collection: ${collectionName}`);

  // Create collection
  await apiRequest('/collections', {
    method: 'POST',
    body: JSON.stringify({
      collection: collectionName,
      meta: {
        collection: collectionName,
        icon: getIconForCollection(collectionName),
        note: `${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)} collection`,
        display_template: null,
        hidden: false,
        singleton: false,
        translations: null,
        archive_field: null,
        archive_app_filter: true,
        archive_value: null,
        unarchive_value: null,
        sort_field: null,
        accountability: 'all',
        color: null,
        item_duplication_fields: null,
        sort: null,
        group: null,
        collapse: 'open',
      },
      schema: {
        name: collectionName,
      },
      fields: [
        {
          field: 'id',
          type: 'integer',
          meta: {
            hidden: true,
            interface: 'input',
            readonly: true,
          },
          schema: {
            is_primary_key: true,
            has_auto_increment: true,
          },
        },
      ],
    }),
  });

  // Add custom fields
  for (const field of fields) {
    await apiRequest(`/fields/${collectionName}`, {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  console.log(`✅ Collection ${collectionName} created with ${fields.length} fields`);
}

/**
 * Get appropriate icon for collection
 */
function getIconForCollection(name) {
  const icons = {
    posts: 'article',
    pages: 'description',
    categories: 'folder',
    authors: 'person',
  };
  return icons[name] || 'box';
}

/**
 * Insert items into a collection
 */
async function insertItems(collection, items) {
  console.log(`\n📝 Inserting ${items.length} items into ${collection}`);

  for (const item of items) {
    await apiRequest(`/items/${collection}`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  console.log(`✅ Inserted ${items.length} items into ${collection}`);
}

/**
 * Generate activity by reading collections
 */
async function generateActivity() {
  console.log('\n🔄 Generating activity logs...');

  const collections = ['posts', 'pages', 'categories', 'authors'];

  for (let i = 0; i < 10; i++) {
    for (const collection of collections) {
      // Read items (generates read activity)
      await apiRequest(`/items/${collection}?limit=10`);

      // Add a small delay to make timestamps different
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('✅ Generated activity logs');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting Directus CMS data seeding...\n');

    // Authenticate
    await authenticate();

    // Create Categories collection
    await createCollection('categories', [
      {
        field: 'name',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'Category name' },
          display: 'raw',
          readonly: false,
          hidden: false,
          required: true,
        },
        schema: {
          name: 'name',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'slug',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'category-slug' },
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'slug',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'description',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'description',
          data_type: 'text',
        },
      },
    ]);

    // Create Authors collection
    await createCollection('authors', [
      {
        field: 'name',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'Author name' },
          display: 'raw',
          readonly: false,
          hidden: false,
          required: true,
        },
        schema: {
          name: 'name',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'email',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'author@example.com' },
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'email',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'bio',
        type: 'text',
        meta: {
          interface: 'input-multiline',
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'bio',
          data_type: 'text',
        },
      },
    ]);

    // Create Posts collection
    await createCollection('posts', [
      {
        field: 'title',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'Post title' },
          display: 'raw',
          readonly: false,
          hidden: false,
          required: true,
        },
        schema: {
          name: 'title',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'slug',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'post-slug' },
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'slug',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'content',
        type: 'text',
        meta: {
          interface: 'input-rich-text-html',
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'content',
          data_type: 'text',
        },
      },
      {
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Draft', value: 'draft' },
              { text: 'Published', value: 'published' },
              { text: 'Archived', value: 'archived' },
            ],
          },
          display: 'labels',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'status',
          data_type: 'varchar',
          max_length: 20,
          default_value: 'draft',
        },
      },
      {
        field: 'category',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          display: 'related-values',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'category',
          data_type: 'integer',
          foreign_key_table: 'categories',
          foreign_key_column: 'id',
        },
      },
      {
        field: 'author',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          display: 'related-values',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'author',
          data_type: 'integer',
          foreign_key_table: 'authors',
          foreign_key_column: 'id',
        },
      },
      {
        field: 'published_date',
        type: 'timestamp',
        meta: {
          interface: 'datetime',
          display: 'datetime',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'published_date',
          data_type: 'timestamp',
        },
      },
    ]);

    // Create Pages collection
    await createCollection('pages', [
      {
        field: 'title',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'Page title' },
          display: 'raw',
          readonly: false,
          hidden: false,
          required: true,
        },
        schema: {
          name: 'title',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'slug',
        type: 'string',
        meta: {
          interface: 'input',
          options: { placeholder: 'page-slug' },
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'slug',
          data_type: 'varchar',
          max_length: 255,
        },
      },
      {
        field: 'content',
        type: 'text',
        meta: {
          interface: 'input-rich-text-html',
          display: 'raw',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'content',
          data_type: 'text',
        },
      },
      {
        field: 'status',
        type: 'string',
        meta: {
          interface: 'select-dropdown',
          options: {
            choices: [
              { text: 'Draft', value: 'draft' },
              { text: 'Published', value: 'published' },
            ],
          },
          display: 'labels',
          readonly: false,
          hidden: false,
        },
        schema: {
          name: 'status',
          data_type: 'varchar',
          max_length: 20,
          default_value: 'draft',
        },
      },
    ]);

    // Insert sample data
    await insertItems('categories', [
      { name: 'Technology', slug: 'technology', description: 'Tech news and tutorials' },
      { name: 'Business', slug: 'business', description: 'Business insights' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle articles' },
      { name: 'Travel', slug: 'travel', description: 'Travel guides and tips' },
    ]);

    await insertItems('authors', [
      { name: 'John Doe', email: 'john@example.com', bio: 'Senior tech writer' },
      { name: 'Jane Smith', email: 'jane@example.com', bio: 'Business analyst' },
      { name: 'Bob Wilson', email: 'bob@example.com', bio: 'Lifestyle blogger' },
    ]);

    await insertItems('posts', [
      {
        title: 'Getting Started with Directus',
        slug: 'getting-started-directus',
        content: '<p>Learn how to use Directus for your projects...</p>',
        status: 'published',
        category: 1,
        author: 1,
        published_date: new Date('2025-01-15').toISOString(),
      },
      {
        title: 'Building Modern APIs',
        slug: 'building-modern-apis',
        content: '<p>Best practices for API development...</p>',
        status: 'published',
        category: 1,
        author: 1,
        published_date: new Date('2025-01-16').toISOString(),
      },
      {
        title: 'Business Growth Strategies',
        slug: 'business-growth',
        content: '<p>Strategies for scaling your business...</p>',
        status: 'published',
        category: 2,
        author: 2,
        published_date: new Date('2025-01-17').toISOString(),
      },
      {
        title: 'Remote Work Tips',
        slug: 'remote-work-tips',
        content: '<p>Tips for effective remote work...</p>',
        status: 'published',
        category: 3,
        author: 3,
        published_date: new Date('2025-01-18').toISOString(),
      },
      {
        title: 'Best Travel Destinations 2025',
        slug: 'travel-destinations-2025',
        content: '<p>Top places to visit in 2025...</p>',
        status: 'published',
        category: 4,
        author: 3,
        published_date: new Date('2025-01-19').toISOString(),
      },
      {
        title: 'Draft Post Example',
        slug: 'draft-post',
        content: '<p>This is a draft post...</p>',
        status: 'draft',
        category: 1,
        author: 1,
        published_date: null,
      },
    ]);

    await insertItems('pages', [
      {
        title: 'About Us',
        slug: 'about',
        content: '<p>Learn more about our company...</p>',
        status: 'published',
      },
      {
        title: 'Contact',
        slug: 'contact',
        content: '<p>Get in touch with us...</p>',
        status: 'published',
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy',
        content: '<p>Our privacy policy...</p>',
        status: 'published',
      },
    ]);

    // Generate activity logs
    await generateActivity();

    console.log('\n✅ Data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Collections: categories, authors, posts, pages');
    console.log('  - Categories: 4 items');
    console.log('  - Authors: 3 items');
    console.log('  - Posts: 6 items (5 published, 1 draft)');
    console.log('  - Pages: 3 items');
    console.log('  - Activity logs: ~40 entries');
    console.log('\n🎯 You can now test the Usage Analytics extension!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
