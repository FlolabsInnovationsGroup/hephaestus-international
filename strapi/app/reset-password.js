// Reset Strapi admin password
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node reset-password.js <email> <new-password>');
    process.exit(1);
  }

  // Connect to database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    const result = await client.query(
      'UPDATE admin_users SET password = $1 WHERE email = $2 RETURNING email, firstname, lastname',
      [hashedPassword, email]
    );

    if (result.rowCount === 0) {
      console.error(`❌ No user found with email: ${email}`);
    } else {
      console.log('✅ Password reset successfully for:');
      console.log(result.rows[0]);
      console.log(`\nNew password: ${newPassword}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword().catch(console.error);
